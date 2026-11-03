package websocket

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gochat/backend/internal/redis"
)

type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Fast lookup of client by UserID
	userClients map[uuid.UUID]map[*Client]bool

	// Channel subscriptions
	channelSubs map[uuid.UUID]map[*Client]bool

	// Register requests from clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	// Mutex for thread safety
	mu sync.RWMutex

	// Redis client for PubSub and Presence
	redisClient *redis.Client
}

func NewHub(redisClient *redis.Client) *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		userClients: make(map[uuid.UUID]map[*Client]bool),
		channelSubs: make(map[uuid.UUID]map[*Client]bool),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		redisClient: redisClient,
	}
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			if _, exists := h.userClients[client.UserID]; !exists {
				h.userClients[client.UserID] = make(map[*Client]bool)
			}
			h.userClients[client.UserID][client] = true
			h.mu.Unlock()

			// Update Redis presence
			_ = h.redisClient.SetPresence(ctx, client.UserID.String(), "online", 24*time.Hour)

			// Broadcast presence online
			pData, _ := json.Marshal(PresencePayload{
				UserID:    client.UserID,
				Status:    "online",
				Timestamp: time.Now().UTC(),
			})
			h.BroadcastEvent(EventPresenceOnline, pData, nil)
			log.Printf("WS client connected: %s (%s)", client.Username, client.UserID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)

				if uClients, exists := h.userClients[client.UserID]; exists {
					delete(uClients, client)
					if len(uClients) == 0 {
						delete(h.userClients, client.UserID)
						// Update Redis presence
						_ = h.redisClient.SetPresence(ctx, client.UserID.String(), "offline", 24*time.Hour)

						pData, _ := json.Marshal(PresencePayload{
							UserID:    client.UserID,
							Status:    "offline",
							Timestamp: time.Now().UTC(),
						})
						go h.BroadcastEvent(EventPresenceOffline, pData, nil)
					}
				}

				// Remove from channel subscriptions
				for chID := range client.Channels {
					if subs, ok := h.channelSubs[chID]; ok {
						delete(subs, client)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("WS client disconnected: %s (%s)", client.Username, client.UserID)
		}
	}
}

// BroadcastEvent sends an event to all clients, or to a specific channel if channelID != nil
func (h *Hub) BroadcastEvent(event string, data json.RawMessage, channelID *uuid.UUID) {
	msgBytes, err := json.Marshal(EventMessage{
		Event: event,
		Data:  data,
	})
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if channelID != nil {
		// Broadcast to all clients (in server workspace)
		for client := range h.clients {
			select {
			case client.Send <- msgBytes:
			default:
			}
		}
	} else {
		for client := range h.clients {
			select {
			case client.Send <- msgBytes:
			default:
			}
		}
	}
}

// SendToUser sends an event directly to a specific user (all their active sessions)
func (h *Hub) SendToUser(userID uuid.UUID, event string, data json.RawMessage) {
	msgBytes, err := json.Marshal(EventMessage{
		Event: event,
		Data:  data,
	})
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if uClients, exists := h.userClients[userID]; exists {
		for client := range uClients {
			select {
			case client.Send <- msgBytes:
			default:
			}
		}
	}
}


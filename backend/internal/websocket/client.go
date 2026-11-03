package websocket

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

type Client struct {
	Hub          *Hub
	Conn         *websocket.Conn
	UserID       uuid.UUID
	Username     string
	Send         chan []byte
	Channels     map[uuid.UUID]bool // Channels subscribed to
	mu           sync.RWMutex
	cancelWriter context.CancelFunc
}

func NewClient(hub *Hub, conn *websocket.Conn, userID uuid.UUID, username string) *Client {
	return &Client{
		Hub:      hub,
		Conn:     conn,
		UserID:   userID,
		Username: username,
		Send:     make(chan []byte, 256),
		Channels: make(map[uuid.UUID]bool),
	}
}

func (c *Client) ReadPump(ctx context.Context) {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close(websocket.StatusNormalClosure, "")
	}()

	for {
		_, message, err := c.Conn.Read(ctx)
		if err != nil {
			if websocket.CloseStatus(err) != websocket.StatusNormalClosure &&
				websocket.CloseStatus(err) != websocket.StatusGoingAway {
				log.Printf("WS read error for user %s: %v", c.Username, err)
			}
			break
		}

		var event EventMessage
		if err := json.Unmarshal(message, &event); err != nil {
			continue
		}

		c.handleIncomingEvent(ctx, event)
	}
}

func (c *Client) WritePump(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-c.Send:
			if !ok {
				c.Conn.Close(websocket.StatusNormalClosure, "")
				return
			}
			writeCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
			err := c.Conn.Write(writeCtx, websocket.MessageText, msg)
			cancel()
			if err != nil {
				return
			}
		}
	}
}

func (c *Client) handleIncomingEvent(ctx context.Context, event EventMessage) {
	switch event.Event {
	case EventSubscribe:
		var sub SubscribePayload
		if err := json.Unmarshal(event.Data, &sub); err == nil && sub.ChannelID != nil {
			c.mu.Lock()
			c.Channels[*sub.ChannelID] = true
			c.mu.Unlock()
		}
	case EventUnsubscribe:
		var sub SubscribePayload
		if err := json.Unmarshal(event.Data, &sub); err == nil && sub.ChannelID != nil {
			c.mu.Lock()
			delete(c.Channels, *sub.ChannelID)
			c.mu.Unlock()
		}
	case EventTypingStart, EventTypingStop:
		var typing TypingPayload
		if err := json.Unmarshal(event.Data, &typing); err == nil {
			typing.UserID = c.UserID
			typing.Username = c.Username
			data, _ := json.Marshal(typing)
			c.Hub.BroadcastEvent(event.Event, data, typing.ChannelID)
		}
	}
}


package websocket

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"gochat/backend/internal/redis"
)

func TestHubClientRegistrationAndBroadcast(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	mockRedis := redis.Connect("127.0.0.1:99999") // Trigger in-memory fallback
	hub := NewHub(mockRedis)
	go hub.Run(ctx)

	userID := uuid.New()
	client := &Client{
		Hub:      hub,
		UserID:   userID,
		Username: "tester",
		Send:     make(chan []byte, 10),
		Channels: make(map[uuid.UUID]bool),
	}

	hub.Register <- client

	// Give goroutine a moment to process register
	time.Sleep(50 * time.Millisecond)

	hub.mu.RLock()
	if !hub.clients[client] {
		t.Errorf("Expected client to be registered in hub.clients")
	}
	if len(hub.userClients[userID]) == 0 {
		t.Errorf("Expected client to be present in hub.userClients")
	}
	hub.mu.RUnlock()

	// Drain the initial presence.online event
	select {
	case pMsg := <-client.Send:
		var pEvent EventMessage
		_ = json.Unmarshal(pMsg, &pEvent)
		if pEvent.Event != EventPresenceOnline {
			t.Logf("Got event before message: %s", pEvent.Event)
		}
	case <-time.After(500 * time.Millisecond):
	}

	// Test broadcast
	testPayload, _ := json.Marshal(map[string]string{"text": "hello world"})
	hub.BroadcastEvent(EventMessageCreate, testPayload, nil)

	select {
	case msg := <-client.Send:
		var event EventMessage
		if err := json.Unmarshal(msg, &event); err != nil {
			t.Fatalf("Failed to unmarshal received event: %v", err)
		}
		if event.Event != EventMessageCreate {
			t.Errorf("Expected event %s, got %s", EventMessageCreate, event.Event)
		}
	case <-time.After(500 * time.Millisecond):
		t.Errorf("Timed out waiting for broadcast event")
	}

	// Test Unregister
	hub.Unregister <- client
	time.Sleep(50 * time.Millisecond)

	hub.mu.RLock()
	if hub.clients[client] {
		t.Errorf("Expected client to be unregistered")
	}
	hub.mu.RUnlock()
}


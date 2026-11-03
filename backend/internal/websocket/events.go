package websocket

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	EventMessageCreate = "message.create"
	EventMessageUpdate = "message.update"
	EventMessageDelete = "message.delete"

	EventTypingStart = "typing.start"
	EventTypingStop  = "typing.stop"

	EventPresenceOnline  = "presence.online"
	EventPresenceOffline = "presence.offline"
	EventPresenceUpdate  = "presence.update"

	EventChannelJoin  = "channel.join"
	EventChannelLeave = "channel.leave"
	EventSubscribe    = "subscribe"
	EventUnsubscribe  = "unsubscribe"
)

type EventMessage struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

type TypingPayload struct {
	ChannelID      *uuid.UUID `json:"channel_id,omitempty"`
	ConversationID *uuid.UUID `json:"conversation_id,omitempty"`
	UserID         uuid.UUID  `json:"user_id"`
	Username       string     `json:"username"`
}

type PresencePayload struct {
	UserID    uuid.UUID `json:"user_id"`
	Status    string    `json:"status"` // online, idle, dnd, offline
	Timestamp time.Time `json:"timestamp"`
}

type SubscribePayload struct {
	ChannelID      *uuid.UUID `json:"channel_id,omitempty"`
	ConversationID *uuid.UUID `json:"conversation_id,omitempty"`
}


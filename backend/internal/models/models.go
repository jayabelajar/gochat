package models

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	Username     string     `json:"username"`
	DisplayName  string     `json:"display_name"`
	PasswordHash string     `json:"-"`
	AvatarURL    *string    `json:"avatar_url"`
	Bio          string     `json:"bio"`
	Status       string     `json:"status"` // online, idle, dnd, offline
	LastSeenAt   *time.Time `json:"last_seen_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type UserSession struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	RefreshToken string     `json:"refresh_token"`
	UserAgent    string     `json:"user_agent"`
	ClientIP     string     `json:"client_ip"`
	ExpiresAt    time.Time  `json:"expires_at"`
	RevokedAt    *time.Time `json:"revoked_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Server struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	IconURL     *string    `json:"icon_url"`
	OwnerID     uuid.UUID  `json:"owner_id"`
	InviteCode  string     `json:"invite_code"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Owner       *User      `json:"owner,omitempty"`
	MemberCount int        `json:"member_count,omitempty"`
}

type Role struct {
	ID        uuid.UUID `json:"id"`
	ServerID  uuid.UUID `json:"server_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	Position  int       `json:"position"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
}

type Permission struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type ServerMember struct {
	ID        uuid.UUID  `json:"id"`
	ServerID  uuid.UUID  `json:"server_id"`
	UserID    uuid.UUID  `json:"user_id"`
	Nickname  *string    `json:"nickname"`
	RoleID    *uuid.UUID `json:"role_id"`
	JoinedAt  time.Time  `json:"joined_at"`
	User      *User      `json:"user,omitempty"`
	Role      *Role      `json:"role,omitempty"`
}

type Category struct {
	ID        uuid.UUID `json:"id"`
	ServerID  uuid.UUID `json:"server_id"`
	Name      string    `json:"name"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	Channels  []Channel `json:"channels,omitempty"`
}

type Channel struct {
	ID         uuid.UUID  `json:"id"`
	ServerID   uuid.UUID  `json:"server_id"`
	CategoryID *uuid.UUID `json:"category_id"`
	Name       string     `json:"name"`
	Topic      string     `json:"topic"`
	Type       string     `json:"type"` // text, voice
	Position   int        `json:"position"`
	IsPrivate  bool       `json:"is_private"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type ChannelMessage struct {
	ID          uuid.UUID         `json:"id"`
	ChannelID   uuid.UUID         `json:"channel_id"`
	SenderID    uuid.UUID         `json:"sender_id"`
	Content     string            `json:"content"`
	ReplyToID   *uuid.UUID        `json:"reply_to_id"`
	IsEdited    bool              `json:"is_edited"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Sender      *User             `json:"sender,omitempty"`
	ReplyTo     *ChannelMessage   `json:"reply_to,omitempty"`
	Reactions   []MessageReaction `json:"reactions,omitempty"`
	Attachments []Attachment      `json:"attachments,omitempty"`
}

type Conversation struct {
	ID        uuid.UUID            `json:"id"`
	Type      string               `json:"type"` // direct, group
	Name      *string              `json:"name"`
	IconURL   *string              `json:"icon_url"`
	OwnerID   *uuid.UUID           `json:"owner_id"`
	CreatedAt time.Time            `json:"created_at"`
	UpdatedAt time.Time            `json:"updated_at"`
	Members   []ConversationMember `json:"members,omitempty"`
	LastMsg   *DirectMessage       `json:"last_message,omitempty"`
}

type ConversationMember struct {
	ConversationID uuid.UUID `json:"conversation_id"`
	UserID         uuid.UUID `json:"user_id"`
	JoinedAt       time.Time `json:"joined_at"`
	LastReadAt     time.Time `json:"last_read_at"`
	User           *User     `json:"user,omitempty"`
}

type DirectMessage struct {
	ID             uuid.UUID         `json:"id"`
	ConversationID uuid.UUID         `json:"conversation_id"`
	SenderID       uuid.UUID         `json:"sender_id"`
	Content        string            `json:"content"`
	ReplyToID      *uuid.UUID        `json:"reply_to_id"`
	IsEdited       bool              `json:"is_edited"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
	Sender         *User             `json:"sender,omitempty"`
	ReplyTo        *DirectMessage    `json:"reply_to,omitempty"`
	Reactions      []MessageReaction `json:"reactions,omitempty"`
	Attachments    []Attachment      `json:"attachments,omitempty"`
}

type MessageReaction struct {
	ID               uuid.UUID `json:"id"`
	MessageID        uuid.UUID `json:"message_id"`
	UserID           uuid.UUID `json:"user_id"`
	Emoji            string    `json:"emoji"`
	IsChannelMessage bool      `json:"is_channel_message"`
	CreatedAt        time.Time `json:"created_at"`
	User             *User     `json:"user,omitempty"`
}

type Attachment struct {
	ID        uuid.UUID `json:"id"`
	MessageID uuid.UUID `json:"message_id"`
	FileName  string    `json:"file_name"`
	FileSize  int64     `json:"file_size"`
	FileType  string    `json:"file_type"`
	FileURL   string    `json:"file_url"`
	CreatedAt time.Time `json:"created_at"`
}

type Invitation struct {
	ID         uuid.UUID  `json:"id"`
	ServerID   uuid.UUID  `json:"server_id"`
	Code       string     `json:"code"`
	InviterID  uuid.UUID  `json:"inviter_id"`
	MaxUses    int        `json:"max_uses"`
	UsesCount  int        `json:"uses_count"`
	ExpiresAt  *time.Time `json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
	Server     *Server    `json:"server,omitempty"`
}

type Notification struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	ActorID     *uuid.UUID `json:"actor_id"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Content     string     `json:"content"`
	ReferenceID *uuid.UUID `json:"reference_id"`
	IsRead      bool       `json:"is_read"`
	CreatedAt   time.Time  `json:"created_at"`
	Actor       *User      `json:"actor,omitempty"`
}


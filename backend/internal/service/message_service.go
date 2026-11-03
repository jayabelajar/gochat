package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gochat/backend/internal/models"
	"gochat/backend/internal/repository"
)

var (
	ErrMessageNotFound = errors.New("message not found")
)

type MessageService struct {
	msgRepo     *repository.MessageRepository
	convRepo    *repository.ConversationRepository
	serverRepo  *repository.ServerRepository
	channelRepo *repository.ChannelRepository
}

func NewMessageService(
	msgRepo *repository.MessageRepository,
	convRepo *repository.ConversationRepository,
	serverRepo *repository.ServerRepository,
	channelRepo *repository.ChannelRepository,
) *MessageService {
	return &MessageService{
		msgRepo:     msgRepo,
		convRepo:    convRepo,
		serverRepo:  serverRepo,
		channelRepo: channelRepo,
	}
}

type SendMessageInput struct {
	Content   string     `json:"content" binding:"required,min=1"`
	ReplyToID *uuid.UUID `json:"reply_to_id"`
}

type ReactionInput struct {
	Emoji string `json:"emoji" binding:"required"`
}

func (s *MessageService) SendChannelMessage(ctx context.Context, channelID, senderID uuid.UUID, input SendMessageInput) (*models.ChannelMessage, error) {
	channel, err := s.channelRepo.GetByID(ctx, channelID)
	if err != nil {
		return nil, ErrChannelNotFound
	}

	// Verify membership in server
	isMember, err := s.serverRepo.IsMember(ctx, channel.ServerID, senderID)
	if err != nil || !isMember {
		return nil, ErrForbidden
	}

	msg := &models.ChannelMessage{
		ChannelID: channelID,
		SenderID:  senderID,
		Content:   input.Content,
		ReplyToID: input.ReplyToID,
	}

	if err := s.msgRepo.CreateChannelMessage(ctx, msg); err != nil {
		return nil, err
	}

	return s.msgRepo.GetChannelMessageByID(ctx, msg.ID)
}

func (s *MessageService) GetChannelMessages(ctx context.Context, channelID, userID uuid.UUID, cursor *time.Time, limit int) ([]models.ChannelMessage, error) {
	channel, err := s.channelRepo.GetByID(ctx, channelID)
	if err != nil {
		return nil, ErrChannelNotFound
	}

	isMember, err := s.serverRepo.IsMember(ctx, channel.ServerID, userID)
	if err != nil || !isMember {
		return nil, ErrForbidden
	}

	return s.msgRepo.ListChannelMessages(ctx, channelID, cursor, limit)
}

func (s *MessageService) EditChannelMessage(ctx context.Context, messageID, userID uuid.UUID, newContent string) (*models.ChannelMessage, error) {
	msg, err := s.msgRepo.GetChannelMessageByID(ctx, messageID)
	if err != nil {
		return nil, ErrMessageNotFound
	}

	if msg.SenderID != userID {
		return nil, ErrForbidden
	}

	if err := s.msgRepo.UpdateChannelMessage(ctx, messageID, newContent); err != nil {
		return nil, err
	}

	return s.msgRepo.GetChannelMessageByID(ctx, messageID)
}

func (s *MessageService) DeleteChannelMessage(ctx context.Context, messageID, userID uuid.UUID) error {
	msg, err := s.msgRepo.GetChannelMessageByID(ctx, messageID)
	if err != nil {
		return ErrMessageNotFound
	}

	if msg.SenderID != userID {
		return ErrForbidden
	}

	return s.msgRepo.DeleteChannelMessage(ctx, messageID)
}

func (s *MessageService) ToggleReaction(ctx context.Context, messageID, userID uuid.UUID, emoji string, isChannelMessage bool) error {
	reaction := &models.MessageReaction{
		MessageID:        messageID,
		UserID:           userID,
		Emoji:            emoji,
		IsChannelMessage: isChannelMessage,
	}
	return s.msgRepo.AddReaction(ctx, reaction)
}

// Direct Messaging
func (s *MessageService) GetOrCreateDirectConversation(ctx context.Context, user1, user2 uuid.UUID) (*models.Conversation, error) {
	return s.convRepo.GetOrCreateDirectConversation(ctx, user1, user2)
}

func (s *MessageService) GetUserConversations(ctx context.Context, userID uuid.UUID) ([]models.Conversation, error) {
	return s.convRepo.ListUserConversations(ctx, userID)
}

func (s *MessageService) SendDirectMessage(ctx context.Context, convID, senderID uuid.UUID, input SendMessageInput) (*models.DirectMessage, error) {
	dm := &models.DirectMessage{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        input.Content,
		ReplyToID:      input.ReplyToID,
	}

	if err := s.convRepo.CreateDirectMessage(ctx, dm); err != nil {
		return nil, err
	}

	return dm, nil
}

func (s *MessageService) GetDirectMessages(ctx context.Context, convID uuid.UUID, cursor *time.Time, limit int) ([]models.DirectMessage, error) {
	return s.convRepo.ListDirectMessages(ctx, convID, cursor, limit)
}


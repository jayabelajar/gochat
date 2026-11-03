package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gochat/backend/internal/models"
	"gochat/backend/internal/repository"
)

var (
	ErrForbidden       = errors.New("you do not have permission for this action")
	ErrServerNotFound  = errors.New("server not found")
	ErrChannelNotFound = errors.New("channel not found")
)

type ServerService struct {
	serverRepo  *repository.ServerRepository
	channelRepo *repository.ChannelRepository
}

func NewServerService(serverRepo *repository.ServerRepository, channelRepo *repository.ChannelRepository) *ServerService {
	return &ServerService{
		serverRepo:  serverRepo,
		channelRepo: channelRepo,
	}
}

type CreateServerInput struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Description string  `json:"description"`
	IconURL     *string `json:"icon_url"`
}

type CreateChannelInput struct {
	Name       string     `json:"name" binding:"required,min=2,max=100"`
	Topic      string     `json:"topic"`
	CategoryID *uuid.UUID `json:"category_id"`
	Type       string     `json:"type"` // "text" or "voice"
	IsPrivate  bool       `json:"is_private"`
}

type CreateCategoryInput struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

func (s *ServerService) CreateServer(ctx context.Context, userID uuid.UUID, input CreateServerInput) (*models.Server, error) {
	server := &models.Server{
		Name:        input.Name,
		Description: input.Description,
		IconURL:     input.IconURL,
		OwnerID:     userID,
	}

	if err := s.serverRepo.Create(ctx, server); err != nil {
		return nil, err
	}
	return server, nil
}

func (s *ServerService) GetUserServers(ctx context.Context, userID uuid.UUID) ([]models.Server, error) {
	return s.serverRepo.ListByUser(ctx, userID)
}

func (s *ServerService) GetServerDetails(ctx context.Context, serverID, userID uuid.UUID) (*models.Server, error) {
	isMember, err := s.serverRepo.IsMember(ctx, serverID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrForbidden
	}
	return s.serverRepo.GetByID(ctx, serverID)
}

func (s *ServerService) JoinServerByInvite(ctx context.Context, code string, userID uuid.UUID) (*models.Server, error) {
	server, err := s.serverRepo.GetByInviteCode(ctx, code)
	if err != nil {
		return nil, errors.New("invalid or expired invitation code")
	}

	if err := s.serverRepo.AddMember(ctx, server.ID, userID); err != nil {
		return nil, err
	}
	return server, nil
}

func (s *ServerService) LeaveServer(ctx context.Context, serverID, userID uuid.UUID) error {
	server, err := s.serverRepo.GetByID(ctx, serverID)
	if err != nil {
		return err
	}
	if server.OwnerID == userID {
		return errors.New("owner cannot leave their own server without transferring ownership or deleting it")
	}
	return s.serverRepo.RemoveMember(ctx, serverID, userID)
}

func (s *ServerService) DeleteServer(ctx context.Context, serverID, userID uuid.UUID) error {
	server, err := s.serverRepo.GetByID(ctx, serverID)
	if err != nil {
		return err
	}
	if server.OwnerID != userID {
		return ErrForbidden
	}
	return s.serverRepo.Delete(ctx, serverID)
}

func (s *ServerService) GetServerMembers(ctx context.Context, serverID, userID uuid.UUID) ([]models.ServerMember, error) {
	isMember, err := s.serverRepo.IsMember(ctx, serverID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrForbidden
	}
	return s.serverRepo.ListMembers(ctx, serverID)
}

// Channels & Categories
func (s *ServerService) GetServerChannels(ctx context.Context, serverID, userID uuid.UUID) ([]models.Channel, error) {
	isMember, err := s.serverRepo.IsMember(ctx, serverID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrForbidden
	}
	return s.channelRepo.ListByServer(ctx, serverID)
}

func (s *ServerService) GetServerCategories(ctx context.Context, serverID, userID uuid.UUID) ([]models.Category, error) {
	isMember, err := s.serverRepo.IsMember(ctx, serverID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrForbidden
	}
	return s.channelRepo.ListCategoriesByServer(ctx, serverID)
}

func (s *ServerService) CreateChannel(ctx context.Context, serverID, userID uuid.UUID, input CreateChannelInput) (*models.Channel, error) {
	server, err := s.serverRepo.GetByID(ctx, serverID)
	if err != nil {
		return nil, err
	}
	if server.OwnerID != userID {
		// (In full RBAC, check role permissions, for owner check owner_id)
		return nil, ErrForbidden
	}

	channel := &models.Channel{
		ServerID:   serverID,
		CategoryID: input.CategoryID,
		Name:       input.Name,
		Topic:      input.Topic,
		Type:       input.Type,
		IsPrivate:  input.IsPrivate,
	}

	if err := s.channelRepo.Create(ctx, channel); err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *ServerService) CreateCategory(ctx context.Context, serverID, userID uuid.UUID, input CreateCategoryInput) (*models.Category, error) {
	server, err := s.serverRepo.GetByID(ctx, serverID)
	if err != nil {
		return nil, err
	}
	if server.OwnerID != userID {
		return nil, ErrForbidden
	}

	category := &models.Category{
		ServerID: serverID,
		Name:     input.Name,
	}

	if err := s.channelRepo.CreateCategory(ctx, category); err != nil {
		return nil, err
	}
	return category, nil
}


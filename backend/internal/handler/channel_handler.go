package handler

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/repository"
	"gochat/backend/internal/service"
	ws "gochat/backend/internal/websocket"
	"gochat/backend/pkg/response"
)

type ChannelHandler struct {
	channelRepo    *repository.ChannelRepository
	messageService *service.MessageService
	hub            *ws.Hub
}

func NewChannelHandler(channelRepo *repository.ChannelRepository, messageService *service.MessageService, hub *ws.Hub) *ChannelHandler {
	return &ChannelHandler{
		channelRepo:    channelRepo,
		messageService: messageService,
		hub:            hub,
	}
}

func (h *ChannelHandler) GetChannel(c *gin.Context) {
	chID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid channel ID", err)
		return
	}

	channel, err := h.channelRepo.GetByID(c.Request.Context(), chID)
	if err != nil {
		response.NotFound(c, "Channel not found")
		return
	}

	response.OK(c, "Channel retrieved", channel)
}

func (h *ChannelHandler) DeleteChannel(c *gin.Context) {
	chID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid channel ID", err)
		return
	}

	if err := h.channelRepo.Delete(c.Request.Context(), chID); err != nil {
		response.InternalServerError(c, "Failed to delete channel", err)
		return
	}

	response.OK(c, "Channel deleted", nil)
}

func (h *ChannelHandler) GetMessages(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	chID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid channel ID", err)
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	var cursor *time.Time
	cursorStr := c.Query("cursor")
	if cursorStr != "" {
		if t, err := time.Parse(time.RFC3339Nano, cursorStr); err == nil {
			cursor = &t
		}
	}

	messages, err := h.messageService.GetChannelMessages(c.Request.Context(), chID, userID, cursor, limit)
	if err != nil {
		response.InternalServerError(c, "Failed to get messages", err)
		return
	}

	nextCursor := ""
	if len(messages) == limit && len(messages) > 0 {
		nextCursor = messages[0].CreatedAt.Format(time.RFC3339Nano)
	}

	response.Paginated(c, "Messages retrieved", messages, nextCursor, len(messages) == limit)
}

func (h *ChannelHandler) SendMessage(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	chID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid channel ID", err)
		return
	}

	var input service.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid message content", err)
		return
	}

	msg, err := h.messageService.SendChannelMessage(c.Request.Context(), chID, userID, input)
	if err != nil {
		response.InternalServerError(c, "Failed to send message", err)
		return
	}

	// Broadcast via WebSocket
	dataBytes, _ := json.Marshal(msg)
	h.hub.BroadcastEvent(ws.EventMessageCreate, dataBytes, &chID)

	response.Created(c, "Message sent", msg)
}


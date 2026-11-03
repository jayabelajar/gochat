package handler

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/service"
	ws "gochat/backend/internal/websocket"
	"gochat/backend/pkg/response"
)

type MessageHandler struct {
	messageService *service.MessageService
	hub            *ws.Hub
}

func NewMessageHandler(messageService *service.MessageService, hub *ws.Hub) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
		hub:            hub,
	}
}

func (h *MessageHandler) UpdateMessage(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid message ID", err)
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Content is required", err)
		return
	}

	updated, err := h.messageService.EditChannelMessage(c.Request.Context(), msgID, userID, req.Content)
	if err != nil {
		response.InternalServerError(c, "Failed to edit message", err)
		return
	}

	// Broadcast update
	data, _ := json.Marshal(updated)
	h.hub.BroadcastEvent(ws.EventMessageUpdate, data, &updated.ChannelID)

	response.OK(c, "Message updated", updated)
}

func (h *MessageHandler) DeleteMessage(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid message ID", err)
		return
	}

	if err := h.messageService.DeleteChannelMessage(c.Request.Context(), msgID, userID); err != nil {
		response.InternalServerError(c, "Failed to delete message", err)
		return
	}

	// Broadcast delete event
	deletePayload, _ := json.Marshal(map[string]interface{}{
		"id": msgID,
	})
	h.hub.BroadcastEvent(ws.EventMessageDelete, deletePayload, nil)

	response.OK(c, "Message deleted", nil)
}

func (h *MessageHandler) AddReaction(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid message ID", err)
		return
	}

	var req struct {
		Emoji            string `json:"emoji" binding:"required"`
		IsChannelMessage bool   `json:"is_channel_message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Emoji is required", err)
		return
	}

	if err := h.messageService.ToggleReaction(c.Request.Context(), msgID, userID, req.Emoji, req.IsChannelMessage); err != nil {
		response.InternalServerError(c, "Failed to add reaction", err)
		return
	}

	response.OK(c, "Reaction saved", nil)
}


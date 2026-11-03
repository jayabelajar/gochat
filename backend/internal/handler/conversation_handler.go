package handler

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/service"
	ws "gochat/backend/internal/websocket"
	"gochat/backend/pkg/response"
)

type ConversationHandler struct {
	messageService *service.MessageService
	hub            *ws.Hub
}

func NewConversationHandler(messageService *service.MessageService, hub *ws.Hub) *ConversationHandler {
	return &ConversationHandler{
		messageService: messageService,
		hub:            hub,
	}
}

func (h *ConversationHandler) ListConversations(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	conversations, err := h.messageService.GetUserConversations(c.Request.Context(), userID)
	if err != nil {
		response.InternalServerError(c, "Failed to get conversations", err)
		return
	}
	response.OK(c, "Conversations retrieved", conversations)
}

func (h *ConversationHandler) CreateOrGetDirect(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)

	var req struct {
		RecipientID uuid.UUID `json:"recipient_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Recipient ID required", err)
		return
	}

	conv, err := h.messageService.GetOrCreateDirectConversation(c.Request.Context(), userID, req.RecipientID)
	if err != nil {
		response.InternalServerError(c, "Failed to create or get conversation", err)
		return
	}

	response.OK(c, "Conversation ready", conv)
}

func (h *ConversationHandler) GetMessages(c *gin.Context) {
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID", err)
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

	messages, err := h.messageService.GetDirectMessages(c.Request.Context(), convID, cursor, limit)
	if err != nil {
		response.InternalServerError(c, "Failed to get direct messages", err)
		return
	}

	response.OK(c, "Direct messages retrieved", messages)
}

func (h *ConversationHandler) SendMessage(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID", err)
		return
	}

	var input service.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid message content", err)
		return
	}

	dm, err := h.messageService.SendDirectMessage(c.Request.Context(), convID, userID, input)
	if err != nil {
		response.InternalServerError(c, "Failed to send message", err)
		return
	}

	// Broadcast to active clients
	dataBytes, _ := json.Marshal(dm)
	h.hub.BroadcastEvent(ws.EventMessageCreate, dataBytes, nil)

	response.Created(c, "Message sent", dm)
}


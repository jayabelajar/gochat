package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/service"
	"gochat/backend/pkg/response"
)

type ServerHandler struct {
	serverService *service.ServerService
}

func NewServerHandler(serverService *service.ServerService) *ServerHandler {
	return &ServerHandler{serverService: serverService}
}

func (h *ServerHandler) ListServers(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	servers, err := h.serverService.GetUserServers(c.Request.Context(), userID)
	if err != nil {
		response.InternalServerError(c, "Failed to list servers", err)
		return
	}
	response.OK(c, "Servers retrieved", servers)
}

func (h *ServerHandler) CreateServer(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)

	var input service.CreateServerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid input data", err)
		return
	}

	server, err := h.serverService.CreateServer(c.Request.Context(), userID, input)
	if err != nil {
		response.InternalServerError(c, "Failed to create server", err)
		return
	}

	response.Created(c, "Server created successfully", server)
}

func (h *ServerHandler) GetServer(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	server, err := h.serverService.GetServerDetails(c.Request.Context(), serverID, userID)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			response.Forbidden(c, "You do not have access to this server")
			return
		}
		response.NotFound(c, "Server not found")
		return
	}

	response.OK(c, "Server retrieved", server)
}

func (h *ServerHandler) DeleteServer(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	if err := h.serverService.DeleteServer(c.Request.Context(), serverID, userID); err != nil {
		if errors.Is(err, service.ErrForbidden) {
			response.Forbidden(c, "Only server owner can delete the server")
			return
		}
		response.InternalServerError(c, "Failed to delete server", err)
		return
	}

	response.OK(c, "Server deleted successfully", nil)
}

func (h *ServerHandler) JoinServer(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invite code required", err)
		return
	}

	server, err := h.serverService.JoinServerByInvite(c.Request.Context(), req.Code, userID)
	if err != nil {
		response.BadRequest(c, err.Error(), err)
		return
	}

	response.OK(c, "Joined server successfully", server)
}

func (h *ServerHandler) LeaveServer(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	if err := h.serverService.LeaveServer(c.Request.Context(), serverID, userID); err != nil {
		response.BadRequest(c, err.Error(), err)
		return
	}

	response.OK(c, "Left server successfully", nil)
}

func (h *ServerHandler) GetMembers(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	members, err := h.serverService.GetServerMembers(c.Request.Context(), serverID, userID)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			response.Forbidden(c, "Forbidden")
			return
		}
		response.InternalServerError(c, "Failed to get members", err)
		return
	}

	response.OK(c, "Members retrieved", members)
}

func (h *ServerHandler) GetChannels(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	channels, err := h.serverService.GetServerChannels(c.Request.Context(), serverID, userID)
	if err != nil {
		response.InternalServerError(c, "Failed to get channels", err)
		return
	}

	response.OK(c, "Channels retrieved", channels)
}

func (h *ServerHandler) CreateChannel(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	var input service.CreateChannelInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid input data", err)
		return
	}

	channel, err := h.serverService.CreateChannel(c.Request.Context(), serverID, userID, input)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			response.Forbidden(c, "Only server owner/admins can create channels")
			return
		}
		response.InternalServerError(c, "Failed to create channel", err)
		return
	}

	response.Created(c, "Channel created", channel)
}

func (h *ServerHandler) GetCategories(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	categories, err := h.serverService.GetServerCategories(c.Request.Context(), serverID, userID)
	if err != nil {
		response.InternalServerError(c, "Failed to get categories", err)
		return
	}

	response.OK(c, "Categories retrieved", categories)
}

func (h *ServerHandler) CreateCategory(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	serverID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid server ID", err)
		return
	}

	var input service.CreateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid input data", err)
		return
	}

	category, err := h.serverService.CreateCategory(c.Request.Context(), serverID, userID, input)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			response.Forbidden(c, "Forbidden")
			return
		}
		response.InternalServerError(c, "Failed to create category", err)
		return
	}

	response.Created(c, "Category created", category)
}


package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/repository"
	"gochat/backend/pkg/response"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) SearchUsers(c *gin.Context) {
	q := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)

	users, err := h.userRepo.Search(c.Request.Context(), q, limit)
	if err != nil {
		response.InternalServerError(c, "Failed to search users", err)
		return
	}

	response.OK(c, "Users retrieved", users)
}

func (h *UserHandler) GetUserByID(c *gin.Context) {
	idParam := c.Param("id")
	targetID, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(c, "Invalid user ID", err)
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), targetID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.OK(c, "User found", user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)

	var req struct {
		DisplayName string  `json:"display_name"`
		AvatarURL   *string `json:"avatar_url"`
		Bio         string  `json:"bio"`
		Status      string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload", err)
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	if req.DisplayName != "" {
		user.DisplayName = req.DisplayName
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.Status != "" {
		user.Status = req.Status
	}

	if err := h.userRepo.Update(c.Request.Context(), user); err != nil {
		response.InternalServerError(c, "Failed to update profile", err)
		return
	}

	response.OK(c, "Profile updated successfully", user)
}

func (h *UserHandler) BlockUser(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid user ID", err)
		return
	}

	if err := h.userRepo.BlockUser(c.Request.Context(), userID, targetID); err != nil {
		response.InternalServerError(c, "Failed to block user", err)
		return
	}

	response.OK(c, "User blocked", nil)
}

func (h *UserHandler) UnblockUser(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid user ID", err)
		return
	}

	if err := h.userRepo.UnblockUser(c.Request.Context(), userID, targetID); err != nil {
		response.InternalServerError(c, "Failed to unblock user", err)
		return
	}

	response.OK(c, "User unblocked", nil)
}


package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/repository"
	"gochat/backend/internal/service"
	"gochat/backend/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
	userRepo    *repository.UserRepository
}

func NewAuthHandler(authService *service.AuthService, userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userRepo:    userRepo,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input service.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid input data", err)
		return
	}

	tokens, err := h.authService.Register(c.Request.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrUserAlreadyExists) {
			response.JSON(c, http.StatusConflict, false, err.Error(), nil, err.Error())
			return
		}
		response.InternalServerError(c, "Failed to register user", err)
		return
	}

	response.Created(c, "Registration successful", tokens)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input service.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid input data", err)
		return
	}

	userAgent := c.Request.UserAgent()
	ip := c.ClientIP()

	tokens, err := h.authService.Login(c.Request.Context(), input, userAgent, ip)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			response.Unauthorized(c, "Invalid email or password")
			return
		}
		response.InternalServerError(c, "Login error", err)
		return
	}

	response.OK(c, "Login successful", tokens)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Refresh token required", err)
		return
	}

	tokens, err := h.authService.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, "Invalid or expired refresh token")
		return
	}

	response.OK(c, "Token refreshed", tokens)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required,email"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload", err)
		return
	}

	if err := h.authService.ResetPassword(c.Request.Context(), req.Email, req.NewPassword); err != nil {
		response.BadRequest(c, err.Error(), err)
		return
	}

	response.OK(c, "Password reset successfully", nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Refresh token required", err)
		return
	}

	_ = h.authService.Logout(c.Request.Context(), req.RefreshToken)
	response.OK(c, "Logged out successfully", nil)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.MustGet(middleware.CtxUserIDKey).(uuid.UUID)
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.OK(c, "User retrieved", user)
}


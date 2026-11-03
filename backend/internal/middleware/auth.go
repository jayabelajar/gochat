package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"gochat/backend/internal/service"
	"gochat/backend/pkg/response"
)

const (
	CtxUserIDKey   = "user_id"
	CtxUserEmail   = "user_email"
	CtxUsernameKey = "username"
)

func Auth(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "Authorization format must be Bearer <token>")
			c.Abort()
			return
		}

		claims, err := authService.ValidateAccessToken(parts[1])
		if err != nil {
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set(CtxUserIDKey, claims.UserID)
		c.Set(CtxUserEmail, claims.Email)
		c.Set(CtxUsernameKey, claims.Username)
		c.Next()
	}
}


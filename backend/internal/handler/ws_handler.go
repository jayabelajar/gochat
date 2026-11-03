package handler

import (
	"log"
	"net/http"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"gochat/backend/internal/service"
	ws "gochat/backend/internal/websocket"
)

type WSHandler struct {
	hub         *ws.Hub
	authService *service.AuthService
}

func NewWSHandler(hub *ws.Hub, authService *service.AuthService) *WSHandler {
	return &WSHandler{
		hub:         hub,
		authService: authService,
	}
}

func (h *WSHandler) ServeWS(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		authHeader := c.GetHeader("Authorization")
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			token = authHeader[7:]
		}
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication token required"})
		return
	}

	claims, err := h.authService.ValidateAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Upgrade connection
	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		log.Printf("Failed to accept websocket: %v", err)
		return
	}

	client := ws.NewClient(h.hub, conn, claims.UserID, claims.Username)
	h.hub.Register <- client

	// Start reader and writer routines
	go client.WritePump(c.Request.Context())
	client.ReadPump(c.Request.Context())
}


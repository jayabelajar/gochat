package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"gochat/backend/internal/config"
	"gochat/backend/internal/database"
	"gochat/backend/internal/handler"
	"gochat/backend/internal/middleware"
	"gochat/backend/internal/redis"
	"gochat/backend/internal/repository"
	"gochat/backend/internal/service"
	ws "gochat/backend/internal/websocket"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Database Connection
	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Printf("Warning: Database connection failed: %v", err)
	} else {
		defer db.Close()
		// Auto apply migrations
		if err := db.RunMigrations(ctx, "migrations/000001_init_schema.up.sql"); err != nil {
			log.Printf("Migration notice: %v", err)
		}
	}

	// 2. Redis Connection
	rdb := redis.Connect(cfg.RedisURL)
	defer rdb.Close()

	// 3. WebSocket Hub
	hub := ws.NewHub(rdb)
	go hub.Run(ctx)

	// 4. Repositories
	var pool = db.Pool
	userRepo := repository.NewUserRepository(pool)
	serverRepo := repository.NewServerRepository(pool)
	channelRepo := repository.NewChannelRepository(pool)
	msgRepo := repository.NewMessageRepository(pool)
	convRepo := repository.NewConversationRepository(pool)

	// 5. Services
	authService := service.NewAuthService(userRepo, cfg)
	serverService := service.NewServerService(serverRepo, channelRepo)
	msgService := service.NewMessageService(msgRepo, convRepo, serverRepo, channelRepo)

	// 6. Handlers
	authHandler := handler.NewAuthHandler(authService, userRepo)
	userHandler := handler.NewUserHandler(userRepo)
	serverHandler := handler.NewServerHandler(serverService)
	channelHandler := handler.NewChannelHandler(channelRepo, msgService, hub)
	msgHandler := handler.NewMessageHandler(msgService, hub)
	convHandler := handler.NewConversationHandler(msgService, hub)
	wsHandler := handler.NewWSHandler(hub, authService)

	// 7. Gin Engine Setup
	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", cfg.CorsAllowedOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().UTC(),
		})
	})

	// WebSocket Endpoint
	r.GET("/ws", wsHandler.ServeWS)

	// REST API v1
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.GET("/me", middleware.Auth(authService), authHandler.Me)
		}

		// Protected Routes
		api := v1.Group("")
		api.Use(middleware.Auth(authService))
		{
			// Users
			users := api.Group("/users")
			{
				users.GET("", userHandler.SearchUsers)
				users.GET("/:id", userHandler.GetUserByID)
				users.PATCH("/me", userHandler.UpdateProfile)
				users.POST("/:id/block", userHandler.BlockUser)
				users.DELETE("/:id/block", userHandler.UnblockUser)
			}

			// Servers
			servers := api.Group("/servers")
			{
				servers.GET("", serverHandler.ListServers)
				servers.POST("", serverHandler.CreateServer)
				servers.POST("/join", serverHandler.JoinServer)
				servers.GET("/:id", serverHandler.GetServer)
				servers.DELETE("/:id", serverHandler.DeleteServer)
				servers.POST("/:id/leave", serverHandler.LeaveServer)
				servers.GET("/:id/members", serverHandler.GetMembers)
				servers.GET("/:id/channels", serverHandler.GetChannels)
				servers.POST("/:id/channels", serverHandler.CreateChannel)
				servers.GET("/:id/categories", serverHandler.GetCategories)
				servers.POST("/:id/categories", serverHandler.CreateCategory)
			}

			// Channels
			channels := api.Group("/channels")
			{
				channels.GET("/:id", channelHandler.GetChannel)
				channels.DELETE("/:id", channelHandler.DeleteChannel)
				channels.GET("/:id/messages", channelHandler.GetMessages)
				channels.POST("/:id/messages", channelHandler.SendMessage)
			}

			// Messages
			messages := api.Group("/messages")
			{
				messages.PATCH("/:id", msgHandler.UpdateMessage)
				messages.DELETE("/:id", msgHandler.DeleteMessage)
				messages.POST("/:id/reactions", msgHandler.AddReaction)
			}

			// Direct Conversations
			convs := api.Group("/conversations")
			{
				convs.GET("", convHandler.ListConversations)
				convs.POST("", convHandler.CreateOrGetDirect)
				convs.GET("/:id/messages", convHandler.GetMessages)
				convs.POST("/:id/messages", convHandler.SendMessage)
			}
		}
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("GoChat API server listening on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("GoChat server exited cleanly")
}


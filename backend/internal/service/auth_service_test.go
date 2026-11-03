package service

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gochat/backend/internal/config"
)

func TestJWTTokenGenerationAndValidation(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:        "test_secret_key_1234567890",
		JWTAccessExpiry:  60,
		JWTRefreshExpiry: 7,
	}

	authService := NewAuthService(nil, cfg)

	userID := uuid.New()
	email := "test@example.com"
	username := "testuser"

	claims := JWTClaims{
		UserID:   userID,
		Email:    email,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	parsedClaims, err := authService.ValidateAccessToken(tokenStr)
	if err != nil {
		t.Fatalf("Failed to validate access token: %v", err)
	}

	if parsedClaims.UserID != userID {
		t.Errorf("Expected userID %v, got %v", userID, parsedClaims.UserID)
	}
	if parsedClaims.Email != email {
		t.Errorf("Expected email %s, got %s", email, parsedClaims.Email)
	}
	if parsedClaims.Username != username {
		t.Errorf("Expected username %s, got %s", username, parsedClaims.Username)
	}
}

func TestJWTInvalidToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret: "test_secret_key_1234567890",
	}
	authService := NewAuthService(nil, cfg)

	_, err := authService.ValidateAccessToken("invalid.jwt.token")
	if err == nil {
		t.Errorf("Expected error for invalid token, got nil")
	}
}


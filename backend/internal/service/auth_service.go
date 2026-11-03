package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gochat/backend/internal/config"
	"gochat/backend/internal/models"
	"gochat/backend/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserAlreadyExists  = errors.New("email or username already registered")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

type AuthService struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

type RegisterInput struct {
	Email       string `json:"email" binding:"required,email"`
	Username    string `json:"username" binding:"required,min=3,max=32"`
	DisplayName string `json:"display_name" binding:"required,min=1,max=64"`
	Password    string `json:"password" binding:"required,min=6"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthTokens struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
}

type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Username string    `json:"username"`
	jwt.RegisteredClaims
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*AuthTokens, error) {
	// Check existing email
	if _, err := s.userRepo.GetByEmail(ctx, input.Email); err == nil {
		return nil, ErrUserAlreadyExists
	}
	// Check existing username
	if _, err := s.userRepo.GetByUsername(ctx, input.Username); err == nil {
		return nil, ErrUserAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		ID:           uuid.New(),
		Email:        input.Email,
		Username:     input.Username,
		DisplayName:  input.DisplayName,
		PasswordHash: string(hashedPassword),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return s.createSession(ctx, user, "web", "127.0.0.1")
}

func (s *AuthService) Login(ctx context.Context, input LoginInput, userAgent, ip string) (*AuthTokens, error) {
	user, err := s.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.createSession(ctx, user, userAgent, ip)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*AuthTokens, error) {
	session, err := s.userRepo.GetSessionByToken(ctx, refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(ctx, session.UserID)
	if err != nil {
		return nil, err
	}

	// Revoke old session and generate new tokens
	_ = s.userRepo.RevokeSession(ctx, refreshToken)
	return s.createSession(ctx, user, session.UserAgent, session.ClientIP)
}

func (s *AuthService) ResetPassword(ctx context.Context, email, newPassword string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return errors.New("user with this email does not exist")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.PasswordHash = string(hashedPassword)
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	_, err = s.userRepo.GetPool().Exec(ctx, query, user.PasswordHash, user.ID)
	return err
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	return s.userRepo.RevokeSession(ctx, refreshToken)
}

func (s *AuthService) ValidateAccessToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

func (s *AuthService) createSession(ctx context.Context, user *models.User, userAgent, ip string) (*AuthTokens, error) {
	// 1. Generate JWT Access Token
	now := time.Now().UTC()
	accessExpiry := now.Add(time.Duration(s.cfg.JWTAccessExpiry) * time.Minute)

	claims := JWTClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// 2. Generate Refresh Token
	rfBytes := make([]byte, 32)
	if _, err := rand.Read(rfBytes); err != nil {
		return nil, err
	}
	refreshToken := hex.EncodeToString(rfBytes)

	refreshExpiry := now.AddDate(0, 0, s.cfg.JWTRefreshExpiry)
	session := &models.UserSession{
		ID:           uuid.New(),
		UserID:       user.ID,
		RefreshToken: refreshToken,
		UserAgent:    userAgent,
		ClientIP:     ip,
		ExpiresAt:    refreshExpiry,
	}

	if err := s.userRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to save user session: %w", err)
	}

	return &AuthTokens{
		AccessToken:  tokenString,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}


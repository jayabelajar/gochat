package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gochat/backend/internal/models"
)

var (
	ErrNotFound      = errors.New("record not found")
	ErrAlreadyExists = errors.New("record already exists")
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, username, display_name, password_hash, avatar_url, bio, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now
	user.Status = "offline"

	_, err := r.pool.Exec(ctx, query,
		user.ID, user.Email, user.Username, user.DisplayName,
		user.PasswordHash, user.AvatarURL, user.Bio, user.Status,
		user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, username, display_name, password_hash, avatar_url, bio, status, last_seen_at, created_at, updated_at
		FROM users WHERE id = $1
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.PasswordHash, &user.AvatarURL, &user.Bio, &user.Status,
		&user.LastSeenAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return user, err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, username, display_name, password_hash, avatar_url, bio, status, last_seen_at, created_at, updated_at
		FROM users WHERE email = $1
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.PasswordHash, &user.AvatarURL, &user.Bio, &user.Status,
		&user.LastSeenAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return user, err
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, email, username, display_name, password_hash, avatar_url, bio, status, last_seen_at, created_at, updated_at
		FROM users WHERE username = $1
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.PasswordHash, &user.AvatarURL, &user.Bio, &user.Status,
		&user.LastSeenAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return user, err
}

func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET display_name = $1, avatar_url = $2, bio = $3, status = $4, last_seen_at = $5, updated_at = NOW()
		WHERE id = $6
	`
	now := time.Now().UTC()
	_, err := r.pool.Exec(ctx, query,
		user.DisplayName, user.AvatarURL, user.Bio, user.Status, now, user.ID,
	)
	return err
}

func (r *UserRepository) Search(ctx context.Context, term string, limit int) ([]models.User, error) {
	query := `
		SELECT id, email, username, display_name, avatar_url, bio, status, last_seen_at, created_at, updated_at
		FROM users
		WHERE username ILIKE '%' || $1 || '%' OR display_name ILIKE '%' || $1 || '%'
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, term, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Email, &u.Username, &u.DisplayName,
			&u.AvatarURL, &u.Bio, &u.Status, &u.LastSeenAt,
			&u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) CreateSession(ctx context.Context, session *models.UserSession) error {
	query := `
		INSERT INTO user_sessions (id, user_id, refresh_token, user_agent, client_ip, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now().UTC()

	_, err := r.pool.Exec(ctx, query,
		session.ID, session.UserID, session.RefreshToken,
		session.UserAgent, session.ClientIP, session.ExpiresAt, session.CreatedAt,
	)
	return err
}

func (r *UserRepository) GetSessionByToken(ctx context.Context, token string) (*models.UserSession, error) {
	query := `
		SELECT id, user_id, refresh_token, user_agent, client_ip, expires_at, revoked_at, created_at
		FROM user_sessions
		WHERE refresh_token = $1 AND revoked_at IS NULL AND expires_at > NOW()
	`
	session := &models.UserSession{}
	err := r.pool.QueryRow(ctx, query, token).Scan(
		&session.ID, &session.UserID, &session.RefreshToken,
		&session.UserAgent, &session.ClientIP, &session.ExpiresAt,
		&session.RevokedAt, &session.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return session, err
}

func (r *UserRepository) RevokeSession(ctx context.Context, token string) error {
	query := `
		UPDATE user_sessions
		SET revoked_at = NOW()
		WHERE refresh_token = $1
	`
	_, err := r.pool.Exec(ctx, query, token)
	return err
}

func (r *UserRepository) BlockUser(ctx context.Context, userID, blockedUserID uuid.UUID) error {
	query := `
		INSERT INTO user_blocks (user_id, blocked_user_id, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query, userID, blockedUserID)
	return err
}

func (r *UserRepository) UnblockUser(ctx context.Context, userID, blockedUserID uuid.UUID) error {
	query := `
		DELETE FROM user_blocks
		WHERE user_id = $1 AND blocked_user_id = $2
	`
	_, err := r.pool.Exec(ctx, query, userID, blockedUserID)
	return err
}


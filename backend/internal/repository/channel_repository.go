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

type ChannelRepository struct {
	pool *pgxpool.Pool
}

func NewChannelRepository(pool *pgxpool.Pool) *ChannelRepository {
	return &ChannelRepository{pool: pool}
}

func (r *ChannelRepository) CreateCategory(ctx context.Context, category *models.Category) error {
	query := `
		INSERT INTO categories (id, server_id, name, position, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	if category.ID == uuid.Nil {
		category.ID = uuid.New()
	}
	category.CreatedAt = time.Now().UTC()

	_, err := r.pool.Exec(ctx, query,
		category.ID, category.ServerID, category.Name, category.Position, category.CreatedAt,
	)
	return err
}

func (r *ChannelRepository) ListCategoriesByServer(ctx context.Context, serverID uuid.UUID) ([]models.Category, error) {
	query := `
		SELECT id, server_id, name, position, created_at
		FROM categories
		WHERE server_id = $1
		ORDER BY position ASC, created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, serverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cats := make([]models.Category, 0)
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.ServerID, &c.Name, &c.Position, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *ChannelRepository) Create(ctx context.Context, ch *models.Channel) error {
	query := `
		INSERT INTO channels (id, server_id, category_id, name, topic, type, position, is_private, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	if ch.ID == uuid.Nil {
		ch.ID = uuid.New()
	}
	if ch.Type == "" {
		ch.Type = "text"
	}
	now := time.Now().UTC()
	ch.CreatedAt = now
	ch.UpdatedAt = now

	_, err := r.pool.Exec(ctx, query,
		ch.ID, ch.ServerID, ch.CategoryID, ch.Name, ch.Topic,
		ch.Type, ch.Position, ch.IsPrivate, ch.CreatedAt, ch.UpdatedAt,
	)
	return err
}

func (r *ChannelRepository) GetByID(ctx context.Context, channelID uuid.UUID) (*models.Channel, error) {
	query := `
		SELECT id, server_id, category_id, name, topic, type, position, is_private, created_at, updated_at
		FROM channels
		WHERE id = $1
	`
	ch := &models.Channel{}
	err := r.pool.QueryRow(ctx, query, channelID).Scan(
		&ch.ID, &ch.ServerID, &ch.CategoryID, &ch.Name,
		&ch.Topic, &ch.Type, &ch.Position, &ch.IsPrivate,
		&ch.CreatedAt, &ch.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return ch, err
}

func (r *ChannelRepository) Update(ctx context.Context, ch *models.Channel) error {
	query := `
		UPDATE channels
		SET name = $1, topic = $2, category_id = $3, position = $4, is_private = $5, updated_at = NOW()
		WHERE id = $6
	`
	_, err := r.pool.Exec(ctx, query, ch.Name, ch.Topic, ch.CategoryID, ch.Position, ch.IsPrivate, ch.ID)
	return err
}

func (r *ChannelRepository) Delete(ctx context.Context, channelID uuid.UUID) error {
	query := `DELETE FROM channels WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, channelID)
	return err
}

func (r *ChannelRepository) ListByServer(ctx context.Context, serverID uuid.UUID) ([]models.Channel, error) {
	query := `
		SELECT id, server_id, category_id, name, topic, type, position, is_private, created_at, updated_at
		FROM channels
		WHERE server_id = $1
		ORDER BY position ASC, created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, serverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	channels := make([]models.Channel, 0)
	for rows.Next() {
		var ch models.Channel
		if err := rows.Scan(
			&ch.ID, &ch.ServerID, &ch.CategoryID, &ch.Name,
			&ch.Topic, &ch.Type, &ch.Position, &ch.IsPrivate,
			&ch.CreatedAt, &ch.UpdatedAt,
		); err != nil {
			return nil, err
		}
		channels = append(channels, ch)
	}
	return channels, nil
}


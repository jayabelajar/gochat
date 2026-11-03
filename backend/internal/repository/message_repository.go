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

type MessageRepository struct {
	pool *pgxpool.Pool
}

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) CreateChannelMessage(ctx context.Context, msg *models.ChannelMessage) error {
	query := `
		INSERT INTO channel_messages (id, channel_id, sender_id, content, reply_to_id, is_edited, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	if msg.ID == uuid.Nil {
		msg.ID = uuid.New()
	}
	now := time.Now().UTC()
	msg.CreatedAt = now
	msg.UpdatedAt = now

	_, err := r.pool.Exec(ctx, query,
		msg.ID, msg.ChannelID, msg.SenderID, msg.Content,
		msg.ReplyToID, msg.IsEdited, msg.CreatedAt, msg.UpdatedAt,
	)
	return err
}

func (r *MessageRepository) GetChannelMessageByID(ctx context.Context, id uuid.UUID) (*models.ChannelMessage, error) {
	query := `
		SELECT cm.id, cm.channel_id, cm.sender_id, cm.content, cm.reply_to_id, cm.is_edited, cm.created_at, cm.updated_at,
		       u.username, u.display_name, u.avatar_url, u.status
		FROM channel_messages cm
		INNER JOIN users u ON u.id = cm.sender_id
		WHERE cm.id = $1
	`
	msg := &models.ChannelMessage{}
	var u models.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&msg.ID, &msg.ChannelID, &msg.SenderID, &msg.Content,
		&msg.ReplyToID, &msg.IsEdited, &msg.CreatedAt, &msg.UpdatedAt,
		&u.Username, &u.DisplayName, &u.AvatarURL, &u.Status,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.ID = msg.SenderID
	msg.Sender = &u
	return msg, nil
}

func (r *MessageRepository) ListChannelMessages(ctx context.Context, channelID uuid.UUID, cursor *time.Time, limit int) ([]models.ChannelMessage, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var rows pgx.Rows
	var err error

	if cursor != nil && !cursor.IsZero() {
		query := `
			SELECT cm.id, cm.channel_id, cm.sender_id, cm.content, cm.reply_to_id, cm.is_edited, cm.created_at, cm.updated_at,
			       u.username, u.display_name, u.avatar_url, u.status
			FROM channel_messages cm
			INNER JOIN users u ON u.id = cm.sender_id
			WHERE cm.channel_id = $1 AND cm.created_at < $2
			ORDER BY cm.created_at DESC
			LIMIT $3
		`
		rows, err = r.pool.Query(ctx, query, channelID, *cursor, limit)
	} else {
		query := `
			SELECT cm.id, cm.channel_id, cm.sender_id, cm.content, cm.reply_to_id, cm.is_edited, cm.created_at, cm.updated_at,
			       u.username, u.display_name, u.avatar_url, u.status
			FROM channel_messages cm
			INNER JOIN users u ON u.id = cm.sender_id
			WHERE cm.channel_id = $1
			ORDER BY cm.created_at DESC
			LIMIT $2
		`
		rows, err = r.pool.Query(ctx, query, channelID, limit)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]models.ChannelMessage, 0)
	for rows.Next() {
		var msg models.ChannelMessage
		var u models.User
		err := rows.Scan(
			&msg.ID, &msg.ChannelID, &msg.SenderID, &msg.Content,
			&msg.ReplyToID, &msg.IsEdited, &msg.CreatedAt, &msg.UpdatedAt,
			&u.Username, &u.DisplayName, &u.AvatarURL, &u.Status,
		)
		if err != nil {
			return nil, err
		}
		u.ID = msg.SenderID
		msg.Sender = &u
		messages = append(messages, msg)
	}

	// Reverse so chronological order (oldest -> newest) is returned for easier rendering
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *MessageRepository) UpdateChannelMessage(ctx context.Context, id uuid.UUID, content string) error {
	query := `
		UPDATE channel_messages
		SET content = $1, is_edited = TRUE, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.pool.Exec(ctx, query, content, id)
	return err
}

func (r *MessageRepository) DeleteChannelMessage(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM channel_messages WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *MessageRepository) AddReaction(ctx context.Context, reaction *models.MessageReaction) error {
	query := `
		INSERT INTO message_reactions (id, message_id, user_id, emoji, is_channel_message, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (message_id, user_id, emoji) DO NOTHING
	`
	if reaction.ID == uuid.Nil {
		reaction.ID = uuid.New()
	}
	_, err := r.pool.Exec(ctx, query, reaction.ID, reaction.MessageID, reaction.UserID, reaction.Emoji, reaction.IsChannelMessage)
	return err
}

func (r *MessageRepository) RemoveReaction(ctx context.Context, messageID, userID uuid.UUID, emoji string) error {
	query := `DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`
	_, err := r.pool.Exec(ctx, query, messageID, userID, emoji)
	return err
}

func (r *MessageRepository) GetReactions(ctx context.Context, messageID uuid.UUID) ([]models.MessageReaction, error) {
	query := `
		SELECT mr.id, mr.message_id, mr.user_id, mr.emoji, mr.is_channel_message, mr.created_at,
		       u.username, u.display_name
		FROM message_reactions mr
		INNER JOIN users u ON u.id = mr.user_id
		WHERE mr.message_id = $1
	`
	rows, err := r.pool.Query(ctx, query, messageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reactions := make([]models.MessageReaction, 0)
	for rows.Next() {
		var mr models.MessageReaction
		var u models.User
		if err := rows.Scan(
			&mr.ID, &mr.MessageID, &mr.UserID, &mr.Emoji,
			&mr.IsChannelMessage, &mr.CreatedAt, &u.Username, &u.DisplayName,
		); err != nil {
			return nil, err
		}
		u.ID = mr.UserID
		mr.User = &u
		reactions = append(reactions, mr)
	}
	return reactions, nil
}


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

type ConversationRepository struct {
	pool *pgxpool.Pool
}

func NewConversationRepository(pool *pgxpool.Pool) *ConversationRepository {
	return &ConversationRepository{pool: pool}
}

// GetOrCreateDirectConversation finds an existing 1-on-1 direct conversation between user1 and user2, or creates one
func (r *ConversationRepository) GetOrCreateDirectConversation(ctx context.Context, user1, user2 uuid.UUID) (*models.Conversation, error) {
	// Look for existing conversation of type 'direct' with both members
	findQuery := `
		SELECT c.id, c.type, c.name, c.icon_url, c.owner_id, c.created_at, c.updated_at
		FROM conversations c
		JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
		JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
		WHERE c.type = 'direct'
		LIMIT 1
	`
	conv := &models.Conversation{}
	err := r.pool.QueryRow(ctx, findQuery, user1, user2).Scan(
		&conv.ID, &conv.Type, &conv.Name, &conv.IconURL, &conv.OwnerID, &conv.CreatedAt, &conv.UpdatedAt,
	)
	if err == nil {
		return conv, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// Create new
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	convID := uuid.New()
	now := time.Now().UTC()
	insertConv := `
		INSERT INTO conversations (id, type, created_at, updated_at)
		VALUES ($1, 'direct', $2, $3)
	`
	if _, err := tx.Exec(ctx, insertConv, convID, now, now); err != nil {
		return nil, err
	}

	insertMember := `
		INSERT INTO conversation_members (conversation_id, user_id, joined_at, last_read_at)
		VALUES ($1, $2, $3, $4)
	`
	if _, err := tx.Exec(ctx, insertMember, convID, user1, now, now); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, insertMember, convID, user2, now, now); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	conv.ID = convID
	conv.Type = "direct"
	conv.CreatedAt = now
	conv.UpdatedAt = now
	return conv, nil
}

func (r *ConversationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Conversation, error) {
	query := `
		SELECT id, type, name, icon_url, owner_id, created_at, updated_at
		FROM conversations WHERE id = $1
	`
	conv := &models.Conversation{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&conv.ID, &conv.Type, &conv.Name, &conv.IconURL, &conv.OwnerID, &conv.CreatedAt, &conv.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return conv, err
}

func (r *ConversationRepository) ListUserConversations(ctx context.Context, userID uuid.UUID) ([]models.Conversation, error) {
	query := `
		SELECT c.id, c.type, c.name, c.icon_url, c.owner_id, c.created_at, c.updated_at
		FROM conversations c
		INNER JOIN conversation_members cm ON cm.conversation_id = c.id
		WHERE cm.user_id = $1
		ORDER BY c.updated_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	conversations := make([]models.Conversation, 0)
	for rows.Next() {
		var c models.Conversation
		if err := rows.Scan(
			&c.ID, &c.Type, &c.Name, &c.IconURL,
			&c.OwnerID, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}

		// Fetch other members
		membersQuery := `
			SELECT cm.user_id, u.username, u.display_name, u.avatar_url, u.status
			FROM conversation_members cm
			INNER JOIN users u ON u.id = cm.user_id
			WHERE cm.conversation_id = $1
		`
		mRows, err := r.pool.Query(ctx, membersQuery, c.ID)
		if err == nil {
			c.Members = make([]models.ConversationMember, 0)
			for mRows.Next() {
				var cm models.ConversationMember
				var u models.User
				if err := mRows.Scan(&cm.UserID, &u.Username, &u.DisplayName, &u.AvatarURL, &u.Status); err == nil {
					u.ID = cm.UserID
					cm.User = &u
					c.Members = append(c.Members, cm)
				}
			}
			mRows.Close()
		}

		conversations = append(conversations, c)
	}
	return conversations, nil
}

func (r *ConversationRepository) CreateDirectMessage(ctx context.Context, msg *models.DirectMessage) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if msg.ID == uuid.Nil {
		msg.ID = uuid.New()
	}
	now := time.Now().UTC()
	msg.CreatedAt = now
	msg.UpdatedAt = now

	insertQuery := `
		INSERT INTO direct_messages (id, conversation_id, sender_id, content, reply_to_id, is_edited, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	if _, err := tx.Exec(ctx, insertQuery,
		msg.ID, msg.ConversationID, msg.SenderID, msg.Content,
		msg.ReplyToID, msg.IsEdited, msg.CreatedAt, msg.UpdatedAt,
	); err != nil {
		return err
	}

	updateConv := `UPDATE conversations SET updated_at = $1 WHERE id = $2`
	if _, err := tx.Exec(ctx, updateConv, now, msg.ConversationID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *ConversationRepository) ListDirectMessages(ctx context.Context, convID uuid.UUID, cursor *time.Time, limit int) ([]models.DirectMessage, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var rows pgx.Rows
	var err error

	if cursor != nil && !cursor.IsZero() {
		query := `
			SELECT dm.id, dm.conversation_id, dm.sender_id, dm.content, dm.reply_to_id, dm.is_edited, dm.created_at, dm.updated_at,
			       u.username, u.display_name, u.avatar_url, u.status
			FROM direct_messages dm
			INNER JOIN users u ON u.id = dm.sender_id
			WHERE dm.conversation_id = $1 AND dm.created_at < $2
			ORDER BY dm.created_at DESC
			LIMIT $3
		`
		rows, err = r.pool.Query(ctx, query, convID, *cursor, limit)
	} else {
		query := `
			SELECT dm.id, dm.conversation_id, dm.sender_id, dm.content, dm.reply_to_id, dm.is_edited, dm.created_at, dm.updated_at,
			       u.username, u.display_name, u.avatar_url, u.status
			FROM direct_messages dm
			INNER JOIN users u ON u.id = dm.sender_id
			WHERE dm.conversation_id = $1
			ORDER BY dm.created_at DESC
			LIMIT $2
		`
		rows, err = r.pool.Query(ctx, query, convID, limit)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]models.DirectMessage, 0)
	for rows.Next() {
		var dm models.DirectMessage
		var u models.User
		err := rows.Scan(
			&dm.ID, &dm.ConversationID, &dm.SenderID, &dm.Content,
			&dm.ReplyToID, &dm.IsEdited, &dm.CreatedAt, &dm.UpdatedAt,
			&u.Username, &u.DisplayName, &u.AvatarURL, &u.Status,
		)
		if err != nil {
			return nil, err
		}
		u.ID = dm.SenderID
		dm.Sender = &u
		messages = append(messages, dm)
	}

	// Reverse chronological to chronological
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}


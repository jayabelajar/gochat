package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gochat/backend/internal/models"
)

type ServerRepository struct {
	pool *pgxpool.Pool
}

func NewServerRepository(pool *pgxpool.Pool) *ServerRepository {
	return &ServerRepository{pool: pool}
}

func generateInviteCode() string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return uuid.New().String()[:8]
	}
	return hex.EncodeToString(bytes)
}

func (r *ServerRepository) Create(ctx context.Context, server *models.Server) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if server.ID == uuid.Nil {
		server.ID = uuid.New()
	}
	if server.InviteCode == "" {
		server.InviteCode = generateInviteCode()
	}
	now := time.Now().UTC()
	server.CreatedAt = now
	server.UpdatedAt = now

	// 1. Insert Server
	serverQuery := `
		INSERT INTO servers (id, name, description, icon_url, owner_id, invite_code, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = tx.Exec(ctx, serverQuery,
		server.ID, server.Name, server.Description,
		server.IconURL, server.OwnerID, server.InviteCode,
		server.CreatedAt, server.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// 2. Create Default Roles (Admin & Member)
	adminRoleID := uuid.New()
	memberRoleID := uuid.New()

	roleQuery := `
		INSERT INTO roles (id, server_id, name, color, position, is_default, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if _, err = tx.Exec(ctx, roleQuery, adminRoleID, server.ID, "Admin", "#E91E63", 1, false, now); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, roleQuery, memberRoleID, server.ID, "Member", "#99AAB5", 0, true, now); err != nil {
		return err
	}

	// 3. Add Owner as Server Member with Admin role
	memberQuery := `
		INSERT INTO server_members (id, server_id, user_id, role_id, joined_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	if _, err = tx.Exec(ctx, memberQuery, uuid.New(), server.ID, server.OwnerID, adminRoleID, now); err != nil {
		return err
	}

	// 4. Create Default Category & General Text Channel
	categoryID := uuid.New()
	catQuery := `
		INSERT INTO categories (id, server_id, name, position, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	if _, err = tx.Exec(ctx, catQuery, categoryID, server.ID, "TEXT CHANNELS", 0, now); err != nil {
		return err
	}

	chanQuery := `
		INSERT INTO channels (id, server_id, category_id, name, topic, type, position, is_private, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	if _, err = tx.Exec(ctx, chanQuery, uuid.New(), server.ID, categoryID, "general", "General discussion channel", "text", 0, false, now, now); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *ServerRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Server, error) {
	query := `
		SELECT s.id, s.name, s.description, s.icon_url, s.owner_id, s.invite_code, s.created_at, s.updated_at,
		       (SELECT COUNT(*) FROM server_members sm WHERE sm.server_id = s.id) as member_count
		FROM servers s
		WHERE s.id = $1
	`
	server := &models.Server{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&server.ID, &server.Name, &server.Description,
		&server.IconURL, &server.OwnerID, &server.InviteCode,
		&server.CreatedAt, &server.UpdatedAt, &server.MemberCount,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return server, err
}

func (r *ServerRepository) GetByInviteCode(ctx context.Context, code string) (*models.Server, error) {
	query := `
		SELECT s.id, s.name, s.description, s.icon_url, s.owner_id, s.invite_code, s.created_at, s.updated_at,
		       (SELECT COUNT(*) FROM server_members sm WHERE sm.server_id = s.id) as member_count
		FROM servers s
		WHERE s.invite_code = $1
	`
	server := &models.Server{}
	err := r.pool.QueryRow(ctx, query, code).Scan(
		&server.ID, &server.Name, &server.Description,
		&server.IconURL, &server.OwnerID, &server.InviteCode,
		&server.CreatedAt, &server.UpdatedAt, &server.MemberCount,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return server, err
}

func (r *ServerRepository) Update(ctx context.Context, server *models.Server) error {
	query := `
		UPDATE servers
		SET name = $1, description = $2, icon_url = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.pool.Exec(ctx, query, server.Name, server.Description, server.IconURL, server.ID)
	return err
}

func (r *ServerRepository) Delete(ctx context.Context, serverID uuid.UUID) error {
	query := `DELETE FROM servers WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, serverID)
	return err
}

func (r *ServerRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Server, error) {
	query := `
		SELECT s.id, s.name, s.description, s.icon_url, s.owner_id, s.invite_code, s.created_at, s.updated_at,
		       (SELECT COUNT(*) FROM server_members sm WHERE sm.server_id = s.id) as member_count
		FROM servers s
		INNER JOIN server_members sm ON sm.server_id = s.id
		WHERE sm.user_id = $1
		ORDER BY s.created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	servers := make([]models.Server, 0)
	for rows.Next() {
		var s models.Server
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Description, &s.IconURL,
			&s.OwnerID, &s.InviteCode, &s.CreatedAt, &s.UpdatedAt, &s.MemberCount,
		); err != nil {
			return nil, err
		}
		servers = append(servers, s)
	}
	return servers, nil
}

func (r *ServerRepository) AddMember(ctx context.Context, serverID, userID uuid.UUID) error {
	// Look up default role
	var defaultRoleID *uuid.UUID
	_ = r.pool.QueryRow(ctx, "SELECT id FROM roles WHERE server_id = $1 AND is_default = TRUE LIMIT 1", serverID).Scan(&defaultRoleID)

	query := `
		INSERT INTO server_members (id, server_id, user_id, role_id, joined_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (server_id, user_id) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query, uuid.New(), serverID, userID, defaultRoleID)
	return err
}

func (r *ServerRepository) RemoveMember(ctx context.Context, serverID, userID uuid.UUID) error {
	query := `DELETE FROM server_members WHERE server_id = $1 AND user_id = $2`
	_, err := r.pool.Exec(ctx, query, serverID, userID)
	return err
}

func (r *ServerRepository) IsMember(ctx context.Context, serverID, userID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2)`
	err := r.pool.QueryRow(ctx, query, serverID, userID).Scan(&exists)
	return exists, err
}

func (r *ServerRepository) ListMembers(ctx context.Context, serverID uuid.UUID) ([]models.ServerMember, error) {
	query := `
		SELECT sm.id, sm.server_id, sm.user_id, sm.nickname, sm.role_id, sm.joined_at,
		       u.username, u.display_name, u.avatar_url, u.status,
		       r.id, r.name, r.color, r.position
		FROM server_members sm
		INNER JOIN users u ON u.id = sm.user_id
		LEFT JOIN roles r ON r.id = sm.role_id
		WHERE sm.server_id = $1
		ORDER BY r.position DESC NULLS LAST, sm.joined_at ASC
	`
	rows, err := r.pool.Query(ctx, query, serverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := make([]models.ServerMember, 0)
	for rows.Next() {
		var sm models.ServerMember
		var u models.User
		var r models.Role
		var roleID *uuid.UUID
		var rID *uuid.UUID
		var rName *string
		var rColor *string
		var rPos *int

		err := rows.Scan(
			&sm.ID, &sm.ServerID, &sm.UserID, &sm.Nickname, &roleID, &sm.JoinedAt,
			&u.Username, &u.DisplayName, &u.AvatarURL, &u.Status,
			&rID, &rName, &rColor, &rPos,
		)
		if err != nil {
			return nil, err
		}
		u.ID = sm.UserID
		sm.User = &u
		sm.RoleID = roleID
		if rID != nil {
			r.ID = *rID
			if rName != nil {
				r.Name = *rName
			}
			if rColor != nil {
				r.Color = *rColor
			}
			if rPos != nil {
				r.Position = *rPos
			}
			sm.Role = &r
		}
		members = append(members, sm)
	}
	return members, nil
}


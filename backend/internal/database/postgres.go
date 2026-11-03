package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(ctx context.Context, connString string) (*DB, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// RunMigrations automatically runs SQL migration script from migrations directory
func (db *DB) RunMigrations(ctx context.Context, migrationPath string) error {
	var sqlBytes []byte
	var err error

	// Try relative or direct path
	sqlBytes, err = os.ReadFile(migrationPath)
	if err != nil {
		// Try fallback relative path
		altPath := filepath.Join("..", migrationPath)
		sqlBytes, err = os.ReadFile(altPath)
		if err != nil {
			return fmt.Errorf("could not read migration file %s: %w", migrationPath, err)
		}
	}

	_, err = db.Pool.Exec(ctx, string(sqlBytes))
	if err != nil {
		return fmt.Errorf("error executing migration: %w", err)
	}

	log.Println("Database migration applied successfully")
	return nil
}


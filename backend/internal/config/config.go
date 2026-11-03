package config

import (
	"os"
	"strconv"
	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	RedisURL          string
	JWTSecret         string
	JWTAccessExpiry   int // in minutes
	JWTRefreshExpiry  int // in days
	CorsAllowedOrigin string
	UploadDir         string
}

func Load() *Config {
	_ = godotenv.Load()

	port := getEnv("PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/gochat?sslmode=disable")
	redisURL := getEnv("REDIS_URL", "localhost:6379")
	jwtSecret := getEnv("JWT_SECRET", "gochat_super_secret_jwt_key_2026_change_in_prod")
	corsOrigin := getEnv("CORS_ALLOWED_ORIGIN", "http://localhost:3000")
	uploadDir := getEnv("UPLOAD_DIR", "./uploads")

	accessExpiry, _ := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRY_MINUTES", "60"))
	refreshExpiry, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "7"))

	return &Config{
		Port:              port,
		DatabaseURL:       dbURL,
		RedisURL:          redisURL,
		JWTSecret:         jwtSecret,
		JWTAccessExpiry:   accessExpiry,
		JWTRefreshExpiry:  refreshExpiry,
		CorsAllowedOrigin: corsOrigin,
		UploadDir:         uploadDir,
	}
}

func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}


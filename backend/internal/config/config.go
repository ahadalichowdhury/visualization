package config

import (
	"os"
	"time"
)

// Config holds all application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Stripe   StripeConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string
	Env  string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins string
}

// StripeConfig holds Stripe configuration
type StripeConfig struct {
	SecretKey     string
	WebhookSecret string
	FrontendURL   string
}

// Load loads configuration from environment variables
func Load() *Config {
	// JWT expiry duration
	jwtExpiry := 7 * 24 * time.Hour // 7 days
	if expiryStr := os.Getenv("JWT_EXPIRY"); expiryStr != "" {
		if d, err := time.ParseDuration(expiryStr); err == nil {
			jwtExpiry = d
		}
	}

	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "9090"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "visualization_db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"),
			Expiry: jwtExpiry,
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		},
		Stripe: StripeConfig{
			SecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
			WebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
			FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:3000"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

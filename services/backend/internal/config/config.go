package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	HTTPAddr    string
	DatabaseDSN string
	JWTSecret   string
}

func Load() *Config {
	_ = godotenv.Load("configs/.env")

	cfg := &Config{
		AppEnv:      getEnv("APP_ENV", "local"),
		HTTPAddr:    getEnv("HTTP_ADDR", ":8080"),
		DatabaseDSN: getEnv("DATABASE_DSN", "blog.db"),
		JWTSecret:   getEnv("JWT_SECRET", "default-secret"),
	}

	if cfg.JWTSecret == "default-secret" && cfg.AppEnv != "local" {
		log.Fatal("JWT_SECRET must be set in non-local environment")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

package main

import (
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/yourusername/visualization-backend/internal/api/routes"
	"github.com/yourusername/visualization-backend/internal/auth"
	"github.com/yourusername/visualization-backend/internal/config"
	"github.com/yourusername/visualization-backend/internal/database"
	"github.com/yourusername/visualization-backend/internal/email"
	stripeService "github.com/yourusername/visualization-backend/internal/stripe"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	dbConfig := database.Config{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
		SSLMode:  cfg.Database.SSLMode,
	}

	db, err := database.Connect(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("Database connected successfully")

	// Initialize repository
	repo := database.NewRepository(db)

	// Initialize JWT service
	jwtService := auth.NewJWTService(cfg.JWT.Secret, cfg.JWT.Expiry)

	// Initialize Stripe service
	stripeService := stripeService.NewService(cfg.Stripe.SecretKey)

	// Initialize Email service
	smtpPort, err := strconv.Atoi(cfg.Email.Port)
	if err != nil {
		log.Printf("Warning: Invalid SMTP port '%s', using default 587", cfg.Email.Port)
		smtpPort = 587
	}
	emailService := email.NewService(
		cfg.Email.Host,
		smtpPort,
		cfg.Email.Username,
		cfg.Email.Password,
		cfg.Email.From,
		cfg.Email.FromName,
		cfg.Email.FrontendURL,
	)

	log.Println("Email service initialized")

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB for avatar uploads
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} (${latency})\n",
	}))
	// CORS configuration
	corsConfig := cors.Config{
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}
	
	// In development, allow all origins
	if cfg.Server.Env == "development" {
		corsConfig.AllowOrigins = "*"
		corsConfig.AllowCredentials = false
	} else {
		corsConfig.AllowOrigins = cfg.CORS.AllowedOrigins
	}
	
	app.Use(cors.New(corsConfig))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "visualization-backend",
			"env":     cfg.Server.Env,
		})
	})

	// Setup routes
	routes.Setup(app, repo, jwtService, stripeService, emailService, cfg)

	// Setup WebSocket hub (future)
	// wsHub := websocket.NewHub()
	// go wsHub.Run()

	// Setup simulation engine (future)
	// simEngine := simulation.NewEngine()
	// go simEngine.Start()

	// Start server
	port := cfg.Server.Port

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")
		_ = app.Shutdown()
	}()

	log.Printf("Server starting on port %s in %s mode", port, cfg.Server.Env)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Server error:", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}

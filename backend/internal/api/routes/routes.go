package routes

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/api/handlers"
	"github.com/yourusername/visualization-backend/internal/api/middleware"
	"github.com/yourusername/visualization-backend/internal/auth"
	"github.com/yourusername/visualization-backend/internal/catalog"
	"github.com/yourusername/visualization-backend/internal/config"
	"github.com/yourusername/visualization-backend/internal/database"
	stripeService "github.com/yourusername/visualization-backend/internal/stripe"
	ws "github.com/yourusername/visualization-backend/internal/websocket"
)

// Setup configures all application routes
func Setup(app *fiber.App, repo *database.Repository, jwtService *auth.JWTService, stripe *stripeService.Service, cfg *config.Config) {
	// Initialize WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// Initialize services
	authService := auth.NewService(repo, jwtService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	adminHandler := handlers.NewAdminHandler(repo)
	scenarioHandler := handlers.NewScenarioHandler(repo)
	architectureHandler := handlers.NewArchitectureHandler(repo)
	simulationHandler := handlers.NewSimulationHandler()
	collaborationHandler := handlers.NewCollaborationHandler(hub, repo)
	exportHandler := handlers.NewExportHandler()
	subscriptionHandler := handlers.NewSubscriptionHandler(repo)
	stripeHandler := handlers.NewStripeHandler(repo, stripe, cfg.Stripe.WebhookSecret, cfg.Stripe.FrontendURL)

	// Initialize catalog handler
	catalogRepo := catalog.NewRepository(repo.DB())
	catalogHandler := catalog.NewHandler(catalogRepo)

	// API group
	api := app.Group("/api")

	// Public auth routes
	authGroup := api.Group("/auth")
	authGroup.Post("/signup", authHandler.Signup)
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/password/forgot", authHandler.RequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.ResetPassword)

	// OAuth routes
	oauthGroup := authGroup.Group("/oauth")
	oauthGroup.Get("/google", func(c *fiber.Ctx) error {
		// Redirect to Google OAuth
		return c.JSON(fiber.Map{"message": "Redirect to Google OAuth"})
	})
	oauthGroup.Get("/google/callback", authHandler.OAuthGoogleCallback)
	oauthGroup.Get("/github", func(c *fiber.Ctx) error {
		// Redirect to GitHub OAuth
		return c.JSON(fiber.Map{"message": "Redirect to GitHub OAuth"})
	})
	oauthGroup.Get("/github/callback", authHandler.OAuthGitHubCallback)

	// Public scenario routes
	scenariosGroup := api.Group("/scenarios")
	scenariosGroup.Get("/", scenarioHandler.GetAllScenarios)
	scenariosGroup.Get("/paginated", scenarioHandler.GetScenariosPaginated)
	scenariosGroup.Get("/categories", scenarioHandler.GetScenarioCategories)
	scenariosGroup.Get("/:id", scenarioHandler.GetScenarioByID)

	// Protected user routes (require authentication)
	userGroup := api.Group("/user", middleware.AuthMiddleware(jwtService))
	userGroup.Get("/profile", authHandler.GetProfile)
	userGroup.Put("/profile", authHandler.UpdateProfile)
	userGroup.Put("/subscription", authHandler.UpdateSubscriptionTier)
	userGroup.Get("/scenarios", scenarioHandler.GetUserScenarios)
	userGroup.Get("/scenarios/paginated", scenarioHandler.GetUserScenariosPaginated)
	userGroup.Get("/scenarios/:id/progress", scenarioHandler.GetUserScenarioProgress)
	userGroup.Post("/scenarios/:id/progress", scenarioHandler.UpdateUserScenarioProgress)

	// Architecture routes
	architecturesGroup := api.Group("/architectures", middleware.AuthMiddleware(jwtService))
	architecturesGroup.Get("/", architectureHandler.GetUserArchitectures)
	architecturesGroup.Post("/", architectureHandler.SaveArchitecture)
	architecturesGroup.Get("/limits", architectureHandler.GetFeatureLimits)
	architecturesGroup.Get("/:id", architectureHandler.GetArchitecture)
	architecturesGroup.Put("/:id", architectureHandler.SaveArchitecture)
	architecturesGroup.Delete("/:id", architectureHandler.DeleteArchitecture)
	architecturesGroup.Get("/:id/collaboration-access", architectureHandler.CheckCollaborationAccess)

	// Simulation routes
	simulationGroup := api.Group("/simulation")
	simulationGroup.Post("/run", simulationHandler.RunSimulation)
	simulationGroup.Post("/estimate-cost", simulationHandler.EstimateCost)
	simulationGroup.Get("/presets", simulationHandler.GetSimulationPresets)

	// Subscription plans routes (public)
	subscriptionGroup := api.Group("/subscription")
	subscriptionGroup.Get("/plans", subscriptionHandler.GetAllPlans)
	subscriptionGroup.Get("/plans/:name", subscriptionHandler.GetPlanByName)

	// Stripe webhook (public - MUST be registered BEFORE authenticated routes)
	api.Post("/stripe/webhook", stripeHandler.HandleWebhook)

	// Stripe payment routes (protected)
	stripeGroup := api.Group("/stripe", middleware.AuthMiddleware(jwtService))
	stripeGroup.Post("/create-checkout-session", stripeHandler.CreateCheckoutSession)
	stripeGroup.Post("/cancel-subscription", stripeHandler.CancelSubscription)
	stripeGroup.Post("/reactivate-subscription", stripeHandler.ReactivateSubscription)
	stripeGroup.Get("/payment-history", stripeHandler.GetPaymentHistory)
	stripeGroup.Get("/subscription-details", stripeHandler.GetSubscriptionDetails)

	// Real-time Collaboration WebSocket (NEW)
	app.Get("/ws/collaborate", websocket.New(collaborationHandler.HandleWebSocket))

	// Collaboration session info endpoint
	collaborationGroup := api.Group("/collaboration")
	collaborationGroup.Get("/sessions/:sessionId", collaborationHandler.GetSessionInfo)

	// Export routes (Terraform/CloudFormation) - NEW
	exportGroup := api.Group("/export")
	exportGroup.Post("/terraform", exportHandler.ExportToTerraform)
	exportGroup.Post("/cloudformation", exportHandler.ExportToCloudFormation)
	exportGroup.Post("/", exportHandler.ExportGeneric) // Generic endpoint with format parameter

	// Admin routes (require admin role)
	adminGroup := api.Group("/admin",
		middleware.AuthMiddleware(jwtService),
		middleware.RequireSubscriptionTier("admin"),
	)
	adminGroup.Get("/users", adminHandler.GetAllUsers)
	adminGroup.Put("/users/:id/subscription", adminHandler.UpdateUserSubscriptionTier)
	adminGroup.Post("/scenarios", scenarioHandler.CreateScenario)

	// Pro/Premium routes (require pro or admin role)
	proGroup := api.Group("/pro",
		middleware.AuthMiddleware(jwtService),
		middleware.RequireSubscriptionTier("premium", "admin"),
	)
	proGroup.Get("/features", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message":  "Pro features endpoint",
			"features": []string{"sandbox", "failure_injection"},
		})
	})

	// Component Catalog routes (public)
	catalogHandler.RegisterRoutes(api)
}

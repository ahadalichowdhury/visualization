package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/simulation"
)

type SimulationHandler struct {
}

func NewSimulationHandler() *SimulationHandler {
	return &SimulationHandler{}
}

// RunSimulation handles POST /api/simulation/run
func (h *SimulationHandler) RunSimulation(c *fiber.Ctx) error {
	var input simulation.SimulationInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if len(input.Nodes) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No nodes provided",
		})
	}

	if input.Workload.RPS <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "RPS must be greater than 0",
		})
	}

	if input.Workload.DurationSeconds <= 0 {
		input.Workload.DurationSeconds = 30 // Default 30 seconds
	}

	// Set defaults
	if input.Workload.Mode == "" {
		input.Workload.Mode = "constant"
	}

	if input.Workload.ReadWriteRatio.Read == 0 && input.Workload.ReadWriteRatio.Write == 0 {
		input.Workload.ReadWriteRatio.Read = 80
		input.Workload.ReadWriteRatio.Write = 20
	}

	// Create and run simulation engine
	engine := simulation.NewEngine(&input)
	output, err := engine.Run()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(output)
}

// EstimateCost handles POST /api/simulation/estimate-cost
// Returns estimated monthly cost BEFORE running simulation
func (h *SimulationHandler) EstimateCost(c *fiber.Ctx) error {
	var input simulation.SimulationInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if len(input.Nodes) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No nodes provided",
		})
	}

	// Create engine to access cost calculation methods
	engine := simulation.NewEngine(&input)

	// Calculate monthly cost
	// Safely handle potential nil pointers in engine or input
	if engine == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize simulation engine",
		})
	}

	// Must initialize state before calculating costs
	if err := engine.InitializeState(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize engine state: " + err.Error(),
		})
	}

	monthlyCost := engine.CalculateTotalMonthlyCost()

	// Get cost breakdown by component type
	breakdown := make(map[string]float64)
	computeCost := 0.0
	storageCost := 0.0
	networkCost := 0.0
	otherCost := 0.0

	for _, node := range input.Nodes {
		nodeCost := 0.0
		nodeType := node.Data.NodeType

		// Get instance cost if applicable
		if node.Data.Config != nil {
			if instanceType, ok := node.Data.Config["instanceType"].(string); ok && instanceType != "" {
				nodeCost += engine.EstimateInstanceCost(instanceType) * 730 // Monthly
			}

			// Get storage cost if applicable
			if storageSizeGB, ok := node.Data.Config["storage_size_gb"].(float64); ok && storageSizeGB > 0 {
				storageType := "gp3" // Default
				if st, ok := node.Data.Config["storageType"].(string); ok {
					storageType = st
				}
				nodeCost += engine.EstimateStorageCost(storageType, storageSizeGB) * 730
			}
		}

		// Categorize cost
		switch {
		case nodeType == "api_server" || nodeType == "web_server" || nodeType == "microservice" || nodeType == "worker":
			computeCost += nodeCost
		case nodeType == "database_sql" || nodeType == "database_nosql" || nodeType == "object_storage" || nodeType == "cache_redis":
			storageCost += nodeCost
		case nodeType == "load_balancer" || nodeType == "api_gateway" || nodeType == "cdn":
			networkCost += nodeCost
		default:
			otherCost += nodeCost
		}

		breakdown[nodeType] = nodeCost
	}

	// Calculate data transfer cost estimate
	dataTransferCost := engine.EstimateDataTransferCost()
	networkCost += dataTransferCost

	return c.JSON(fiber.Map{
		"totalMonthlyCost": monthlyCost,
		"breakdown": fiber.Map{
			"compute":      computeCost,
			"storage":      storageCost,
			"network":      networkCost,
			"other":        otherCost,
			"dataTransfer": dataTransferCost,
		},
		"componentCosts": breakdown,
		"nodeCount":      len(input.Nodes),
		"edgeCount":      len(input.Edges),
	})
}

// GetSimulationPresets handles GET /api/simulation/presets
func (h *SimulationHandler) GetSimulationPresets(c *fiber.Ctx) error {
	presets := []fiber.Map{
		{
			"id":          "low-traffic",
			"name":        "Low Traffic",
			"description": "Low steady traffic for development testing",
			"workload": fiber.Map{
				"rps":             1000,
				"mode":            "constant",
				"durationSeconds": 30,
				"readWriteRatio":  fiber.Map{"read": 80, "write": 20},
				"regions":         []string{"us-east"},
			},
		},
		{
			"id":          "normal-traffic",
			"name":        "Normal Traffic",
			"description": "Normal production-like traffic",
			"workload": fiber.Map{
				"rps":             10000,
				"mode":            "constant",
				"durationSeconds": 60,
				"readWriteRatio":  fiber.Map{"read": 80, "write": 20},
				"regions":         []string{"us-east"},
			},
		},
		{
			"id":          "high-traffic",
			"name":        "High Traffic",
			"description": "High load for stress testing",
			"workload": fiber.Map{
				"rps":             50000,
				"mode":            "constant",
				"durationSeconds": 60,
				"readWriteRatio":  fiber.Map{"read": 90, "write": 10},
				"regions":         []string{"us-east", "eu-central"},
			},
		},
		{
			"id":          "burst-traffic",
			"name":        "Burst Traffic",
			"description": "Random bursts to test elasticity",
			"workload": fiber.Map{
				"rps":             20000,
				"mode":            "burst",
				"durationSeconds": 60,
				"readWriteRatio":  fiber.Map{"read": 70, "write": 30},
				"regions":         []string{"us-east"},
			},
		},
		{
			"id":          "spike-traffic",
			"name":        "Spike Traffic",
			"description": "Sudden traffic spike (flash sale scenario)",
			"workload": fiber.Map{
				"rps":             15000,
				"mode":            "spike",
				"durationSeconds": 60,
				"readWriteRatio":  fiber.Map{"read": 95, "write": 5},
				"regions":         []string{"us-east"},
			},
		},
		{
			"id":          "auto-scaling-test",
			"name":        "Auto-Scaling Test",
			"description": "Test auto-scaling behavior under load",
			"workload": fiber.Map{
				"rps":             30000,
				"mode":            "spike",
				"durationSeconds": 90,
				"readWriteRatio":  fiber.Map{"read": 80, "write": 20},
				"regions":         []string{"us-east"},
				"autoScaling": fiber.Map{
					"enabled":         true,
					"upThreshold":     0.75,
					"downThreshold":   0.20,
					"cooldownSeconds": 10,
					"minReplicas":     1,
					"maxReplicas":     10,
				},
			},
		},
	}

	return c.JSON(fiber.Map{
		"presets": presets,
	})
}

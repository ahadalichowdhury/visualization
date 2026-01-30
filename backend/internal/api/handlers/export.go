package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/export"
)

// ExportHandler handles infrastructure export endpoints
type ExportHandler struct{}

// NewExportHandler creates a new export handler
func NewExportHandler() *ExportHandler {
	return &ExportHandler{}
}

// ExportRequest represents the export request body
type ExportRequest struct {
	Nodes  []export.NodeInput `json:"nodes"`
	Edges  []export.EdgeInput `json:"edges"`
	Format string             `json:"format"` // "terraform" or "cloudformation"
}

// ExportToTerraform exports architecture to Terraform HCL
func (h *ExportHandler) ExportToTerraform(c *fiber.Ctx) error {
	var req ExportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate Terraform configuration
	generator := export.NewTerraformGenerator(req.Nodes, req.Edges)
	terraformCode := generator.Generate()

	// Return as downloadable file
	c.Set("Content-Type", "text/plain")
	c.Set("Content-Disposition", "attachment; filename=main.tf")
	return c.SendString(terraformCode)
}

// ExportToCloudFormation exports architecture to AWS CloudFormation YAML
func (h *ExportHandler) ExportToCloudFormation(c *fiber.Ctx) error {
	var req ExportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate CloudFormation template
	generator := export.NewCloudFormationGenerator(req.Nodes, req.Edges)
	cfTemplate := generator.Generate()

	// Return as downloadable file
	c.Set("Content-Type", "text/yaml")
	c.Set("Content-Disposition", "attachment; filename=template.yaml")
	return c.SendString(cfTemplate)
}

// ExportGeneric exports architecture to the requested format
func (h *ExportHandler) ExportGeneric(c *fiber.Ctx) error {
	var req ExportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	switch req.Format {
	case "terraform":
		generator := export.NewTerraformGenerator(req.Nodes, req.Edges)
		code := generator.Generate()
		c.Set("Content-Type", "text/plain")
		c.Set("Content-Disposition", "attachment; filename=main.tf")
		return c.SendString(code)

	case "cloudformation":
		generator := export.NewCloudFormationGenerator(req.Nodes, req.Edges)
		template := generator.Generate()
		c.Set("Content-Type", "text/yaml")
		c.Set("Content-Disposition", "attachment; filename=template.yaml")
		return c.SendString(template)

	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unsupported format. Use 'terraform' or 'cloudformation'",
		})
	}
}

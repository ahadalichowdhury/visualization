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
	Nodes  []NodeData `json:"nodes"`
	Edges  []EdgeData `json:"edges"`
	Format string     `json:"format"` // "terraform" or "cloudformation"
}

type NodeData struct {
	ID    string                 `json:"id"`
	Type  string                 `json:"type"`
	Data  map[string]interface{} `json:"data"`
}

type EdgeData struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

// ExportToTerraform exports architecture to Terraform HCL
func (h *ExportHandler) ExportToTerraform(c *fiber.Ctx) error {
	var req ExportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Convert to export format
	nodes := convertToExportNodes(req.Nodes)
	edges := convertToExportEdges(req.Edges)

	// Generate Terraform configuration
	generator := export.NewTerraformExporter(nodes, edges)
	terraformCode := generator.Generate()

	// Return as downloadable file
	c.Set("Content-Type", "text/plain; charset=utf-8")
	c.Set("Content-Disposition", "attachment; filename=main.tf")
	return c.SendString(terraformCode)
}

// ExportToCloudFormation exports architecture to AWS CloudFormation JSON
func (h *ExportHandler) ExportToCloudFormation(c *fiber.Ctx) error {
	var req ExportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Convert to export format
	nodes := convertToExportNodes(req.Nodes)
	edges := convertToExportEdges(req.Edges)

	// Generate CloudFormation template
	generator := export.NewCloudFormationExporter(nodes, edges)
	cfTemplate, err := generator.Generate()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate CloudFormation template",
		})
	}

	// Return as downloadable file
	c.Set("Content-Type", "application/json; charset=utf-8")
	c.Set("Content-Disposition", "attachment; filename=template.json")
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
		return h.ExportToTerraform(c)
	case "cloudformation":
		return h.ExportToCloudFormation(c)
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unsupported format. Use 'terraform' or 'cloudformation'",
		})
	}
}

// Helper functions to convert request data to export format

func convertToExportNodes(nodes []NodeData) []export.NodeConfig {
	result := make([]export.NodeConfig, len(nodes))
	for i, node := range nodes {
		label := node.ID
		if data, ok := node.Data["label"].(string); ok {
			label = data
		}
		
		nodeType := node.Type
		if data, ok := node.Data["nodeType"].(string); ok {
			nodeType = data
		}

		config := make(map[string]interface{})
		if nodeData, ok := node.Data["config"].(map[string]interface{}); ok {
			config = nodeData
		}

		result[i] = export.NodeConfig{
			ID:     node.ID,
			Type:   nodeType,
			Label:  label,
			Config: config,
		}
	}
	return result
}

func convertToExportEdges(edges []EdgeData) []export.Edge {
	result := make([]export.Edge, len(edges))
	for i, edge := range edges {
		result[i] = export.Edge{
			Source: edge.Source,
			Target: edge.Target,
		}
	}
	return result
}

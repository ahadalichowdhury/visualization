package handlers

import (
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/visualization-backend/internal/database/models"
	"github.com/yourusername/visualization-backend/internal/gallery"
)

type GalleryHandler struct {
	galleryService *gallery.Service
}

func NewGalleryHandler(galleryService *gallery.Service) *GalleryHandler {
	return &GalleryHandler{
		galleryService: galleryService,
	}
}

// PublishArchitecture publishes an architecture to the gallery
// POST /api/gallery/publish
func (h *GalleryHandler) PublishArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var req models.PublishArchitectureRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate
	if req.ArchitectureID == uuid.Nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "architecture_id is required",
		})
	}
	if req.Title == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "title is required",
		})
	}
	if req.Complexity != nil && (*req.Complexity != "beginner" && *req.Complexity != "intermediate" && *req.Complexity != "advanced") {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "complexity must be beginner, intermediate, or advanced",
		})
	}

	pubArch, err := h.galleryService.PublishArchitecture(userID, req)
	if err != nil {
		if err == gallery.ErrArchitectureNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Architecture not found",
			})
		}
		if err == gallery.ErrAlreadyPublished {
			return c.Status(http.StatusConflict).JSON(fiber.Map{
				"error": "Architecture already published",
			})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to publish architecture",
		})
	}

	return c.Status(http.StatusCreated).JSON(pubArch)
}

// BrowseGallery returns paginated list of public architectures
// GET /api/gallery
func (h *GalleryHandler) BrowseGallery(c *fiber.Ctx) error {
	var filters models.GalleryFilters
	if err := c.QueryParser(&filters); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid query parameters",
		})
	}

	// Get user ID if authenticated (for checking likes)
	var userID *uuid.UUID
	if uid := c.Locals("userID"); uid != nil {
		userIDStr := uid.(string)
		id, err := uuid.Parse(userIDStr)
		if err == nil {
			userID = &id
		}
	}

	result, err := h.galleryService.BrowseGallery(filters, userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to browse gallery",
		})
	}

	return c.JSON(result)
}

// GetPublicArchitecture gets a single public architecture with full details
// GET /api/gallery/:id
func (h *GalleryHandler) GetPublicArchitecture(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	// Get user ID if authenticated
	var userID *uuid.UUID
	if uid := c.Locals("userID"); uid != nil {
		userIDStr := uid.(string)
		parsedUID, err := uuid.Parse(userIDStr)
		if err == nil {
			userID = &parsedUID
		}
	}

	pubArch, err := h.galleryService.GetPublicArchitecture(id, userID)
	if err != nil {
		if err == gallery.ErrPublicArchitectureNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Public architecture not found",
			})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get public architecture",
		})
	}

	return c.JSON(pubArch)
}

// CloneArchitecture clones a public architecture to user's workspace
// POST /api/gallery/:id/clone
func (h *GalleryHandler) CloneArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	idParam := c.Params("id")
	publicArchID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	clonedArch, err := h.galleryService.CloneArchitecture(publicArchID, userID)
	if err != nil {
		// Log the actual error for debugging
		fmt.Printf("Clone error: %v\n", err)
		if err == gallery.ErrPublicArchitectureNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Public architecture not found",
			})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to clone architecture",
			"details": err.Error(), // Include error details for debugging
		})
	}

	return c.Status(http.StatusCreated).JSON(clonedArch)
}

// LikeArchitecture likes/unlikes a public architecture
// POST /api/gallery/:id/like
func (h *GalleryHandler) LikeArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	idParam := c.Params("id")
	publicArchID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	isLiked, err := h.galleryService.LikeArchitecture(publicArchID, userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to like/unlike architecture",
		})
	}

	return c.JSON(fiber.Map{
		"liked": isLiked,
	})
}

// AddComment adds a comment to a public architecture
// POST /api/gallery/:id/comments
func (h *GalleryHandler) AddComment(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	idParam := c.Params("id")
	publicArchID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	var req models.CommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Comment == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "comment is required",
		})
	}

	comment, err := h.galleryService.AddComment(publicArchID, userID, req.Comment)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add comment",
		})
	}

	return c.Status(http.StatusCreated).JSON(comment)
}

// GetComments gets comments for a public architecture
// GET /api/gallery/:id/comments
func (h *GalleryHandler) GetComments(c *fiber.Ctx) error {
	idParam := c.Params("id")
	publicArchID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	// Parse pagination
	limit := c.QueryInt("limit", 50)
	offset := c.QueryInt("offset", 0)

	comments, err := h.galleryService.GetComments(publicArchID, limit, offset)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get comments",
		})
	}

	return c.JSON(fiber.Map{
		"comments": comments,
		"limit":    limit,
		"offset":   offset,
	})
}

// UnpublishArchitecture removes an architecture from the gallery
// DELETE /api/gallery/:id
func (h *GalleryHandler) UnpublishArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	idParam := c.Params("id")
	publicArchID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	err = h.galleryService.UnpublishArchitecture(publicArchID, userID)
	if err != nil {
		if err == gallery.ErrNotAuthorized {
			return c.Status(http.StatusForbidden).JSON(fiber.Map{
				"error": "Not authorized to unpublish this architecture",
			})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to unpublish architecture",
		})
	}

	return c.Status(http.StatusNoContent).Send(nil)
}

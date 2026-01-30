package catalog

import (
	"github.com/gofiber/fiber/v2"
)

// Handler handles HTTP requests for the component catalog
type Handler struct {
	repo *Repository
}

// NewHandler creates a new catalog handler
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// RegisterRoutes registers all catalog routes
func (h *Handler) RegisterRoutes(api fiber.Router) {
	catalog := api.Group("/catalog")

	// Component catalog endpoints
	catalog.Get("/components", h.GetAllComponents)
	catalog.Get("/components/:id", h.GetComponentDetails)
	catalog.Get("/full", h.GetFullCatalog)

	// Resource type endpoints
	catalog.Get("/instance-types/:componentType", h.GetInstanceTypesByComponent)
	catalog.Get("/storage-types", h.GetStorageTypes)
	catalog.Get("/load-balancer-types", h.GetLoadBalancerTypes)
	catalog.Get("/queue-types", h.GetQueueTypes)
	catalog.Get("/cdn-types", h.GetCDNTypes)
	catalog.Get("/object-storage-types", h.GetObjectStorageTypes)
	catalog.Get("/search-types", h.GetSearchTypes)
}

// GetAllComponents returns all component types
func (h *Handler) GetAllComponents(c *fiber.Ctx) error {
	components, err := h.repo.GetAllComponents()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"components": components,
	})
}

// GetComponentDetails returns detailed information about a specific component
func (h *Handler) GetComponentDetails(c *fiber.Ctx) error {
	componentID := c.Params("id")

	// Get component
	component, err := h.repo.GetComponentByID(componentID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get config fields
	configFields, err := h.repo.GetConfigFields(componentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get allowed targets
	allowedTargets, err := h.repo.GetAllowedTargets(componentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Build response
	response := ComponentDetailsResponse{
		Component:      *component,
		ConfigFields:   configFields,
		AllowedTargets: allowedTargets,
	}

	// Get type-specific resources based on component category
	switch component.Category {
	case "compute":
		instances, _ := h.repo.GetInstanceTypes(componentID)
		response.InstanceTypes = instances
	case "storage":
		if componentID == "database_sql" || componentID == "database_nosql" {
			instances, _ := h.repo.GetInstanceTypes(componentID)
			response.InstanceTypes = instances
			storageTypes, _ := h.repo.GetStorageTypes()
			response.StorageTypes = storageTypes
		} else if componentID == "cache_redis" || componentID == "cache_memcached" {
			instances, _ := h.repo.GetInstanceTypes(componentID)
			response.InstanceTypes = instances
		} else if componentID == "object_storage" {
			objectStorageTypes, _ := h.repo.GetObjectStorageTypes()
			response.ObjectStorageTypes = objectStorageTypes
		} else if componentID == "search" {
			searchTypes, _ := h.repo.GetSearchTypes()
			response.SearchTypes = searchTypes
		}
	case "network":
		if componentID == "load_balancer" {
			lbTypes, _ := h.repo.GetLoadBalancerTypes()
			response.LoadBalancerTypes = lbTypes
		} else if componentID == "cdn" {
			cdnTypes, _ := h.repo.GetCDNTypes()
			response.CDNTypes = cdnTypes
		}
	case "messaging":
		queueTypes, _ := h.repo.GetQueueTypes()
		response.QueueTypes = queueTypes
	}

	return c.JSON(response)
}

// GetFullCatalog returns the complete catalog
func (h *Handler) GetFullCatalog(c *fiber.Ctx) error {
	// Get all components
	components, err := h.repo.GetAllComponents()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get all config fields
	configFields, err := h.repo.GetAllConfigFields()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get all connection rules
	connectionRules, err := h.repo.GetConnectionRules()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	response := ComponentCatalogResponse{
		Components:      components,
		ConfigFields:    configFields,
		ConnectionRules: connectionRules,
	}

	return c.JSON(response)
}

// GetInstanceTypesByComponent returns instance types for a specific component
func (h *Handler) GetInstanceTypesByComponent(c *fiber.Ctx) error {
	componentType := c.Params("componentType")

	instances, err := h.repo.GetInstanceTypes(componentType)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"instanceTypes": instances,
	})
}

// GetStorageTypes returns all storage types
func (h *Handler) GetStorageTypes(c *fiber.Ctx) error {
	storageTypes, err := h.repo.GetStorageTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"storageTypes": storageTypes,
	})
}

// GetLoadBalancerTypes returns all load balancer types
func (h *Handler) GetLoadBalancerTypes(c *fiber.Ctx) error {
	lbTypes, err := h.repo.GetLoadBalancerTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"loadBalancerTypes": lbTypes,
	})
}

// GetQueueTypes returns all queue types
func (h *Handler) GetQueueTypes(c *fiber.Ctx) error {
	queueTypes, err := h.repo.GetQueueTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"queueTypes": queueTypes,
	})
}

// GetCDNTypes returns all CDN types
func (h *Handler) GetCDNTypes(c *fiber.Ctx) error {
	cdnTypes, err := h.repo.GetCDNTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"cdnTypes": cdnTypes,
	})
}

// GetObjectStorageTypes returns all object storage types
func (h *Handler) GetObjectStorageTypes(c *fiber.Ctx) error {
	storageTypes, err := h.repo.GetObjectStorageTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"objectStorageTypes": storageTypes,
	})
}

// GetSearchTypes returns all search engine types
func (h *Handler) GetSearchTypes(c *fiber.Ctx) error {
	searchTypes, err := h.repo.GetSearchTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"searchTypes": searchTypes,
	})
}

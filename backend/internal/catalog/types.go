package catalog

import (
	"database/sql"
	"encoding/json"
	"time"
)

// ComponentType represents a type of infrastructure component
type ComponentType struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Icon          string    `json:"icon"`
	Description   string    `json:"description"`
	Category      string    `json:"category"`
	CloudProvider string    `json:"cloudProvider"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// InstanceType represents a compute/database/cache instance type
type InstanceType struct {
	ID               string  `json:"id"`
	ComponentTypeID  string  `json:"componentTypeId"`
	Name             string  `json:"name"`
	VCPU             int     `json:"vcpu"`
	MemoryGB         float64 `json:"memoryGb"`
	NetworkGbps      float64 `json:"networkGbps"`
	StorageType      string  `json:"storageType,omitempty"`
	BaseIOPS         int     `json:"baseIops,omitempty"`
	CostPerHourUSD   float64 `json:"costPerHourUsd"`
	CloudProvider    string  `json:"cloudProvider"`
	RegionMultiplier float64 `json:"regionMultiplier"`
	IsActive         bool    `json:"isActive"`
}

// StorageType represents an EBS storage type
type StorageType struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	IOPSPerGB         int     `json:"iopsPerGb"`
	ThroughputMBps    int     `json:"throughputMbps"`
	LatencyMs         float64 `json:"latencyMs"`
	CostPerGBMonthUSD float64 `json:"costPerGbMonthUsd"`
	CloudProvider     string  `json:"cloudProvider"`
	IsActive          bool    `json:"isActive"`
}

// LoadBalancerType represents a load balancer type
type LoadBalancerType struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	MaxConnections int     `json:"maxConnections"`
	CapacityRPS    int     `json:"capacityRps"`
	LatencyMs      float64 `json:"latencyMs"`
	CostPerHourUSD float64 `json:"costPerHourUsd"`
	CloudProvider  string  `json:"cloudProvider"`
	IsActive       bool    `json:"isActive"`
}

// QueueType represents a message queue type
type QueueType struct {
	ID                        string  `json:"id"`
	Name                      string  `json:"name"`
	MaxMessages               int64   `json:"maxMessages"`
	ThroughputMsgsPerSec      int     `json:"throughputMsgsPerSec"`
	LatencyMs                 float64 `json:"latencyMs"`
	CostPerMillionRequestsUSD float64 `json:"costPerMillionRequestsUsd"`
	MessageRetentionDays      int     `json:"messageRetentionDays"`
	SupportsFIFO              bool    `json:"supportsFifo"`
	CloudProvider             string  `json:"cloudProvider"`
	IsActive                  bool    `json:"isActive"`
}

// CDNType represents a CDN configuration
type CDNType struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	EdgeLocations  int     `json:"edgeLocations"`
	ThroughputGbps float64 `json:"throughputGbps"`
	LatencyMs      float64 `json:"latencyMs"`
	CostPerGBUSD   float64 `json:"costPerGbUsd"`
	CloudProvider  string  `json:"cloudProvider"`
	IsActive       bool    `json:"isActive"`
}

// ObjectStorageType represents an S3 storage class
type ObjectStorageType struct {
	ID                    string  `json:"id"`
	Name                  string  `json:"name"`
	Availability          string  `json:"availability"`
	LatencyMs             float64 `json:"latencyMs"`
	CostPerGBMonthUSD     float64 `json:"costPerGbMonthUsd"`
	RetrievalCostPerGBUSD float64 `json:"retrievalCostPerGbUsd"`
	CloudProvider         string  `json:"cloudProvider"`
	IsActive              bool    `json:"isActive"`
}

// SearchType represents an Elasticsearch instance type
type SearchType struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	VCPU           int     `json:"vcpu"`
	MemoryGB       float64 `json:"memoryGb"`
	StorageGB      int     `json:"storageGb"`
	QueriesPerSec  int     `json:"queriesPerSec"`
	LatencyMs      float64 `json:"latencyMs"`
	CostPerHourUSD float64 `json:"costPerHourUsd"`
	CloudProvider  string  `json:"cloudProvider"`
	IsActive       bool    `json:"isActive"`
}

// ComponentConfigField represents a configuration field for a component
type ComponentConfigField struct {
	ID              int             `json:"id"`
	ComponentTypeID string          `json:"componentTypeId"`
	FieldName       string          `json:"fieldName"`
	FieldType       string          `json:"fieldType"`
	IsRequired      bool            `json:"isRequired"`
	DefaultValue    sql.NullString  `json:"defaultValue,omitempty"`
	Options         json.RawMessage `json:"options,omitempty"`
	DisplayOrder    int             `json:"displayOrder"`
}

// ConnectionRule represents which components can connect to which
type ConnectionRule struct {
	ID                  int    `json:"id"`
	SourceComponentType string `json:"sourceComponentType"`
	TargetComponentType string `json:"targetComponentType"`
	IsAllowed           bool   `json:"isAllowed"`
}

// ComponentCatalogResponse is the full catalog response
type ComponentCatalogResponse struct {
	Components      []ComponentType        `json:"components"`
	ConfigFields    []ComponentConfigField `json:"configFields"`
	ConnectionRules []ConnectionRule       `json:"connectionRules"`
}

// ComponentDetailsResponse includes all configuration options for a component
type ComponentDetailsResponse struct {
	Component          ComponentType          `json:"component"`
	InstanceTypes      []InstanceType         `json:"instanceTypes,omitempty"`
	StorageTypes       []StorageType          `json:"storageTypes,omitempty"`
	LoadBalancerTypes  []LoadBalancerType     `json:"loadBalancerTypes,omitempty"`
	QueueTypes         []QueueType            `json:"queueTypes,omitempty"`
	CDNTypes           []CDNType              `json:"cdnTypes,omitempty"`
	ObjectStorageTypes []ObjectStorageType    `json:"objectStorageTypes,omitempty"`
	SearchTypes        []SearchType           `json:"searchTypes,omitempty"`
	ConfigFields       []ComponentConfigField `json:"configFields"`
	AllowedTargets     []string               `json:"allowedTargets"`
}

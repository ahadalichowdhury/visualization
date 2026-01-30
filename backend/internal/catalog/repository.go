package catalog

import (
	"database/sql"
	"fmt"
)

// Repository handles database operations for the component catalog
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new catalog repository
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetAllComponents retrieves all active component types
func (r *Repository) GetAllComponents() ([]ComponentType, error) {
	query := `
		SELECT id, name, icon, description, category, cloud_provider, is_active, created_at, updated_at
		FROM component_types
		WHERE is_active = true
		ORDER BY category, name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query components: %w", err)
	}
	defer rows.Close()

	var components []ComponentType
	for rows.Next() {
		var c ComponentType
		err := rows.Scan(&c.ID, &c.Name, &c.Icon, &c.Description, &c.Category,
			&c.CloudProvider, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan component: %w", err)
		}
		components = append(components, c)
	}

	return components, nil
}

// GetComponentByID retrieves a specific component type
func (r *Repository) GetComponentByID(id string) (*ComponentType, error) {
	query := `
		SELECT id, name, icon, description, category, cloud_provider, is_active, created_at, updated_at
		FROM component_types
		WHERE id = $1 AND is_active = true
	`

	var c ComponentType
	err := r.db.QueryRow(query, id).Scan(&c.ID, &c.Name, &c.Icon, &c.Description,
		&c.Category, &c.CloudProvider, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("component not found: %s", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query component: %w", err)
	}

	return &c, nil
}

// GetInstanceTypes retrieves instance types for a component
func (r *Repository) GetInstanceTypes(componentTypeID string) ([]InstanceType, error) {
	query := `
		SELECT id, component_type_id, name, vcpu, memory_gb, network_gbps, 
			   COALESCE(storage_type, ''), COALESCE(base_iops, 0), 
			   cost_per_hour_usd, cloud_provider, region_multiplier, is_active
		FROM instance_types
		WHERE component_type_id = $1 AND is_active = true
		ORDER BY cost_per_hour_usd
	`

	rows, err := r.db.Query(query, componentTypeID)
	if err != nil {
		return nil, fmt.Errorf("failed to query instance types: %w", err)
	}
	defer rows.Close()

	var instances []InstanceType
	for rows.Next() {
		var i InstanceType
		err := rows.Scan(&i.ID, &i.ComponentTypeID, &i.Name, &i.VCPU, &i.MemoryGB,
			&i.NetworkGbps, &i.StorageType, &i.BaseIOPS, &i.CostPerHourUSD,
			&i.CloudProvider, &i.RegionMultiplier, &i.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan instance type: %w", err)
		}
		instances = append(instances, i)
	}

	return instances, nil
}

// GetStorageTypes retrieves all storage types
func (r *Repository) GetStorageTypes() ([]StorageType, error) {
	query := `
		SELECT id, name, iops_per_gb, throughput_mbps, latency_ms, 
			   cost_per_gb_month_usd, cloud_provider, is_active
		FROM storage_types
		WHERE is_active = true
		ORDER BY cost_per_gb_month_usd
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query storage types: %w", err)
	}
	defer rows.Close()

	var storageTypes []StorageType
	for rows.Next() {
		var s StorageType
		err := rows.Scan(&s.ID, &s.Name, &s.IOPSPerGB, &s.ThroughputMBps, &s.LatencyMs,
			&s.CostPerGBMonthUSD, &s.CloudProvider, &s.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan storage type: %w", err)
		}
		storageTypes = append(storageTypes, s)
	}

	return storageTypes, nil
}

// GetLoadBalancerTypes retrieves all load balancer types
func (r *Repository) GetLoadBalancerTypes() ([]LoadBalancerType, error) {
	query := `
		SELECT id, name, max_connections, capacity_rps, latency_ms, 
			   cost_per_hour_usd, cloud_provider, is_active
		FROM load_balancer_types
		WHERE is_active = true
		ORDER BY capacity_rps
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query load balancer types: %w", err)
	}
	defer rows.Close()

	var lbTypes []LoadBalancerType
	for rows.Next() {
		var lb LoadBalancerType
		err := rows.Scan(&lb.ID, &lb.Name, &lb.MaxConnections, &lb.CapacityRPS,
			&lb.LatencyMs, &lb.CostPerHourUSD, &lb.CloudProvider, &lb.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan load balancer type: %w", err)
		}
		lbTypes = append(lbTypes, lb)
	}

	return lbTypes, nil
}

// GetQueueTypes retrieves all queue types
func (r *Repository) GetQueueTypes() ([]QueueType, error) {
	query := `
		SELECT id, name, max_messages, throughput_msgs_per_sec, latency_ms,
			   cost_per_million_requests_usd, message_retention_days, supports_fifo,
			   cloud_provider, is_active
		FROM queue_types
		WHERE is_active = true
		ORDER BY throughput_msgs_per_sec
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query queue types: %w", err)
	}
	defer rows.Close()

	var queueTypes []QueueType
	for rows.Next() {
		var q QueueType
		err := rows.Scan(&q.ID, &q.Name, &q.MaxMessages, &q.ThroughputMsgsPerSec,
			&q.LatencyMs, &q.CostPerMillionRequestsUSD, &q.MessageRetentionDays,
			&q.SupportsFIFO, &q.CloudProvider, &q.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan queue type: %w", err)
		}
		queueTypes = append(queueTypes, q)
	}

	return queueTypes, nil
}

// GetCDNTypes retrieves all CDN types
func (r *Repository) GetCDNTypes() ([]CDNType, error) {
	query := `
		SELECT id, name, edge_locations, throughput_gbps, latency_ms,
			   cost_per_gb_usd, cloud_provider, is_active
		FROM cdn_types
		WHERE is_active = true
		ORDER BY edge_locations
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query CDN types: %w", err)
	}
	defer rows.Close()

	var cdnTypes []CDNType
	for rows.Next() {
		var c CDNType
		err := rows.Scan(&c.ID, &c.Name, &c.EdgeLocations, &c.ThroughputGbps,
			&c.LatencyMs, &c.CostPerGBUSD, &c.CloudProvider, &c.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan CDN type: %w", err)
		}
		cdnTypes = append(cdnTypes, c)
	}

	return cdnTypes, nil
}

// GetObjectStorageTypes retrieves all object storage types
func (r *Repository) GetObjectStorageTypes() ([]ObjectStorageType, error) {
	query := `
		SELECT id, name, availability, latency_ms, cost_per_gb_month_usd,
			   retrieval_cost_per_gb_usd, cloud_provider, is_active
		FROM object_storage_types
		WHERE is_active = true
		ORDER BY cost_per_gb_month_usd
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query object storage types: %w", err)
	}
	defer rows.Close()

	var storageTypes []ObjectStorageType
	for rows.Next() {
		var s ObjectStorageType
		err := rows.Scan(&s.ID, &s.Name, &s.Availability, &s.LatencyMs,
			&s.CostPerGBMonthUSD, &s.RetrievalCostPerGBUSD, &s.CloudProvider, &s.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan object storage type: %w", err)
		}
		storageTypes = append(storageTypes, s)
	}

	return storageTypes, nil
}

// GetSearchTypes retrieves all search engine types
func (r *Repository) GetSearchTypes() ([]SearchType, error) {
	query := `
		SELECT id, name, vcpu, memory_gb, storage_gb, queries_per_sec, latency_ms,
			   cost_per_hour_usd, cloud_provider, is_active
		FROM search_types
		WHERE is_active = true
		ORDER BY cost_per_hour_usd
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query search types: %w", err)
	}
	defer rows.Close()

	var searchTypes []SearchType
	for rows.Next() {
		var s SearchType
		err := rows.Scan(&s.ID, &s.Name, &s.VCPU, &s.MemoryGB, &s.StorageGB,
			&s.QueriesPerSec, &s.LatencyMs, &s.CostPerHourUSD, &s.CloudProvider, &s.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search type: %w", err)
		}
		searchTypes = append(searchTypes, s)
	}

	return searchTypes, nil
}

// GetConfigFields retrieves configuration fields for a component
func (r *Repository) GetConfigFields(componentTypeID string) ([]ComponentConfigField, error) {
	query := `
		SELECT id, component_type_id, field_name, field_type, is_required, 
			   default_value, options, display_order
		FROM component_config_fields
		WHERE component_type_id = $1
		ORDER BY display_order
	`

	rows, err := r.db.Query(query, componentTypeID)
	if err != nil {
		return nil, fmt.Errorf("failed to query config fields: %w", err)
	}
	defer rows.Close()

	var fields []ComponentConfigField
	for rows.Next() {
		var f ComponentConfigField
		err := rows.Scan(&f.ID, &f.ComponentTypeID, &f.FieldName, &f.FieldType,
			&f.IsRequired, &f.DefaultValue, &f.Options, &f.DisplayOrder)
		if err != nil {
			return nil, fmt.Errorf("failed to scan config field: %w", err)
		}
		fields = append(fields, f)
	}

	return fields, nil
}

// GetAllConfigFields retrieves all configuration fields
func (r *Repository) GetAllConfigFields() ([]ComponentConfigField, error) {
	query := `
		SELECT id, component_type_id, field_name, field_type, is_required, 
			   default_value, options, display_order
		FROM component_config_fields
		ORDER BY component_type_id, display_order
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query config fields: %w", err)
	}
	defer rows.Close()

	var fields []ComponentConfigField
	for rows.Next() {
		var f ComponentConfigField
		err := rows.Scan(&f.ID, &f.ComponentTypeID, &f.FieldName, &f.FieldType,
			&f.IsRequired, &f.DefaultValue, &f.Options, &f.DisplayOrder)
		if err != nil {
			return nil, fmt.Errorf("failed to scan config field: %w", err)
		}
		fields = append(fields, f)
	}

	return fields, nil
}

// GetConnectionRules retrieves all connection rules
func (r *Repository) GetConnectionRules() ([]ConnectionRule, error) {
	query := `
		SELECT id, source_component_type, target_component_type, is_allowed
		FROM connection_rules
		WHERE is_allowed = true
		ORDER BY source_component_type, target_component_type
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query connection rules: %w", err)
	}
	defer rows.Close()

	var rules []ConnectionRule
	for rows.Next() {
		var r ConnectionRule
		err := rows.Scan(&r.ID, &r.SourceComponentType, &r.TargetComponentType, &r.IsAllowed)
		if err != nil {
			return nil, fmt.Errorf("failed to scan connection rule: %w", err)
		}
		rules = append(rules, r)
	}

	return rules, nil
}

// GetAllowedTargets retrieves allowed target components for a source component
func (r *Repository) GetAllowedTargets(sourceComponentType string) ([]string, error) {
	query := `
		SELECT target_component_type
		FROM connection_rules
		WHERE source_component_type = $1 AND is_allowed = true
		ORDER BY target_component_type
	`

	rows, err := r.db.Query(query, sourceComponentType)
	if err != nil {
		return nil, fmt.Errorf("failed to query allowed targets: %w", err)
	}
	defer rows.Close()

	var targets []string
	for rows.Next() {
		var target string
		err := rows.Scan(&target)
		if err != nil {
			return nil, fmt.Errorf("failed to scan target: %w", err)
		}
		targets = append(targets, target)
	}

	return targets, nil
}

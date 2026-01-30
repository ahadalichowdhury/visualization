-- Component Catalog Schema
-- This defines all available components and their configuration options

CREATE TABLE IF NOT EXISTS component_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- compute, storage, network, messaging, other
    cloud_provider VARCHAR(20) DEFAULT 'aws', -- aws, gcp, azure, multi
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instance Types (EC2, RDS, ElastiCache, etc.)
CREATE TABLE IF NOT EXISTS instance_types (
    id VARCHAR(50) PRIMARY KEY,
    component_type_id VARCHAR(50) REFERENCES component_types(id),
    name VARCHAR(100) NOT NULL,
    vcpu INT NOT NULL,
    memory_gb DECIMAL(10,2) NOT NULL,
    network_gbps DECIMAL(10,2),
    storage_type VARCHAR(50), -- For databases
    base_iops INT, -- For storage
    cost_per_hour_usd DECIMAL(10,4) NOT NULL,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    region_multiplier DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage Types (EBS gp3, io2, etc.)
CREATE TABLE IF NOT EXISTS storage_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iops_per_gb INT NOT NULL,
    throughput_mbps INT NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_gb_month_usd DECIMAL(10,4) NOT NULL,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- Load Balancer Types
CREATE TABLE IF NOT EXISTS load_balancer_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_connections INT NOT NULL,
    capacity_rps INT NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_hour_usd DECIMAL(10,4) NOT NULL,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- Queue Types (SQS, Kafka, etc.)
CREATE TABLE IF NOT EXISTS queue_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_messages BIGINT NOT NULL,
    throughput_msgs_per_sec INT NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_million_requests_usd DECIMAL(10,4) NOT NULL,
    message_retention_days INT DEFAULT 4,
    supports_fifo BOOLEAN DEFAULT false,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- CDN Types
CREATE TABLE IF NOT EXISTS cdn_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    edge_locations INT NOT NULL,
    throughput_gbps DECIMAL(10,2) NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_gb_usd DECIMAL(10,4) NOT NULL,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- Object Storage Types (S3 classes)
CREATE TABLE IF NOT EXISTS object_storage_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    availability VARCHAR(20) NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_gb_month_usd DECIMAL(10,4) NOT NULL,
    retrieval_cost_per_gb_usd DECIMAL(10,4) DEFAULT 0,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- Search Engine Types (Elasticsearch)
CREATE TABLE IF NOT EXISTS search_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vcpu INT NOT NULL,
    memory_gb DECIMAL(10,2) NOT NULL,
    storage_gb INT NOT NULL,
    queries_per_sec INT NOT NULL,
    latency_ms DECIMAL(10,2) NOT NULL,
    cost_per_hour_usd DECIMAL(10,4) NOT NULL,
    cloud_provider VARCHAR(20) DEFAULT 'aws',
    is_active BOOLEAN DEFAULT true
);

-- Component Configuration Fields (defines what fields each component needs)
CREATE TABLE IF NOT EXISTS component_config_fields (
    id SERIAL PRIMARY KEY,
    component_type_id VARCHAR(50) REFERENCES component_types(id),
    field_name VARCHAR(50) NOT NULL,
    field_type VARCHAR(20) NOT NULL, -- string, number, boolean, select
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    options JSONB, -- For select fields
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connection Rules (which components can connect to which)
CREATE TABLE IF NOT EXISTS connection_rules (
    id SERIAL PRIMARY KEY,
    source_component_type VARCHAR(50) REFERENCES component_types(id),
    target_component_type VARCHAR(50) REFERENCES component_types(id),
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_component_type, target_component_type)
);

-- Indexes for performance
CREATE INDEX idx_instance_types_component ON instance_types(component_type_id);
CREATE INDEX idx_config_fields_component ON component_config_fields(component_type_id);
CREATE INDEX idx_connection_rules_source ON connection_rules(source_component_type);
CREATE INDEX idx_connection_rules_target ON connection_rules(target_component_type);

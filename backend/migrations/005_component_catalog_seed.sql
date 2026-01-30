-- Seed data for Component Catalog
-- This populates the database with AWS components and their configurations

-- ==================== COMPONENT TYPES ====================
INSERT INTO component_types (id, name, icon, description, category, cloud_provider) VALUES
-- Compute
('api_server', 'API Server', '🖥️', 'Application/API server', 'compute', 'aws'),
('web_server', 'Web Server', '🌍', 'Static web server', 'compute', 'aws'),
('microservice', 'Microservice', '⚙️', 'Independent microservice', 'compute', 'aws'),
('worker', 'Background Worker', '👷', 'Background job processor', 'compute', 'aws'),

-- Databases
('database_sql', 'SQL Database', '🗄️', 'Relational database (PostgreSQL/MySQL)', 'storage', 'aws'),
('database_nosql', 'NoSQL Database', '🗃️', 'Document database (MongoDB/DynamoDB)', 'storage', 'aws'),
('database_graph', 'Graph Database', '🕸️', 'Graph database (Neo4j)', 'storage', 'aws'),
('database_timeseries', 'Time Series DB', '📈', 'Time series database (InfluxDB)', 'storage', 'aws'),

-- Caches
('cache_redis', 'Redis Cache', '⚡', 'In-memory cache', 'storage', 'aws'),
('cache_memcached', 'Memcached', '💾', 'Distributed memory cache', 'storage', 'aws'),

-- Network
('load_balancer', 'Load Balancer', '⚖️', 'Distributes traffic across servers', 'network', 'aws'),
('api_gateway', 'API Gateway', '🚪', 'API gateway for routing requests', 'network', 'aws'),
('cdn', 'CDN', '🌐', 'Content delivery network', 'network', 'aws'),

-- Messaging
('queue', 'Message Queue', '📮', 'Async message queue (SQS)', 'messaging', 'aws'),
('message_broker', 'Message Broker', '📡', 'Pub/sub messaging (Kafka)', 'messaging', 'aws'),

-- Storage
('object_storage', 'Object Storage', '📦', 'S3-like object storage', 'storage', 'aws'),
('search', 'Search Engine', '🔍', 'Full-text search (Elasticsearch)', 'storage', 'aws'),

-- Clients
('client', 'Client', '👤', 'User/client application', 'other', 'multi'),
('mobile_app', 'Mobile App', '📱', 'Mobile application client', 'other', 'multi'),
('web_browser', 'Web Browser', '🌐', 'Web browser client', 'other', 'multi')
ON CONFLICT (id) DO NOTHING;

-- ==================== INSTANCE TYPES ====================

-- EC2 Compute Instances
INSERT INTO instance_types (id, component_type_id, name, vcpu, memory_gb, network_gbps, cost_per_hour_usd) VALUES
-- T3 (Burstable)
('t3.micro', 'api_server', 't3.micro', 2, 1, 5.0, 0.0104),
('t3.small', 'api_server', 't3.small', 2, 2, 5.0, 0.0208),
('t3.medium', 'api_server', 't3.medium', 2, 4, 5.0, 0.0416),
('t3.large', 'api_server', 't3.large', 2, 8, 5.0, 0.0832),
('t3.xlarge', 'api_server', 't3.xlarge', 4, 16, 5.0, 0.1664),

-- M5 (General Purpose)
('m5.large', 'api_server', 'm5.large', 2, 8, 10.0, 0.096),
('m5.xlarge', 'api_server', 'm5.xlarge', 4, 16, 10.0, 0.192),
('m5.2xlarge', 'api_server', 'm5.2xlarge', 8, 32, 10.0, 0.384),
('m5.4xlarge', 'api_server', 'm5.4xlarge', 16, 64, 10.0, 0.768),

-- C5 (Compute Optimized)
('c5.large', 'api_server', 'c5.large', 2, 4, 10.0, 0.085),
('c5.xlarge', 'api_server', 'c5.xlarge', 4, 8, 10.0, 0.17),
('c5.2xlarge', 'api_server', 'c5.2xlarge', 8, 16, 10.0, 0.34),
('c5.4xlarge', 'api_server', 'c5.4xlarge', 16, 32, 10.0, 0.68)
ON CONFLICT (id) DO NOTHING;

-- RDS Database Instances
INSERT INTO instance_types (id, component_type_id, name, vcpu, memory_gb, network_gbps, cost_per_hour_usd) VALUES
('db.t3.micro', 'database_sql', 'db.t3.micro', 2, 1, 5.0, 0.017),
('db.t3.small', 'database_sql', 'db.t3.small', 2, 2, 5.0, 0.034),
('db.t3.medium', 'database_sql', 'db.t3.medium', 2, 4, 5.0, 0.068),
('db.t3.large', 'database_sql', 'db.t3.large', 2, 8, 5.0, 0.136),
('db.m5.large', 'database_sql', 'db.m5.large', 2, 8, 10.0, 0.188),
('db.m5.xlarge', 'database_sql', 'db.m5.xlarge', 4, 16, 10.0, 0.376),
('db.m5.2xlarge', 'database_sql', 'db.m5.2xlarge', 8, 32, 10.0, 0.752),
('db.r5.large', 'database_sql', 'db.r5.large (Memory Optimized)', 2, 16, 10.0, 0.29),
('db.r5.xlarge', 'database_sql', 'db.r5.xlarge', 4, 32, 10.0, 0.58),
('db.r5.2xlarge', 'database_sql', 'db.r5.2xlarge', 8, 64, 10.0, 1.16)
ON CONFLICT (id) DO NOTHING;

-- ElastiCache Instances
INSERT INTO instance_types (id, component_type_id, name, vcpu, memory_gb, network_gbps, cost_per_hour_usd) VALUES
('cache.t3.micro', 'cache_redis', 'cache.t3.micro', 2, 0.5, 5.0, 0.017),
('cache.t3.small', 'cache_redis', 'cache.t3.small', 2, 1.37, 5.0, 0.034),
('cache.t3.medium', 'cache_redis', 'cache.t3.medium', 2, 3.09, 5.0, 0.068),
('cache.m5.large', 'cache_redis', 'cache.m5.large', 2, 6.38, 10.0, 0.136),
('cache.m5.xlarge', 'cache_redis', 'cache.m5.xlarge', 4, 12.93, 10.0, 0.272),
('cache.r5.large', 'cache_redis', 'cache.r5.large (Memory Optimized)', 2, 13.07, 10.0, 0.252),
('cache.r5.xlarge', 'cache_redis', 'cache.r5.xlarge', 4, 26.32, 10.0, 0.504)
ON CONFLICT (id) DO NOTHING;

-- ==================== STORAGE TYPES ====================
INSERT INTO storage_types (id, name, iops_per_gb, throughput_mbps, latency_ms, cost_per_gb_month_usd) VALUES
('gp3', 'General Purpose SSD (gp3)', 3, 125, 1.0, 0.08),
('gp2', 'General Purpose SSD (gp2)', 3, 128, 1.2, 0.10),
('io2', 'Provisioned IOPS SSD (io2)', 64, 1000, 0.5, 0.125),
('io1', 'Provisioned IOPS SSD (io1)', 50, 1000, 0.6, 0.125),
('st1', 'Throughput Optimized HDD (st1)', 0, 500, 5.0, 0.045),
('sc1', 'Cold HDD (sc1)', 0, 250, 10.0, 0.015)
ON CONFLICT (id) DO NOTHING;

-- ==================== LOAD BALANCER TYPES ====================
INSERT INTO load_balancer_types (id, name, max_connections, capacity_rps, latency_ms, cost_per_hour_usd) VALUES
('alb', 'Application Load Balancer (ALB)', 100000, 50000, 5.0, 0.0225),
('nlb', 'Network Load Balancer (NLB)', 1000000, 500000, 1.0, 0.0225),
('classic', 'Classic Load Balancer', 50000, 25000, 10.0, 0.025)
ON CONFLICT (id) DO NOTHING;

-- ==================== QUEUE TYPES ====================
INSERT INTO queue_types (id, name, max_messages, throughput_msgs_per_sec, latency_ms, cost_per_million_requests_usd, message_retention_days, supports_fifo) VALUES
('sqs-standard', 'SQS Standard Queue', 120000, 3000, 10.0, 0.40, 4, false),
('sqs-fifo', 'SQS FIFO Queue', 120000, 300, 15.0, 0.50, 4, true),
('kafka-small', 'Kafka (Small Cluster)', 1000000, 10000, 5.0, 0.10, 7, true),
('kafka-medium', 'Kafka (Medium Cluster)', 10000000, 50000, 3.0, 0.15, 14, true),
('kafka-large', 'Kafka (Large Cluster)', 100000000, 200000, 2.0, 0.20, 30, true)
ON CONFLICT (id) DO NOTHING;

-- ==================== CDN TYPES ====================
INSERT INTO cdn_types (id, name, edge_locations, throughput_gbps, latency_ms, cost_per_gb_usd) VALUES
('cloudfront-basic', 'CloudFront (Basic)', 50, 10.0, 50.0, 0.085),
('cloudfront-premium', 'CloudFront (Premium)', 200, 100.0, 20.0, 0.120),
('cloudfront-enterprise', 'CloudFront (Enterprise)', 400, 500.0, 10.0, 0.150)
ON CONFLICT (id) DO NOTHING;

-- ==================== OBJECT STORAGE TYPES ====================
INSERT INTO object_storage_types (id, name, availability, latency_ms, cost_per_gb_month_usd, retrieval_cost_per_gb_usd) VALUES
('s3-standard', 'S3 Standard', '99.99%', 100.0, 0.023, 0.0),
('s3-ia', 'S3 Infrequent Access', '99.9%', 150.0, 0.0125, 0.01),
('s3-glacier', 'S3 Glacier', '99.99%', 180000.0, 0.004, 0.02),
('s3-glacier-deep', 'S3 Glacier Deep Archive', '99.99%', 432000000.0, 0.00099, 0.02)
ON CONFLICT (id) DO NOTHING;

-- ==================== SEARCH TYPES ====================
INSERT INTO search_types (id, name, vcpu, memory_gb, storage_gb, queries_per_sec, latency_ms, cost_per_hour_usd) VALUES
('es-small', 'Elasticsearch (Small)', 2, 4, 50, 500, 50.0, 0.12),
('es-medium', 'Elasticsearch (Medium)', 4, 16, 200, 2000, 30.0, 0.48),
('es-large', 'Elasticsearch (Large)', 8, 32, 500, 5000, 20.0, 0.96)
ON CONFLICT (id) DO NOTHING;

-- ==================== COMPONENT CONFIG FIELDS ====================

-- API Server fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, display_order) VALUES
('api_server', 'region', 'select', true, 'us-east', 1),
('api_server', 'instanceType', 'select', true, 't3.medium', 2),
('api_server', 'replicas', 'number', false, '1', 3);

-- Database fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, options, display_order) VALUES
('database_sql', 'region', 'select', true, 'us-east', NULL, 1),
('database_sql', 'instanceType', 'select', true, 'db.t3.medium', NULL, 2),
('database_sql', 'databaseEngine', 'select', true, 'postgres', '["postgres", "mysql", "mariadb"]'::jsonb, 3),
('database_sql', 'storageType', 'select', true, 'gp3', NULL, 4),
('database_sql', 'storage_size_gb', 'number', true, '100', NULL, 5),
('database_sql', 'consistency', 'select', false, 'strong', '["strong", "eventual"]'::jsonb, 6),
('database_sql', 'replicas', 'number', false, '1', NULL, 7);

-- Cache fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, options, display_order) VALUES
('cache_redis', 'region', 'select', true, 'us-east', NULL, 1),
('cache_redis', 'instanceType', 'select', true, 'cache.t3.small', NULL, 2),
('cache_redis', 'cacheEngine', 'select', true, 'redis', '["redis", "memcached"]'::jsonb, 3),
('cache_redis', 'ttl_ms', 'number', false, '3600000', NULL, 4),
('cache_redis', 'replicas', 'number', false, '1', NULL, 5);

-- Queue fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, options, display_order) VALUES
('queue', 'region', 'select', true, 'us-east', NULL, 1),
('queue', 'queueType', 'select', true, 'sqs-standard', NULL, 2),
('queue', 'maxQueueDepth', 'number', false, '100000', NULL, 3),
('queue', 'messageRetentionDays', 'number', false, '4', NULL, 4);

-- API Gateway fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, options, display_order) VALUES
('api_gateway', 'region', 'select', true, 'us-east', NULL, 1),
('api_gateway', 'apiGatewayType', 'select', true, 'rest', '["rest", "http", "websocket"]'::jsonb, 2),
('api_gateway', 'throttleRPS', 'number', false, '10000', NULL, 3);

-- Load Balancer fields
INSERT INTO component_config_fields (component_type_id, field_name, field_type, is_required, default_value, display_order) VALUES
('load_balancer', 'region', 'select', true, 'us-east', 1),
('load_balancer', 'lbType', 'select', true, 'alb', 2);

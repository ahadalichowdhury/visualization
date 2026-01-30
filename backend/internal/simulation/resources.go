package simulation

import "math"

// ResourceUsage represents the resource consumption of a node
type ResourceUsage struct {
	CPUPercent     float64
	MemoryPercent  float64
	DiskIOPercent  float64
	NetworkPercent float64
	Bottleneck     string // "cpu", "memory", "disk", "network", "none"
}

// calculateResourceUsage determines realistic resource usage based on component type
func calculateResourceUsage(node *NodeState, incomingRPS float64, effectiveCapacity float64) ResourceUsage {
	if effectiveCapacity == 0 {
		return ResourceUsage{CPUPercent: 0, MemoryPercent: 20, Bottleneck: "none"}
	}

	loadRatio := incomingRPS / effectiveCapacity

	switch {
	// ==================== COMPUTE SERVICES ====================
	case node.Type == "api_server" || node.Type == "web_server" || node.Type == "microservice":
		return calculateComputeResources(loadRatio)

	// ==================== DATABASES ====================
	case node.Type == "database_sql" || node.Type == "database_postgres" || node.Type == "database_mysql":
		return calculateSQLDatabaseResources(node, loadRatio)

	case node.Type == "database_nosql" || node.Type == "database_mongodb":
		return calculateNoSQLDatabaseResources(node, loadRatio)

	case node.Type == "database_graph":
		return calculateGraphDatabaseResources(loadRatio)

	case node.Type == "database_timeseries":
		return calculateTimeSeriesDatabaseResources(loadRatio)

	// ==================== CACHES ====================
	case node.Type == "cache_redis" || node.Type == "cache_memcached":
		return calculateCacheResources(node, loadRatio)

	// ==================== QUEUES & MESSAGE BROKERS ====================
	case node.Type == "queue" || node.Type == "message_broker" || node.Type == "event_bus":
		return calculateQueueResources(node, loadRatio)

	// ==================== LOAD BALANCERS ====================
	case node.Type == "load_balancer" || node.Type == "api_gateway" || node.Type == "reverse_proxy":
		return calculateLoadBalancerResources(loadRatio)

	// ==================== WORKERS ====================
	case node.Type == "worker":
		return calculateWorkerResources(loadRatio)

	// ==================== STORAGE ====================
	case node.Type == "object_storage" || node.Type == "file_storage":
		return calculateStorageResources(loadRatio)

	// ==================== CDN ====================
	case node.Type == "cdn":
		return calculateCDNResources(loadRatio)

	// ==================== SEARCH ====================
	case node.Type == "search":
		return calculateSearchResources(loadRatio)

	// ==================== TELEMETRY ====================
	case node.Type == "monitoring" || node.Type == "logging" || node.Type == "analytics_service":
		return calculateTelemetryResources(loadRatio)

	// ==================== SRE PRODUCTION FIX: NEW COMPONENTS ====================
	case node.Type == "apm":
		return calculateAPMResources(loadRatio)

	case node.Type == "sidecar_proxy":
		return calculateSidecarProxyResources(loadRatio)

	// MEDIUM PRIORITY: Additional Observability
	case node.Type == "rum":
		return calculateRUMResources(loadRatio)

	case node.Type == "synthetic_monitoring":
		return calculateSyntheticMonitoringResources(loadRatio)

	// MEDIUM PRIORITY: Modern API Patterns
	case node.Type == "graphql_gateway":
		return calculateGraphQLGatewayResources(loadRatio)

	case node.Type == "grpc_server":
		return calculateGRPCServerResources(loadRatio)

	// LOW PRIORITY: Edge & Web3
	case node.Type == "wasm_runtime":
		return calculateWASMRuntimeResources(loadRatio)

	case node.Type == "blockchain_node":
		return calculateBlockchainNodeResources(loadRatio)

	// PRIORITY 2: Serverless Functions
	case node.Type == "lambda_function" || node.Type == "cloud_function" || node.Type == "azure_function":
		return calculateServerlessResources(loadRatio)

	// PRIORITY 2: AI/ML Model Serving
	case node.Type == "sagemaker_endpoint" || node.Type == "vertex_ai_endpoint" || node.Type == "azure_ml_endpoint":
		return calculateMLEndpointResources(loadRatio)

	// PRIORITY 2: Kubernetes Components
	case node.Type == "k8s_pod":
		return calculateK8sPodResources(loadRatio)
	case node.Type == "k8s_service":
		return calculateK8sServiceResources(loadRatio)
	case node.Type == "k8s_ingress":
		return calculateK8sIngressResources(loadRatio)

	// PRIORITY 2: Multi-cloud Equivalents
	case node.Type == "azure_app_service" || node.Type == "gcp_app_engine":
		return calculatePaaSWebAppResources(loadRatio)
	case node.Type == "azure_cosmos_db":
		return calculateCosmosDBResources(loadRatio)
	case node.Type == "gcp_firestore":
		return calculateFirestoreResources(loadRatio)
	case node.Type == "azure_service_bus" || node.Type == "gcp_pub_sub":
		return calculateManagedMessagingResources(loadRatio)

	// ==================== DEFAULT ====================
	default:
		return calculateDefaultResources(loadRatio)
	}
}

// ==================== COMPUTE RESOURCES ====================
func calculateComputeResources(loadRatio float64) ResourceUsage {
	// API/Web servers are CPU-bound with moderate memory usage
	cpu := math.Min(100, loadRatio*100)
	memory := 30.0 + (loadRatio * 40.0) // 30-70% memory usage
	memory = math.Min(90, memory)

	bottleneck := "none"
	if cpu > 85 {
		bottleneck = "cpu"
	} else if memory > 85 {
		bottleneck = "memory"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  10.0, // Minimal disk I/O
		NetworkPercent: math.Min(100, loadRatio*80),
		Bottleneck:     bottleneck,
	}
}

// ==================== SQL DATABASE RESOURCES ====================
func calculateSQLDatabaseResources(node *NodeState, loadRatio float64) ResourceUsage {
	// SQL databases are CPU + Disk I/O bound
	// CPU: Query parsing, joins, aggregations
	// Disk I/O: Reads/writes, index lookups
	// Memory: Buffer pool, connections

	// Calculate Read/Write impact
	// Default 80% if not set (safe fallback)
	ratio := float64(node.ReadRatio)
	if ratio == 0 && node.ReadRatio == 0 {
		// If explicitly 0, it means 100% writes.
		// If undefined (should be 80 from init), it works.
		// Check against uninitialized:
	}
	readRatio := float64(node.ReadRatio) / 100.0
	writeRatio := 1.0 - readRatio

	// CPU Calculation:
	// - Base query overhead
	// - Writes are ~1.5x more expensive (locks, constraints, wal)
	cpuFactor := 1.0 + (writeRatio * 0.5)

	cpu := (20.0 + (loadRatio * 60.0)) * cpuFactor
	cpu = math.Min(100, cpu)

	// Disk I/O Calculation:
	// - Reads can be cached (lower I/O)
	// - Writes ALWAYS hit disk (WAL + Data) - 2x-3x more expensive
	diskFactor := 0.5 + (writeRatio * 2.0) // 0.5 (pure read) to 2.5 (pure write)

	diskIO := (10.0 + (loadRatio * 50.0)) * diskFactor
	diskIO = math.Min(100, diskIO)

	// Memory grows with connection count and cache needs (mostly Read dependent)
	// High reads = High memory pressure for buffer pool
	memFactor := 0.8 + (readRatio * 0.4) // 0.8 (pure write) to 1.2 (pure read)
	memory := (40.0 + (loadRatio * 40.0)) * memFactor
	memory = math.Min(95, memory)

	// Determine bottleneck
	bottleneck := "none"
	if diskIO > 85 {
		bottleneck = "disk"
	} else if cpu > 85 {
		bottleneck = "cpu"
	} else if memory > 85 {
		bottleneck = "memory"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: math.Min(100, loadRatio*60),
		Bottleneck:     bottleneck,
	}
}

// ==================== NOSQL DATABASE RESOURCES ====================
func calculateNoSQLDatabaseResources(node *NodeState, loadRatio float64) ResourceUsage {
	// NoSQL databases (MongoDB, DynamoDB)

	readRatio := float64(node.ReadRatio) / 100.0
	writeRatio := 1.0 - readRatio

	// CPU: Less intensive than SQL, but writes still cost more (indexing)
	cpuFactor := 1.0 + (writeRatio * 0.3)
	cpu := (15.0 + (loadRatio * 45.0)) * cpuFactor
	cpu = math.Min(100, cpu)

	// Memory: Critical for document caching (mostly beneficial for Reads)
	// Writes don't need as much RAM (just commit log buffer)
	memFactor := 0.7 + (readRatio * 0.6) // Reads need more RAM
	memory := (40.0 + (loadRatio * 40.0)) * memFactor
	memory = math.Min(95, memory)

	// Disk I/O: Writes are heavy (append logs + compaction)
	diskFactor := 0.6 + (writeRatio * 1.8)
	diskIO := (10.0 + (loadRatio * 50.0)) * diskFactor
	diskIO = math.Min(100, diskIO)

	bottleneck := "none"
	if memory > 90 {
		bottleneck = "memory"
	} else if diskIO > 85 {
		bottleneck = "disk"
	} else if cpu > 85 {
		bottleneck = "cpu"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: math.Min(100, loadRatio*70),
		Bottleneck:     bottleneck,
	}
}

// ==================== GRAPH DATABASE RESOURCES ====================
func calculateGraphDatabaseResources(loadRatio float64) ResourceUsage {
	// Graph databases (Neo4j) are extremely CPU-intensive
	// Traversals require heavy computation

	cpu := 30.0 + (loadRatio * 65.0) // 30-95% CPU
	cpu = math.Min(100, cpu)

	memory := 60.0 + (loadRatio * 30.0) // 60-90% memory (graph in RAM)
	memory = math.Min(95, memory)

	diskIO := 20.0 + (loadRatio * 50.0)
	diskIO = math.Min(100, diskIO)

	bottleneck := "cpu" // Almost always CPU-bound
	if memory > 90 {
		bottleneck = "memory"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: math.Min(100, loadRatio*50),
		Bottleneck:     bottleneck,
	}
}

// ==================== TIME SERIES DATABASE RESOURCES ====================
func calculateTimeSeriesDatabaseResources(loadRatio float64) ResourceUsage {
	// Time series DBs (InfluxDB, TimescaleDB) are write-heavy
	// Disk I/O is the primary bottleneck

	cpu := 25.0 + (loadRatio * 55.0)
	cpu = math.Min(100, cpu)

	memory := 35.0 + (loadRatio * 50.0)
	memory = math.Min(90, memory)

	// Very high disk I/O for time-series writes
	diskIO := 30.0 + (loadRatio * 65.0)
	diskIO = math.Min(100, diskIO)

	bottleneck := "disk" // Usually disk-bound
	if cpu > 90 {
		bottleneck = "cpu"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: math.Min(100, loadRatio*75),
		Bottleneck:     bottleneck,
	}
}

// ==================== CACHE RESOURCES ====================
func calculateCacheResources(node *NodeState, loadRatio float64) ResourceUsage {
	// Redis/Memcached are MEMORY-bound, not CPU-bound
	// CPU usage is minimal even at high load

	cpu := 5.0 + (loadRatio * 15.0) // 5-20% CPU (very efficient)
	cpu = math.Min(25, cpu)

	// Memory is the critical resource
	memory := 40.0 + (loadRatio * 50.0) // 40-90% memory
	memory = math.Min(95, memory)

	// Network can be a bottleneck at very high RPS
	network := math.Min(100, loadRatio*90)

	bottleneck := "none"
	if memory > 85 {
		bottleneck = "memory"
	} else if network > 90 {
		bottleneck = "network"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  0.0, // In-memory only
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== QUEUE RESOURCES ====================
func calculateQueueResources(node *NodeState, loadRatio float64) ResourceUsage {
	// Queues (SQS, Kafka) are I/O and Network-bound
	// CPU usage is very low (just routing messages)

	cpu := 3.0 + (loadRatio * 12.0) // 3-15% CPU
	cpu = math.Min(20, cpu)

	// Memory for buffering messages
	queueUtilization := float64(node.QueueDepth) / float64(node.MaxQueueDepth)
	memory := 20.0 + (queueUtilization * 70.0) // Based on queue depth
	memory = math.Min(95, memory)

	// Network is the primary resource
	network := math.Min(100, loadRatio*95)

	// Disk I/O for persistent queues (Kafka)
	diskIO := 0.0
	if node.Type == "message_broker" { // Kafka uses disk
		diskIO = 10.0 + (loadRatio * 60.0)
		diskIO = math.Min(100, diskIO)
	}

	bottleneck := "none"
	if queueUtilization > 0.8 {
		bottleneck = "memory" // Queue filling up
	} else if network > 90 {
		bottleneck = "network"
	} else if diskIO > 85 {
		bottleneck = "disk"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== LOAD BALANCER RESOURCES ====================
func calculateLoadBalancerResources(loadRatio float64) ResourceUsage {
	// Load balancers are network-bound
	// Very low CPU (just routing)

	cpu := 2.0 + (loadRatio * 8.0) // 2-10% CPU
	cpu = math.Min(15, cpu)

	memory := 10.0 + (loadRatio * 20.0) // 10-30% memory
	memory = math.Min(40, memory)

	network := math.Min(100, loadRatio*98)

	bottleneck := "network"

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  0.0,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== WORKER RESOURCES ====================
func calculateWorkerResources(loadRatio float64) ResourceUsage {
	// Workers are CPU-bound (processing jobs)

	cpu := math.Min(100, loadRatio*95)
	memory := 25.0 + (loadRatio * 60.0)
	memory = math.Min(85, memory)

	bottleneck := "cpu"

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  5.0,
		NetworkPercent: math.Min(100, loadRatio*40),
		Bottleneck:     bottleneck,
	}
}

// ==================== STORAGE RESOURCES ====================
func calculateStorageResources(loadRatio float64) ResourceUsage {
	// Object storage (S3) is network + disk I/O bound

	cpu := 5.0 + (loadRatio * 10.0)
	cpu = math.Min(20, cpu)

	memory := 15.0 + (loadRatio * 25.0)
	memory = math.Min(50, memory)

	diskIO := 20.0 + (loadRatio * 70.0)
	diskIO = math.Min(100, diskIO)

	network := math.Min(100, loadRatio*85)

	bottleneck := "disk"
	if network > 90 {
		bottleneck = "network"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== CDN RESOURCES ====================
func calculateCDNResources(loadRatio float64) ResourceUsage {
	// CDN is purely network-bound

	cpu := 1.0 + (loadRatio * 5.0)
	cpu = math.Min(10, cpu)

	memory := 10.0 + (loadRatio * 15.0)
	memory = math.Min(30, memory)

	network := math.Min(100, loadRatio*99)

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  5.0,
		NetworkPercent: network,
		Bottleneck:     "network",
	}
}

// ==================== SEARCH RESOURCES ====================
func calculateSearchResources(loadRatio float64) ResourceUsage {
	// Elasticsearch is CPU + Memory intensive

	cpu := 25.0 + (loadRatio * 65.0)
	cpu = math.Min(100, cpu)

	memory := 50.0 + (loadRatio * 40.0)
	memory = math.Min(95, memory)

	diskIO := 15.0 + (loadRatio * 55.0)
	diskIO = math.Min(100, diskIO)

	bottleneck := "cpu"
	if memory > 90 {
		bottleneck = "memory"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: math.Min(100, loadRatio*60),
		Bottleneck:     bottleneck,
	}
}

// ==================== DEFAULT RESOURCES ====================
func calculateDefaultResources(loadRatio float64) ResourceUsage {
	cpu := math.Min(100, loadRatio*100)
	memory := 20.0 + (loadRatio * 60.0)
	memory = math.Min(80, memory)

	bottleneck := "none"
	if cpu > 85 {
		bottleneck = "cpu"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  10.0,
		NetworkPercent: math.Min(100, loadRatio*70),
		Bottleneck:     bottleneck,
	}
}

// ==================== TELEMETRY RESOURCES ====================
func calculateTelemetryResources(loadRatio float64) ResourceUsage {
	// Telemetry (Monitoring/Logging) is Network + Disk I/O bound
	// CPU usage is very efficient (batch processing)

	cpu := 5.0 + (loadRatio * 25.0)
	cpu = math.Min(30, cpu)

	memory := 20.0 + (loadRatio * 40.0) // Buffering
	memory = math.Min(60, memory)

	// High Disk Write for logs/metrics
	diskIO := 10.0 + (loadRatio * 80.0)
	diskIO = math.Min(100, diskIO)

	network := math.Min(100, loadRatio*90) // High Ingestion

	bottleneck := "none"
	if diskIO > 90 {
		bottleneck = "disk"
	} else if network > 90 {
		bottleneck = "network"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== SRE PRODUCTION FIX: APM RESOURCES ====================
func calculateAPMResources(loadRatio float64) ResourceUsage {
	// APM (Datadog/New Relic/Dynatrace) is CPU + Network bound
	// High CPU for trace aggregation, span processing, metrics calculation
	// High network for receiving traces from all services

	cpu := 15.0 + (loadRatio * 55.0) // 15-70% CPU (aggregation, processing)
	cpu = math.Min(80, cpu)

	memory := 30.0 + (loadRatio * 50.0) // 30-80% memory (buffering traces)
	memory = math.Min(85, memory)

	// Moderate disk I/O for storing trace data
	diskIO := 10.0 + (loadRatio * 40.0)
	diskIO = math.Min(60, diskIO)

	// High network ingestion (receiving traces from all microservices)
	network := math.Min(100, loadRatio*95)

	bottleneck := "none"
	if network > 90 {
		bottleneck = "network" // Usually network-bound at high scale
	} else if cpu > 85 {
		bottleneck = "cpu"
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== SRE PRODUCTION FIX: SIDECAR PROXY RESOURCES ====================
func calculateSidecarProxyResources(loadRatio float64) ResourceUsage {
	// Sidecar Proxy (Envoy/Linkerd) is Network + CPU bound
	// Very efficient but adds ~2-5ms latency per request
	// Low resource usage (designed to be lightweight)

	cpu := 3.0 + (loadRatio * 12.0) // 3-15% CPU (lightweight proxy)
	cpu = math.Min(20, cpu)

	memory := 10.0 + (loadRatio * 20.0) // 10-30% memory (connection tracking)
	memory = math.Min(35, memory)

	// Minimal disk I/O (just for access logs if enabled)
	diskIO := 5.0 + (loadRatio * 10.0)
	diskIO = math.Min(20, diskIO)

	// Network is primary resource (proxying all traffic)
	network := math.Min(100, loadRatio*98)

	bottleneck := "network" // Always network-bound

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== MEDIUM PRIORITY: RUM RESOURCES ====================
func calculateRUMResources(loadRatio float64) ResourceUsage {
	// Real User Monitoring (Google Analytics, Mixpanel)
	// Very lightweight - just collecting metrics from browsers
	// Mostly network-bound (receiving metrics)

	cpu := 2.0 + (loadRatio * 8.0) // 2-10% CPU (metrics aggregation)
	cpu = math.Min(15, cpu)

	memory := 15.0 + (loadRatio * 25.0) // 15-40% memory (buffering metrics)
	memory = math.Min(50, memory)

	diskIO := 5.0 + (loadRatio * 20.0) // Light disk writes
	diskIO = math.Min(30, diskIO)

	network := math.Min(100, loadRatio*92) // High network ingestion

	bottleneck := "network"

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== MEDIUM PRIORITY: SYNTHETIC MONITORING RESOURCES ====================
func calculateSyntheticMonitoringResources(loadRatio float64) ResourceUsage {
	// Synthetic Monitoring (Pingdom, StatusCake)
	// Automated uptime checks
	// CPU-bound (making HTTP requests, DNS lookups)

	cpu := 10.0 + (loadRatio * 40.0) // 10-50% CPU (making requests)
	cpu = math.Min(60, cpu)

	memory := 10.0 + (loadRatio * 20.0) // 10-30% memory
	memory = math.Min(40, memory)

	diskIO := 3.0 + (loadRatio * 10.0) // Minimal disk I/O
	diskIO = math.Min(20, diskIO)

	network := math.Min(100, loadRatio*85) // Moderate network usage

	bottleneck := "cpu" // CPU-bound (request processing)

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== MEDIUM PRIORITY: GRAPHQL GATEWAY RESOURCES ====================
func calculateGraphQLGatewayResources(loadRatio float64) ResourceUsage {
	// GraphQL Gateway (Apollo, Hasura)
	// CPU-intensive (query parsing, execution planning, data stitching)
	// Higher overhead than REST due to complex queries

	cpu := 20.0 + (loadRatio * 65.0) // 20-85% CPU (query processing)
	cpu = math.Min(95, cpu)

	memory := 25.0 + (loadRatio * 50.0) // 25-75% memory (query cache)
	memory = math.Min(85, memory)

	diskIO := 5.0 + (loadRatio * 15.0) // Minimal disk I/O
	diskIO = math.Min(25, diskIO)

	network := math.Min(100, loadRatio*88) // High network (multiple backend calls)

	bottleneck := "cpu" // CPU-bound (query execution)

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== MEDIUM PRIORITY: GRPC SERVER RESOURCES ====================
func calculateGRPCServerResources(loadRatio float64) ResourceUsage {
	// gRPC Server (high-performance RPC)
	// More efficient than REST (binary protocol, HTTP/2)
	// Lower CPU than REST due to binary serialization

	cpu := 12.0 + (loadRatio * 45.0) // 12-57% CPU (less than REST)
	cpu = math.Min(70, cpu)

	memory := 20.0 + (loadRatio * 35.0) // 20-55% memory
	memory = math.Min(65, memory)

	diskIO := 5.0 + (loadRatio * 10.0) // Minimal disk I/O
	diskIO = math.Min(20, diskIO)

	network := math.Min(100, loadRatio*80) // Efficient network usage

	bottleneck := "cpu" // CPU-bound but efficient

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== LOW PRIORITY: WASM RUNTIME RESOURCES ====================
func calculateWASMRuntimeResources(loadRatio float64) ResourceUsage {
	// WASM Runtime (Cloudflare Workers, Fastly Compute@Edge)
	// Extremely efficient - cold start <1ms
	// Minimal memory footprint

	cpu := 5.0 + (loadRatio * 25.0) // 5-30% CPU (very efficient)
	cpu = math.Min(40, cpu)

	memory := 10.0 + (loadRatio * 20.0) // 10-30% memory (sandboxed)
	memory = math.Min(35, memory)

	diskIO := 2.0 + (loadRatio * 5.0) // Minimal disk I/O
	diskIO = math.Min(10, diskIO)

	network := math.Min(100, loadRatio*95) // Network-bound (edge)

	bottleneck := "network" // Network-bound at edge

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== LOW PRIORITY: BLOCKCHAIN NODE RESOURCES ====================
func calculateBlockchainNodeResources(loadRatio float64) ResourceUsage {
	// Blockchain Node (Ethereum, Solana, Polygon)
	// Extremely CPU and Disk intensive
	// Disk I/O is primary bottleneck (syncing blockchain)

	cpu := 40.0 + (loadRatio * 55.0) // 40-95% CPU (consensus, validation)
	cpu = math.Min(98, cpu)

	memory := 50.0 + (loadRatio * 45.0) // 50-95% memory (blockchain state)
	memory = math.Min(95, memory)

	// Very high disk I/O (blockchain storage, syncing)
	diskIO := 50.0 + (loadRatio * 48.0)
	diskIO = math.Min(100, diskIO)

	network := math.Min(100, loadRatio*85) // High network (P2P sync)

	bottleneck := "disk" // Usually disk-bound (blockchain sync)
	if cpu > 90 {
		bottleneck = "cpu" // Can become CPU-bound during validation
	}

	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== PRIORITY 2: SERVERLESS FUNCTIONS ====================
func calculateServerlessResources(loadRatio float64) ResourceUsage {
	// Serverless Functions (Lambda, Cloud Functions, Azure Functions)
	// Very efficient - event-driven, auto-scaling
	// Cold start: 100-1000ms, Warm execution: 5-50ms
	// CPU and Memory usage varies by invocation
	
	// Serverless is billed by invocations, not by sustained CPU
	// Each invocation uses CPU only during execution
	// At high load, more concurrent executions = higher aggregate CPU
	
	cpu := 10.0 + (loadRatio * 50.0) // 10-60% CPU (bursts with invocations)
	cpu = math.Min(75, cpu)
	
	memory := 15.0 + (loadRatio * 35.0) // 15-50% memory (per invocation)
	memory = math.Min(60, memory)
	
	// Minimal disk I/O (ephemeral /tmp storage only)
	diskIO := 2.0 + (loadRatio * 5.0)
	diskIO = math.Min(10, diskIO)
	
	// Network is primary resource (calling downstream services)
	network := math.Min(100, loadRatio*90)
	
	bottleneck := "none"
	if network > 85 {
		bottleneck = "network" // Usually network-bound (calling APIs)
	} else if cpu > 65 {
		bottleneck = "cpu" // Can become CPU-bound for compute-heavy functions
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== PRIORITY 2: AI/ML MODEL SERVING ====================
func calculateMLEndpointResources(loadRatio float64) ResourceUsage {
	// ML Model Serving (SageMaker, Vertex AI, Azure ML)
	// Very CPU and Memory intensive
	// GPU/TPU accelerated if available
	// Model loading: 1-10 seconds, Inference: 10-1000ms per request
	
	// CPU usage depends on whether GPU is used
	// With GPU: CPU is low (GPU does inference)
	// Without GPU: CPU is VERY high
	cpu := 30.0 + (loadRatio * 65.0) // 30-95% CPU (inference computation)
	cpu = math.Min(98, cpu)
	
	// Memory usage is high (model must be loaded in RAM)
	memory := 60.0 + (loadRatio * 35.0) // 60-95% memory (model in RAM + batch processing)
	memory = math.Min(95, memory)
	
	// Disk I/O for loading model artifacts (one-time at startup)
	diskIO := 5.0 + (loadRatio * 10.0)
	diskIO = math.Min(20, diskIO)
	
	// Network for receiving requests and returning predictions
	network := math.Min(100, loadRatio*80)
	
	bottleneck := "cpu" // Usually CPU-bound (inference)
	if memory > 90 {
		bottleneck = "memory" // Can become memory-bound for large models
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== PRIORITY 2: KUBERNETES COMPONENTS ====================
func calculateK8sPodResources(loadRatio float64) ResourceUsage {
	// Kubernetes Pod - containerized application
	// Resource usage is similar to microservices but with container overhead
	// K8s manages resource limits (CPU/Memory requests & limits)
	
	cpu := 20.0 + (loadRatio * 60.0) // 20-80% CPU
	cpu = math.Min(85, cpu)
	
	memory := 25.0 + (loadRatio * 50.0) // 25-75% memory
	memory = math.Min(80, memory)
	
	// Container I/O for logs and ephemeral volumes
	diskIO := 5.0 + (loadRatio * 15.0)
	diskIO = math.Min(25, diskIO)
	
	// Network for pod-to-pod communication
	network := math.Min(100, loadRatio*70)
	
	bottleneck := "none"
	if cpu > 75 {
		bottleneck = "cpu"
	} else if memory > 70 {
		bottleneck = "memory"
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

func calculateK8sServiceResources(loadRatio float64) ResourceUsage {
	// Kubernetes Service - virtual load balancer (kube-proxy/iptables)
	// Very lightweight - just iptables rules or IPVS
	// Minimal CPU/Memory overhead
	
	cpu := 2.0 + (loadRatio * 8.0) // 2-10% CPU
	cpu = math.Min(12, cpu)
	
	memory := 3.0 + (loadRatio * 7.0) // 3-10% memory
	memory = math.Min(12, memory)
	
	diskIO := 1.0 // Minimal disk I/O
	
	// Network is primary resource (routing traffic)
	network := math.Min(100, loadRatio*95)
	
	bottleneck := "network" // Always network-bound (L4 routing)
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

func calculateK8sIngressResources(loadRatio float64) ResourceUsage {
	// Kubernetes Ingress - HTTP/HTTPS routing (nginx/traefik/istio)
	// More CPU intensive than Service (L7 routing, TLS termination)
	
	cpu := 10.0 + (loadRatio * 30.0) // 10-40% CPU (TLS and routing)
	cpu = math.Min(45, cpu)
	
	memory := 15.0 + (loadRatio * 25.0) // 15-40% memory
	memory = math.Min(45, memory)
	
	diskIO := 2.0 + (loadRatio * 5.0)
	diskIO = math.Min(10, diskIO)
	
	// Network is primary resource (HTTP routing)
	network := math.Min(100, loadRatio*90)
	
	bottleneck := "network" // Network-bound (L7 routing)
	if cpu > 40 {
		bottleneck = "cpu" // Can become CPU-bound with TLS
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

// ==================== PRIORITY 2: MULTI-CLOUD EQUIVALENTS ====================
func calculatePaaSWebAppResources(loadRatio float64) ResourceUsage {
	// Azure App Service / GCP App Engine - managed PaaS web hosting
	// Similar to web servers but with platform overhead
	
	cpu := 15.0 + (loadRatio * 60.0) // 15-75% CPU
	cpu = math.Min(80, cpu)
	
	memory := 20.0 + (loadRatio * 50.0) // 20-70% memory
	memory = math.Min(75, memory)
	
	diskIO := 5.0 + (loadRatio * 10.0)
	diskIO = math.Min(20, diskIO)
	
	network := math.Min(100, loadRatio*75)
	
	bottleneck := "none"
	if cpu > 70 {
		bottleneck = "cpu"
	} else if network > 80 {
		bottleneck = "network"
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

func calculateCosmosDBResources(loadRatio float64) ResourceUsage {
	// Azure Cosmos DB - multi-model NoSQL with global distribution
	// Request Units (RU) based pricing, high performance
	
	cpu := 25.0 + (loadRatio * 50.0) // 25-75% CPU
	cpu = math.Min(80, cpu)
	
	memory := 30.0 + (loadRatio * 50.0) // 30-80% memory (caching)
	memory = math.Min(85, memory)
	
	// High disk I/O for global replication
	diskIO := 20.0 + (loadRatio * 50.0)
	diskIO = math.Min(75, diskIO)
	
	network := math.Min(100, loadRatio*80) // Global replication network
	
	bottleneck := "disk" // Usually disk-bound (write replication)
	if network > 85 {
		bottleneck = "network" // Can become network-bound with global replication
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

func calculateFirestoreResources(loadRatio float64) ResourceUsage {
	// GCP Firestore - NoSQL document database (real-time)
	// Optimized for mobile/web apps with real-time sync
	
	cpu := 20.0 + (loadRatio * 45.0) // 20-65% CPU
	cpu = math.Min(70, cpu)
	
	memory := 25.0 + (loadRatio * 45.0) // 25-70% memory
	memory = math.Min(75, memory)
	
	diskIO := 15.0 + (loadRatio * 40.0)
	diskIO = math.Min(60, diskIO)
	
	network := math.Min(100, loadRatio*85) // Real-time sync is network-heavy
	
	bottleneck := "network" // Usually network-bound (real-time sync)
	if diskIO > 55 {
		bottleneck = "disk"
	}
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

func calculateManagedMessagingResources(loadRatio float64) ResourceUsage {
	// Azure Service Bus / GCP Pub/Sub - managed messaging
	// Very efficient, fully managed by cloud provider
	
	cpu := 8.0 + (loadRatio * 20.0) // 8-28% CPU
	cpu = math.Min(35, cpu)
	
	memory := 10.0 + (loadRatio * 25.0) // 10-35% memory
	memory = math.Min(40, memory)
	
	diskIO := 5.0 + (loadRatio * 15.0)
	diskIO = math.Min(25, diskIO)
	
	network := math.Min(100, loadRatio*90) // Network-bound (message delivery)
	
	bottleneck := "network" // Always network-bound (messaging)
	
	return ResourceUsage{
		CPUPercent:     cpu,
		MemoryPercent:  memory,
		DiskIOPercent:  diskIO,
		NetworkPercent: network,
		Bottleneck:     bottleneck,
	}
}

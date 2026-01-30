package simulation

// StoragePerformance defines performance characteristics of different storage types
type StoragePerformance struct {
	IOPS           int     // Input/Output Operations Per Second
	ThroughputMBps int     // Throughput in MB/s
	LatencyMs      float64 // Average latency in milliseconds
}

// GetStoragePerformance returns performance specs for different storage types
func GetStoragePerformance(storageType string) StoragePerformance {
	storageSpecs := map[string]StoragePerformance{
		// AWS EBS Storage Types
		"gp3": {
			IOPS:           3000, // Base 3000 IOPS
			ThroughputMBps: 125,  // 125 MB/s
			LatencyMs:      1.0,  // ~1ms latency
		},
		"gp2": {
			IOPS:           3000, // 3 IOPS per GB (baseline)
			ThroughputMBps: 128,  // 128 MB/s
			LatencyMs:      1.2,  // Slightly higher latency
		},
		"io2": {
			IOPS:           64000, // Up to 64,000 IOPS
			ThroughputMBps: 1000,  // 1000 MB/s
			LatencyMs:      0.5,   // Sub-millisecond latency
		},
		"io1": {
			IOPS:           50000, // Up to 50,000 IOPS
			ThroughputMBps: 1000,  // 1000 MB/s
			LatencyMs:      0.6,   // Sub-millisecond latency
		},
		"st1": {
			IOPS:           500, // Throughput optimized, not IOPS
			ThroughputMBps: 500, // 500 MB/s throughput
			LatencyMs:      5.0, // HDD latency
		},
		"sc1": {
			IOPS:           250,  // Cold HDD
			ThroughputMBps: 250,  // 250 MB/s
			LatencyMs:      10.0, // Higher HDD latency
		},
	}

	if perf, ok := storageSpecs[storageType]; ok {
		return perf
	}

	// Default to gp3 if not specified
	return storageSpecs["gp3"]
}

// InstancePerformance defines performance characteristics of instance types
type InstancePerformance struct {
	VCPU        int     // Number of vCPUs
	MemoryGB    float64 // Memory in GB
	NetworkGbps float64 // Network bandwidth in Gbps
	CPUCredits  bool    // Whether it's burstable (T3 instances)
}

// GetInstancePerformance returns performance specs for different instance types
func GetInstancePerformance(instanceType string) InstancePerformance {
	instanceSpecs := map[string]InstancePerformance{
		// T3 Instances (Burstable)
		"t3.micro":  {VCPU: 2, MemoryGB: 1, NetworkGbps: 5.0, CPUCredits: true},
		"t3.small":  {VCPU: 2, MemoryGB: 2, NetworkGbps: 5.0, CPUCredits: true},
		"t3.medium": {VCPU: 2, MemoryGB: 4, NetworkGbps: 5.0, CPUCredits: true},
		"t3.large":  {VCPU: 2, MemoryGB: 8, NetworkGbps: 5.0, CPUCredits: true},
		"t3.xlarge": {VCPU: 4, MemoryGB: 16, NetworkGbps: 5.0, CPUCredits: true},

		// M5 Instances (General Purpose)
		"m5.large":   {VCPU: 2, MemoryGB: 8, NetworkGbps: 10.0, CPUCredits: false},
		"m5.xlarge":  {VCPU: 4, MemoryGB: 16, NetworkGbps: 10.0, CPUCredits: false},
		"m5.2xlarge": {VCPU: 8, MemoryGB: 32, NetworkGbps: 10.0, CPUCredits: false},
		"m5.4xlarge": {VCPU: 16, MemoryGB: 64, NetworkGbps: 10.0, CPUCredits: false},

		// C5 Instances (Compute Optimized)
		"c5.large":   {VCPU: 2, MemoryGB: 4, NetworkGbps: 10.0, CPUCredits: false},
		"c5.xlarge":  {VCPU: 4, MemoryGB: 8, NetworkGbps: 10.0, CPUCredits: false},
		"c5.2xlarge": {VCPU: 8, MemoryGB: 16, NetworkGbps: 10.0, CPUCredits: false},
		"c5.4xlarge": {VCPU: 16, MemoryGB: 32, NetworkGbps: 10.0, CPUCredits: false},

		// R5 Instances (Memory Optimized)
		"r5.large":   {VCPU: 2, MemoryGB: 16, NetworkGbps: 10.0, CPUCredits: false},
		"r5.xlarge":  {VCPU: 4, MemoryGB: 32, NetworkGbps: 10.0, CPUCredits: false},
		"r5.2xlarge": {VCPU: 8, MemoryGB: 64, NetworkGbps: 10.0, CPUCredits: false},

		// Database Instances
		"db.t3.micro":  {VCPU: 2, MemoryGB: 1, NetworkGbps: 5.0, CPUCredits: true},
		"db.t3.small":  {VCPU: 2, MemoryGB: 2, NetworkGbps: 5.0, CPUCredits: true},
		"db.t3.medium": {VCPU: 2, MemoryGB: 4, NetworkGbps: 5.0, CPUCredits: true},
		"db.t3.large":  {VCPU: 2, MemoryGB: 8, NetworkGbps: 5.0, CPUCredits: true},
		"db.m5.large":  {VCPU: 2, MemoryGB: 8, NetworkGbps: 10.0, CPUCredits: false},
		"db.m5.xlarge": {VCPU: 4, MemoryGB: 16, NetworkGbps: 10.0, CPUCredits: false},
		"db.r5.large":  {VCPU: 2, MemoryGB: 16, NetworkGbps: 10.0, CPUCredits: false},
		"db.r5.xlarge": {VCPU: 4, MemoryGB: 32, NetworkGbps: 10.0, CPUCredits: false},

		// Cache Instances
		"cache.t3.micro":  {VCPU: 2, MemoryGB: 0.5, NetworkGbps: 5.0, CPUCredits: true},
		"cache.t3.small":  {VCPU: 2, MemoryGB: 1.37, NetworkGbps: 5.0, CPUCredits: true},
		"cache.t3.medium": {VCPU: 2, MemoryGB: 3.09, NetworkGbps: 5.0, CPUCredits: true},
		"cache.m5.large":  {VCPU: 2, MemoryGB: 6.38, NetworkGbps: 10.0, CPUCredits: false},
		"cache.r5.large":  {VCPU: 2, MemoryGB: 13.07, NetworkGbps: 10.0, CPUCredits: false},
	}

	if perf, ok := instanceSpecs[instanceType]; ok {
		return perf
	}

	// Default to t3.medium if not specified
	return InstancePerformance{VCPU: 2, MemoryGB: 4, NetworkGbps: 5.0, CPUCredits: true}
}

// CalculateStorageImpact adjusts disk I/O percentage based on storage type
func CalculateStorageImpact(baseDiskIO float64, storageType string, rps float64) float64 {
	perf := GetStoragePerformance(storageType)

	// Estimate IOPS needed (rough approximation: 1 RPS = 10 IOPS for databases)
	estimatedIOPS := rps * 10

	// Calculate utilization percentage
	utilization := (estimatedIOPS / float64(perf.IOPS)) * 100

	// If utilization exceeds 100%, disk is bottlenecked
	if utilization > 100 {
		return 100.0
	}

	// Otherwise, return the calculated utilization
	return utilization
}

// CalculateInstanceImpact adjusts capacity based on instance type
func CalculateInstanceImpact(baseCapacity float64, instanceType string) float64 {
	perf := GetInstancePerformance(instanceType)

	// Scale capacity based on vCPU count
	// t3.micro (2 vCPU) = 1x
	// c5.4xlarge (16 vCPU) = 8x capacity
	scaleFactor := float64(perf.VCPU) / 2.0

	// Burstable instances (T3) have lower sustained performance
	if perf.CPUCredits {
		scaleFactor *= 0.7 // 30% penalty for burstable
	}

	return baseCapacity * scaleFactor
}

// GetStorageLatencyImpact returns additional latency based on storage type
func GetStorageLatencyImpact(storageType string) float64 {
	perf := GetStoragePerformance(storageType)
	return perf.LatencyMs
}

// ==================== SRE PRODUCTION FIX: SIDECAR PROXY LATENCY ====================
// GetSidecarLatencyImpact returns the latency overhead added by service mesh sidecar
// Real-world measurements: Envoy adds 2-5ms, Linkerd adds 1-3ms per request
func GetSidecarLatencyImpact() float64 {
	return 3.0 // Average 3ms latency overhead for sidecar proxy (Envoy/Linkerd)
}

// GetAPMLatencyImpact returns the latency overhead added by APM tracing
// Real-world: APM agents add <1ms for sampling, negligible for most apps
func GetAPMLatencyImpact() float64 {
	return 0.5 // Average 0.5ms latency overhead for APM sampling
}

// GetGraphQLLatencyImpact returns latency overhead for GraphQL query parsing
// Real-world: GraphQL adds 2-10ms due to query parsing and execution planning
func GetGraphQLLatencyImpact() float64 {
	return 5.0 // Average 5ms for GraphQL query processing
}

// GetGRPCLatencyImpact returns latency for gRPC (typically faster than REST)
// Real-world: gRPC is 20-30% faster than REST due to binary protocol
func GetGRPCLatencyImpact() float64 {
	return -2.0 // Negative = faster (-2ms compared to REST)
}

// GetWASMLatencyImpact returns latency for WASM edge functions
// Real-world: WASM cold start <1ms, execution overhead minimal
func GetWASMLatencyImpact() float64 {
	return 0.8 // Sub-millisecond cold start
}

// GetBlockchainLatencyImpact returns latency for blockchain operations
// Real-world: Blockchain confirmation times are VERY high
func GetBlockchainLatencyImpact() float64 {
	return 5000.0 // 5 seconds for blockchain confirmation (average)
}

// ==================== PRIORITY 2: SERVERLESS FUNCTIONS ====================
// GetLambdaColdStartLatency returns cold start latency for AWS Lambda
// Real-world: 100-1000ms depending on runtime and memory
func GetLambdaColdStartLatency(runtime string, memoryMB int) float64 {
	// Base cold start times (ms)
	baseColdStart := map[string]float64{
		"nodejs18":  200.0, // Node.js is fastest
		"python3.9": 250.0,
		"go1.x":     150.0, // Compiled languages are faster
		"java11":    800.0, // Java is slowest (JVM startup)
		"dotnet6":   600.0,
	}
	
	coldStart := baseColdStart[runtime]
	if coldStart == 0 {
		coldStart = 300.0 // Default
	}
	
	// More memory = faster cold start (better CPU allocation)
	if memoryMB >= 2048 {
		coldStart *= 0.7 // 30% faster with high memory
	} else if memoryMB <= 512 {
		coldStart *= 1.5 // 50% slower with low memory
	}
	
	return coldStart
}

// GetLambdaWarmLatency returns warm execution latency for Lambda
// Real-world: 5-50ms for warm invocations
func GetLambdaWarmLatency() float64 {
	return 15.0 // Average warm execution overhead
}

// ==================== PRIORITY 2: AI/ML MODEL SERVING ====================
// GetMLInferenceLatency returns latency for ML model inference
// Real-world: 10-1000ms depending on model size and accelerator
func GetMLInferenceLatency(modelSizeMB int, accelerator string) float64 {
	// Base latency by model size
	baseLatency := 50.0 // Small model (50ms)
	if modelSizeMB > 1000 {
		baseLatency = 500.0 // Large model (500ms)
	} else if modelSizeMB > 100 {
		baseLatency = 150.0 // Medium model (150ms)
	}
	
	// Accelerator impact
	switch accelerator {
	case "gpu":
		baseLatency *= 0.3 // GPUs are 70% faster
	case "tpu":
		baseLatency *= 0.2 // TPUs are 80% faster
	case "inf1":
		baseLatency *= 0.4 // AWS Inferentia is 60% faster
	default:
		// CPU inference (no acceleration)
	}
	
	return baseLatency
}

// GetMLModelLoadLatency returns one-time model loading latency
// Real-world: 1-10 seconds depending on model size
func GetMLModelLoadLatency(modelSizeMB int) float64 {
	// Loading time scales with model size
	if modelSizeMB > 5000 {
		return 10000.0 // 10 seconds for very large models (5GB+)
	} else if modelSizeMB > 1000 {
		return 5000.0 // 5 seconds for large models (1-5GB)
	} else if modelSizeMB > 100 {
		return 2000.0 // 2 seconds for medium models (100MB-1GB)
	}
	return 500.0 // 500ms for small models (<100MB)
}

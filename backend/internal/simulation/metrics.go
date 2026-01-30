package simulation

import (
	"fmt"
	"math"
)

// calculateNodeMetrics computes detailed metrics for each node
func (e *Engine) calculateNodeMetrics() map[string]NodeMetrics {
	metrics := make(map[string]NodeMetrics)

	for nodeID, state := range e.state.NodeStates {
		// Client nodes don't have CPU/memory - they just generate traffic
		isClient := state.Type == "client"

		effectiveCapacity := state.CapacityRPS * float64(state.Replicas)

		// Use the resource model to get accurate resource usage
		var cpuPercent, memPercent, diskIOPercent, networkPercent float64
		var bottleneck string
		if !isClient {
			resources := calculateResourceUsage(state, state.CurrentLoad, effectiveCapacity)
			cpuPercent = resources.CPUPercent
			memPercent = resources.MemoryPercent
			diskIOPercent = resources.DiskIOPercent
			networkPercent = resources.NetworkPercent
			bottleneck = resources.Bottleneck
		}

		// Determine status - clients are always "normal"
		status := "normal"
		if !isClient {
			if state.Failed {
				status = "failed"
			} else if cpuPercent > 90 || memPercent > 90 || diskIOPercent > 90 || state.ErrorCount > 100 {
				status = "danger"
			} else if cpuPercent > 75 || memPercent > 75 || diskIOPercent > 75 || state.ErrorCount > 10 {
				status = "warning"
			}
		}

		cacheHitRate := -1.0
		if state.Type == "cache_redis" || state.Type == "cache_memcached" {
			cacheHitRate = state.CacheHitRate
		}

		// Calculate success rate (percentage of requests that succeeded)
		successRate := 100.0
		if state.RPSIn > 0 {
			successful := state.RPSIn - float64(state.ErrorCount)
			successRate = math.Max(0, (successful/state.RPSIn)*100)
		}

		// Round all percentages to 1 decimal place for clean UI
		cpuPercent = math.Round(cpuPercent*10) / 10
		memPercent = math.Round(memPercent*10) / 10
		diskIOPercent = math.Round(diskIOPercent*10) / 10
		networkPercent = math.Round(networkPercent*10) / 10
		successRate = math.Round(successRate*10) / 10

		metrics[nodeID] = NodeMetrics{
			NodeID:         nodeID,
			RPSIn:          math.Round(state.RPSIn*10) / 10, // Round RPS to 1 decimal
			RPSOut:         math.Round(state.RPSOut*10) / 10,
			LatencyMs:      math.Round(state.LatencyMS*100) / 100, // Round latency to 2 decimal for precision
			CPUPercent:     cpuPercent,
			MemPercent:     memPercent,
			DiskIOPercent:  diskIOPercent,  // NEW
			NetworkPercent: networkPercent, // NEW
			Errors:         state.ErrorCount,
			QueueDepth:     state.QueueDepth,
			CacheHitRate:   cacheHitRate,
			Status:         status,
			SuccessRate:    successRate,
			Replicas:       state.Replicas, // Include current replica count for auto-scaling viz
			Bottleneck:     bottleneck,     // NEW: Include bottleneck type
		}
	}

	return metrics
}

// detectBottlenecks identifies performance bottlenecks using the resource model
func (e *Engine) detectBottlenecks() []Bottleneck {
	bottlenecks := []Bottleneck{}

	for nodeID, state := range e.state.NodeStates {
		effectiveCapacity := state.CapacityRPS * float64(state.Replicas)

		// Use the resource model to get accurate resource usage
		resources := calculateResourceUsage(state, state.CurrentLoad, effectiveCapacity)

		// Check for overload
		if state.CurrentLoad > effectiveCapacity*1.2 {
			severity := "high"
			if state.CurrentLoad > effectiveCapacity*2.0 {
				severity = "critical"
			}

			suggestions := []string{
				"Increase replica count",
				"Add horizontal scaling",
				"Optimize request processing",
			}

			if state.Type == "database_sql" || state.Type == "database_nosql" {
				suggestions = append(suggestions, "Add read replicas", "Enable caching layer")
			}

			bottlenecks = append(bottlenecks, Bottleneck{
				NodeID:      nodeID,
				Issue:       "Overloaded",
				RootCause:   fmt.Sprintf("Incoming load (%.0f RPS) exceeds capacity (%.0f RPS)", state.CurrentLoad, effectiveCapacity),
				Impact:      "High latency, request dropping, potential failures",
				Suggestions: suggestions,
				Severity:    severity,
			})
		}

		// Resource-specific bottleneck detection
		switch resources.Bottleneck {
		case "cpu":
			if resources.CPUPercent > 85 && !state.Failed {
				suggestions := []string{"Scale horizontally", "Optimize algorithms"}
				if state.Type == "database_sql" || state.Type == "database_graph" {
					suggestions = append(suggestions, "Optimize queries", "Add indexes")
				}
				bottlenecks = append(bottlenecks, Bottleneck{
					NodeID:      nodeID,
					Issue:       "High CPU Usage",
					RootCause:   fmt.Sprintf("CPU at %.1f%% (CPU-bound workload)", resources.CPUPercent),
					Impact:      "Degraded performance, increased latency",
					Suggestions: suggestions,
					Severity:    "medium",
				})
			}

		case "memory":
			if resources.MemoryPercent > 85 {
				suggestions := []string{"Increase instance size", "Add more memory"}
				if state.Type == "cache_redis" || state.Type == "cache_memcached" {
					suggestions = []string{"Increase cache size", "Implement eviction policy", "Add cache sharding"}
				} else if state.Type == "database_nosql" {
					suggestions = []string{"Increase memory", "Optimize document size", "Add sharding"}
				}
				bottlenecks = append(bottlenecks, Bottleneck{
					NodeID:      nodeID,
					Issue:       "High Memory Usage",
					RootCause:   fmt.Sprintf("Memory at %.1f%% (memory-bound workload)", resources.MemoryPercent),
					Impact:      "Risk of OOM errors, swapping, performance degradation",
					Suggestions: suggestions,
					Severity:    "high",
				})
			}

		case "disk":
			if resources.DiskIOPercent > 85 {
				suggestions := []string{"Upgrade storage type (e.g., gp3 → io2)", "Add read replicas"}
				if state.Type == "database_sql" {
					suggestions = append(suggestions, "Optimize indexes", "Partition tables")
				} else if state.Type == "database_timeseries" {
					suggestions = []string{"Increase write buffer", "Optimize retention policy", "Use faster storage"}
				}
				bottlenecks = append(bottlenecks, Bottleneck{
					NodeID:      nodeID,
					Issue:       "High Disk I/O",
					RootCause:   fmt.Sprintf("Disk I/O at %.1f%% (I/O-bound workload)", resources.DiskIOPercent),
					Impact:      "Slow queries, write delays, increased latency",
					Suggestions: suggestions,
					Severity:    "high",
				})
			}

		case "network":
			if resources.NetworkPercent > 90 {
				suggestions := []string{"Upgrade instance type for better network", "Add CDN", "Implement compression"}
				if state.Type == "load_balancer" {
					suggestions = []string{"Upgrade to NLB for higher throughput", "Add more load balancers", "Enable connection pooling"}
				}
				bottlenecks = append(bottlenecks, Bottleneck{
					NodeID:      nodeID,
					Issue:       "Network Saturation",
					RootCause:   fmt.Sprintf("Network at %.1f%% (network-bound)", resources.NetworkPercent),
					Impact:      "Packet loss, connection timeouts, degraded throughput",
					Suggestions: suggestions,
					Severity:    "high",
				})
			}
		}

		// Queue-specific bottleneck (backlog)
		if (state.Type == "queue" || state.Type == "message_broker") && float64(state.QueueDepth) > float64(state.MaxQueueDepth)*0.5 {
			severity := "medium"
			if state.QueueDepth >= state.MaxQueueDepth {
				severity = "critical"
			} else if float64(state.QueueDepth) > float64(state.MaxQueueDepth)*0.8 {
				severity = "high"
			}

			bottlenecks = append(bottlenecks, Bottleneck{
				NodeID:      nodeID,
				Issue:       "Queue Backlog",
				RootCause:   fmt.Sprintf("Queue filling up: %d/%d (%.0f%%)", state.QueueDepth, state.MaxQueueDepth, float64(state.QueueDepth)/float64(state.MaxQueueDepth)*100),
				Impact:      "Increased wait times, potential message loss",
				Suggestions: []string{"Increase queue capacity", "Add more consumers (workers)", "Implement backpressure"},
				Severity:    severity,
			})
		}

		// Cache-specific bottleneck (low hit rate)
		if (state.Type == "cache_redis" || state.Type == "cache_memcached") && state.CacheHitRate < 0.5 {
			bottlenecks = append(bottlenecks, Bottleneck{
				NodeID:      nodeID,
				Issue:       "Low Cache Hit Rate",
				RootCause:   fmt.Sprintf("Cache hit rate at %.1f%%", state.CacheHitRate*100),
				Impact:      "Database overload, increased latency",
				Suggestions: []string{"Increase cache size", "Optimize TTL strategy", "Review caching patterns", "Pre-warm cache"},
				Severity:    "medium",
			})
		}
	}

	return bottlenecks
}

// checkSLAStatus determines if SLA targets are met
func (e *Engine) checkSLAStatus(latency LatencyMetrics, errorRate, throughput float64) (string, []string) {
	if e.input.SLAConfig == nil {
		return "GOOD", []string{}
	}

	sla := e.input.SLAConfig
	violations := []string{}

	// Check P95 latency
	if sla.P95LatencyMs > 0 && latency.P95 > sla.P95LatencyMs {
		violations = append(violations, fmt.Sprintf("P95 latency (%.1fms) exceeds target (%.1fms)", latency.P95, sla.P95LatencyMs))
	}

	// Check P99 latency
	if sla.P99LatencyMs > 0 && latency.P99 > sla.P99LatencyMs {
		violations = append(violations, fmt.Sprintf("P99 latency (%.1fms) exceeds target (%.1fms)", latency.P99, sla.P99LatencyMs))
	}

	// Check error rate
	if sla.ErrorRatePercent > 0 && errorRate*100 > sla.ErrorRatePercent {
		violations = append(violations, fmt.Sprintf("Error rate (%.2f%%) exceeds target (%.2f%%)", errorRate*100, sla.ErrorRatePercent))
	}

	// Check throughput
	if sla.MinThroughputRPS > 0 && throughput < sla.MinThroughputRPS {
		violations = append(violations, fmt.Sprintf("Throughput (%.0f RPS) below target (%.0f RPS)", throughput, sla.MinThroughputRPS))
	}

	// Determine status
	if len(violations) == 0 {
		return "GOOD", violations
	} else if len(violations) <= 2 {
		return "WARNING", violations
	} else {
		return "FAIL", violations
	}
}

// calculateCostMetrics estimates infrastructure costs
// getInstanceCost returns the hourly cost for an instance type
func getInstanceCost(instanceType string) float64 {
	costs := map[string]float64{
		// Compute instances (EC2)
		"t3.micro":   0.0104,
		"t3.small":   0.0208,
		"t3.medium":  0.0416,
		"t3.large":   0.0832,
		"t3.xlarge":  0.1664,
		"t3.2xlarge": 0.3328,
		"m5.large":   0.096,
		"m5.xlarge":  0.192,
		"m5.2xlarge": 0.384,
		"m5.4xlarge": 0.768,
		"m5.8xlarge": 1.536,
		"c5.large":   0.085,
		"c5.xlarge":  0.17,
		"c5.2xlarge": 0.34,
		"c5.4xlarge": 0.68,
		"c5.9xlarge": 1.53,
		"r5.large":   0.126,
		"r5.xlarge":  0.252,
		"r5.2xlarge": 0.504,
		"r5.4xlarge": 1.008,
		// Database instances (RDS)
		"db.t3.micro":   0.017,
		"db.t3.small":   0.034,
		"db.t3.medium":  0.068,
		"db.t3.large":   0.136,
		"db.t3.xlarge":  0.272,
		"db.t3.2xlarge": 0.544,
		"db.m5.large":   0.188,
		"db.m5.xlarge":  0.376,
		"db.m5.2xlarge": 0.752,
		"db.m5.4xlarge": 1.504,
		"db.m5.8xlarge": 3.008,
		"db.r5.large":   0.29,
		"db.r5.xlarge":  0.58,
		"db.r5.2xlarge": 1.16, // ← ADDED! $1.16/hr (user expects ~$1.00)
		"db.r5.4xlarge": 2.32,
		"db.r5.8xlarge": 4.64,
		// Cache instances (ElastiCache)
		"cache.t3.micro":   0.017,
		"cache.t3.small":   0.034,
		"cache.t3.medium":  0.068,
		"cache.t3.large":   0.136,
		"cache.m5.large":   0.136,
		"cache.m5.xlarge":  0.272,
		"cache.m5.2xlarge": 0.544,
		"cache.m5.4xlarge": 1.088,
		"cache.r5.large":   0.252,
		"cache.r5.xlarge":  0.504,
		"cache.r5.2xlarge": 1.008,
		"cache.r5.4xlarge": 2.016,
	}

	if cost, ok := costs[instanceType]; ok {
		return cost
	}
	// Default fallback cost
	return 0.05
}

// getLBCost returns the hourly cost for a load balancer type
func getLBCost(lbType string) float64 {
	costs := map[string]float64{
		"alb":     0.0225,
		"nlb":     0.0225,
		"classic": 0.025,
	}

	if cost, ok := costs[lbType]; ok {
		return cost
	}
	return 0.0225
}

func (e *Engine) calculateCostMetrics() CostMetrics {
	compute := make(map[string]float64)
	storage := make(map[string]float64)
	network := make(map[string]float64)
	perRegion := make(map[string]float64)

	totalCompute := 0.0
	totalStorage := 0.0
	totalNetwork := 0.0

	// Duration in hours
	durationHours := float64(e.config.DurationSeconds) / 3600.0

	for _, state := range e.state.NodeStates {
		nodeCost := 0.0

		// Use real AWS pricing based on instance types
		switch state.Type {
		case "api_server", "compute", "web_server", "microservice":
			// Use actual instance type pricing
			if state.InstanceType != "" {
				hourlyRate := getInstanceCost(state.InstanceType)
				nodeCost = hourlyRate * float64(state.Replicas) * durationHours
				compute["compute_instances"] += nodeCost
			} else {
				// Fallback: assume m5.large at $0.096/hr if no instance type
				nodeCost = 0.096 * float64(state.Replicas) * durationHours
				compute["compute_instances"] += nodeCost
			}

		case "load_balancer":
			// Real AWS ALB/NLB pricing
			if state.LBType != "" {
				hourlyRate := getLBCost(state.LBType)
				nodeCost = hourlyRate*durationHours + (state.RPSOut * float64(e.config.DurationSeconds) * 0.001 * 0.008)
				compute["load_balancer"] += nodeCost
			} else {
				// Fallback: ALB pricing
				hourlyRate := 0.0225
				nodeCost = hourlyRate*durationHours + (state.RPSOut * float64(e.config.DurationSeconds) * 0.001 * 0.008)
				compute["load_balancer"] += nodeCost
			}

		case "database_sql", "database_nosql", "database_postgres", "database_mysql", "database_mongodb":
			// Real AWS RDS pricing
			if state.InstanceType != "" {
				hourlyRate := getInstanceCost(state.InstanceType)
				nodeCost = hourlyRate * float64(state.Replicas) * durationHours
				compute["database"] += nodeCost
			} else {
				// Fallback if no instance type specified
				nodeCost = 0.188 * float64(state.Replicas) * durationHours
				compute["database"] += nodeCost
			}

			// Storage cost: $0.10 per GB-month
			if state.StorageSizeGB > 0 {
				storageCost := state.StorageSizeGB * 0.10 * (durationHours / 720.0)
				storage["database_storage"] += storageCost
				totalStorage += storageCost
			}

		case "cache_redis", "cache_memcached":
			// Real AWS ElastiCache pricing
			if state.InstanceType != "" {
				hourlyRate := getInstanceCost(state.InstanceType)
				nodeCost = hourlyRate * float64(state.Replicas) * durationHours
				compute["cache"] += nodeCost
			} else {
				// Fallback: cache.m5.large at $0.136/hr
				nodeCost = 0.136 * float64(state.Replicas) * durationHours
				compute["cache"] += nodeCost
			}

		case "queue", "message_broker":
			// $0.01 per million messages
			messagesProcessed := state.RPSOut * float64(e.config.DurationSeconds)
			nodeCost = (messagesProcessed / 1000000) * 0.01
			compute["queue"] += nodeCost

		case "cdn":
			// $0.085 per GB transferred
			dataGB := state.RPSOut * float64(e.config.DurationSeconds) * 0.001
			nodeCost = dataGB * 0.085
			network["cdn"] += nodeCost
			totalNetwork += nodeCost

		case "object_storage":
			// $0.023 per GB stored + $0.09 per GB out
			if state.StorageSizeGB > 0 {
				storageCost := state.StorageSizeGB * 0.023 * (durationHours / 720.0)
				storage["object_storage"] += storageCost
				totalStorage += storageCost
			}
			dataOut := state.RPSOut * float64(e.config.DurationSeconds) * 0.001
			egressCost := dataOut * 0.09
			network["egress"] += egressCost
			totalNetwork += egressCost
		}

		totalCompute += nodeCost

		// Regional cost tracking
		if state.Region != "" {
			perRegion[state.Region] += nodeCost
		} else {
			perRegion["default"] += nodeCost
		}
	}

	// Network transfer costs (between nodes)
	networkTransferCost := float64(e.state.SuccessRequests) * 0.00001 // $0.01 per 1M requests
	network["internal_transfer"] = networkTransferCost
	totalNetwork += networkTransferCost

	// Calculate total cost
	totalCost := totalCompute + totalStorage + totalNetwork

	// CRITICAL FIX: Round to 4 decimal places to show small costs accurately
	// For 30-second simulations, costs like $0.0042 would round to $0.00
	totalCost = math.Round(totalCost*10000) / 10000

	return CostMetrics{
		TotalCostUSD: totalCost,
		Compute:      compute,
		Storage:      storage,
		Network:      network,
		PerRegion:    perRegion,
	}
}

// calculateRegionalMetrics aggregates metrics by region
func (e *Engine) calculateRegionalMetrics() (map[string]float64, map[string]float64, map[string]float64) {
	regionLatency := make(map[string]float64)
	regionTraffic := make(map[string]float64)
	regionErrors := make(map[string]float64)
	regionCounts := make(map[string]int)
	regionTotalRequests := make(map[string]int)
	regionFailedRequests := make(map[string]int)

	for _, state := range e.state.NodeStates {
		region := state.Region
		if region == "" {
			region = "default"
		}

		// Aggregate latency
		if state.LatencyMS > 0 {
			regionLatency[region] += state.LatencyMS
			regionCounts[region]++
		}

		// Aggregate traffic (RPS) - display only
		regionTraffic[region] += state.RPSIn

		// CRITICAL FIX: Only count traffic at ENTRY NODES (clients) to avoid double-counting!
		// Traffic flows: Client → LB → API → DB
		// If we sum RPSIn at every node, we count the same request 3-4 times!
		isEntryNode := (state.Type == "client" || state.Type == "mobile_app" || state.Type == "web_browser")
		if isEntryNode {
			// For entry nodes, use RPSOut (what they generate)
			totalReqs := int(state.RPSOut * float64(e.config.DurationSeconds))
			regionTotalRequests[region] += totalReqs
		}

		// Aggregate ALL error counts from ALL nodes (errors happen at each bottleneck)
		regionFailedRequests[region] += state.ErrorCount
	}

	// Average latencies
	for region, count := range regionCounts {
		if count > 0 {
			regionLatency[region] /= float64(count)
		}
	}

	// CRITICAL FIX: If we have no entry nodes (or single region), use global metrics
	// This ensures regional error rate matches global error rate for single-region setups
	if len(regionTotalRequests) == 0 || (len(regionTotalRequests) == 1 && e.state.TotalRequests > 0) {
		// Single region or no explicit entry nodes - use global calculation
		for region := range regionTraffic {
			if e.state.TotalRequests > 0 {
				errorRate := (float64(e.state.FailedRequests) / float64(e.state.TotalRequests)) * 100.0
				regionErrors[region] = math.Round(errorRate*10) / 10
			} else {
				regionErrors[region] = 0.0
			}
		}
	} else {
		// Multi-region setup - calculate per region
		for region, totalReqs := range regionTotalRequests {
			if totalReqs > 0 {
				errorRate := (float64(regionFailedRequests[region]) / float64(totalReqs)) * 100.0
				regionErrors[region] = math.Round(errorRate*10) / 10
			} else {
				regionErrors[region] = 0.0
			}
		}
	}

	return regionLatency, regionTraffic, regionErrors
}

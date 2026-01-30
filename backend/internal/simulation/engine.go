package simulation

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"time"
)

// Engine is the main simulation engine
type Engine struct {
	input  *SimulationInput
	state  *SimulationState
	config WorkloadConfig
	rand   *rand.Rand
}

// NewEngine creates a new simulation engine
func NewEngine(input *SimulationInput) *Engine {
	return &Engine{
		input:  input,
		config: input.Workload,
		rand:   rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Run executes the simulation
func (e *Engine) Run() (*SimulationOutput, error) {
	startTime := time.Now()

	// Initialize state
	if err := e.initializeState(); err != nil {
		return nil, fmt.Errorf("failed to initialize state: %w", err)
	}

	// Run simulation ticks
	timeSeries := make([]TimeSeriesPoint, 0, e.config.DurationSeconds)
	autoscalingEvents := []AutoscalingEvent{}

	for tick := 1; tick <= e.config.DurationSeconds; tick++ {
		e.state.Tick = tick

		// Generate workload for this tick
		currentRPS := e.generateWorkload(tick)
		e.state.CurrentWorkloadRPS = currentRPS

		// Apply failure injections
		e.applyFailures(tick)

		// Route requests through the architecture
		e.routeRequests(currentRPS)

		// Update queues
		e.updateQueues()

		// Apply auto-scaling if enabled
		tickScalingEvents := []AutoscalingEvent{}
		if e.config.AutoScaling != nil && e.config.AutoScaling.Enabled {
			events := e.applyAutoScaling(tick)
			autoscalingEvents = append(autoscalingEvents, events...)
			tickScalingEvents = events
		}

		// Collect metrics for this tick (including scaling events)
		point := e.collectTimeSeriesPoint(tick, currentRPS)
		point.ScalingEvents = tickScalingEvents
		timeSeries = append(timeSeries, point)
	}

	// Calculate aggregate metrics
	metrics := e.calculateAggregateMetrics(autoscalingEvents)

	// Detect bottlenecks
	bottlenecks := e.detectBottlenecks()

	// Check SLA status
	_, slaViolations := e.checkSLAStatus(metrics.Latency, metrics.ErrorRate, metrics.Throughput)

	// Calculate cost metrics
	costMetrics := e.calculateCostMetrics()

	duration := time.Since(startTime)

	return &SimulationOutput{
		Metrics:       metrics,
		TimeSeries:    timeSeries,
		Bottlenecks:   bottlenecks,
		SLAViolations: slaViolations,
		CostMetrics:   costMetrics,
		Duration:      duration,
		Success:       true,
	}, nil
}

// initializeState sets up the simulation state
func (e *Engine) initializeState() error {
	e.state = &SimulationState{
		Tick:               0,
		CurrentWorkloadRPS: 0,
		NodeStates:         make(map[string]*NodeState),
		EdgeMap:            make(map[string][]string),
		ReverseEdgeMap:     make(map[string][]string),
		LatencyHistory:     make([]float64, 0),
		ThroughputHistory:  make([]float64, 0),
		ErrorHistory:       make([]int, 0),
		QueueHistory:       make([]int, 0),
		ActiveFailures:     make([]string, 0),
		RegionLatency:      make(map[string][]float64),
		RegionTraffic:      make(map[string]float64),
	}

	// Initialize node states
	for idx, node := range e.input.Nodes {
		// Determine region - distribute nodes across regions for multi-region support
		region := "default"
		if len(e.config.Regions) > 0 {
			// Round-robin distribution across regions
			region = e.config.Regions[idx%len(e.config.Regions)]
		}

		// Calculate capacity and latency from hardware configuration
		capacityRPS, latencyMS := calculateHardwarePerformance(node.Data.NodeType, node.Data.Config)

		state := &NodeState{
			ID:            node.ID,
			Type:          node.Data.NodeType,
			InstanceType:  getString(node.Data.Config, "instanceType", ""),
			LBType:        getString(node.Data.Config, "lbType", ""),
			AccessType:    getString(node.Data.Config, "accessType", "external"), // Default to external for LBs
			CapacityRPS:   capacityRPS,
			BaseLatencyMS: latencyMS, // ORIGINAL latency (never changes)
			LatencyMS:     latencyMS, // CURRENT latency (will be updated each tick)
			Replicas:      getInt(node.Data.Config, "replicas", 1),
			StorageSizeGB: getFloat(node.Data.Config, "storage_size_gb", 0),
			TTL:           getInt(node.Data.Config, "ttl_ms", 3600000),
			Consistency:   getString(node.Data.Config, "consistency", "strong"),
			Region:        region,
			CurrentLoad:   0,
			RPSIn:         0,
			RPSOut:        0,
			QueueDepth:    0,
			MaxQueueDepth: 100000, // Default max queue depth
			CacheHitRate:  0.75,   // Default cache hit rate
			CPUUsage:      0,
			MemoryUsage:   20, // Base memory usage
			ErrorCount:    0,
			Failed:        false,
			ReadRatio:     getInt(node.Data.Config, "readRatio", 80), // Default 80% reads
		}

		// Adjust cache hit rate for cache nodes
		if state.Type == "cache_redis" || state.Type == "cache_memcached" {
			state.CacheHitRate = 0.80
		}

		e.state.NodeStates[node.ID] = state
	}

	// Build edge maps
	for _, edge := range e.input.Edges {
		e.state.EdgeMap[edge.Source] = append(e.state.EdgeMap[edge.Source], edge.Target)
		e.state.ReverseEdgeMap[edge.Target] = append(e.state.ReverseEdgeMap[edge.Target], edge.Source)
	}

	return nil
}

// generateWorkload generates the workload for a given tick
func (e *Engine) generateWorkload(tick int) float64 {
	baseRPS := float64(e.config.RPS)

	switch e.config.Mode {
	case "constant":
		return baseRPS

	case "burst":
		// Random bursts every 5-10 ticks
		if tick%7 == 0 || e.rand.Float64() < 0.15 {
			return baseRPS * (1.5 + e.rand.Float64()*0.5) // 1.5x-2x burst
		}
		return baseRPS

	case "spike":
		// Sudden spike in the middle of simulation
		midPoint := e.config.DurationSeconds / 2
		if tick >= midPoint-2 && tick <= midPoint+5 {
			// 3x spike
			return baseRPS * 3.0
		}
		return baseRPS

	default:
		return baseRPS
	}
}

// routeRequests routes requests through the architecture with proper fan-in/fan-out
func (e *Engine) routeRequests(rps float64) {
	e.state.TotalRequests += int(rps)

	// Find client/entry nodes
	entryNodes := e.findEntryNodes()
	if len(entryNodes) == 0 {
		e.state.FailedRequests += int(rps)
		return
	}

	// Initialize traffic maps
	nodeIncomingRPS := make(map[string]float64)
	nodeOutgoingRPS := make(map[string]float64)

	// Set entry node traffic
	rpsPerEntry := rps / float64(len(entryNodes))
	for _, entryID := range entryNodes {
		nodeIncomingRPS[entryID] = rpsPerEntry
	}

	// Propagate traffic through the graph layer by layer
	// Use iterative approach: process nodes when all their inputs are ready
	maxIterations := 20
	for iteration := 0; iteration < maxIterations; iteration++ {
		processed := make(map[string]bool)

		// Try to process each node
		for nodeID := range e.state.NodeStates {
			if processed[nodeID] {
				continue
			}

			// Check if this node has incoming traffic calculated
			// (either it's an entry node, or all its parents have been processed)
			hasIncoming := nodeIncomingRPS[nodeID] > 0

			if !hasIncoming {
				// Calculate incoming traffic from all parents (FAN-IN aggregation)
				totalIncoming := 0.0

				// Use ReverseEdgeMap to find all parents of this node
				parents := e.state.ReverseEdgeMap[nodeID]

				for _, parentID := range parents {
					if nodeOutgoingRPS[parentID] > 0 {
						// Get the parent's target list to determine fan-out factor
						parentTargets := e.state.EdgeMap[parentID]
						numTargets := float64(len(parentTargets))

						if numTargets > 0 {
							// Parent divides its outgoing traffic among all its targets
							trafficFromParent := nodeOutgoingRPS[parentID] / numTargets
							totalIncoming += trafficFromParent
						}
					}
				}

				if totalIncoming > 0 {
					nodeIncomingRPS[nodeID] = totalIncoming
					hasIncoming = true
				}
			}

			// If node has incoming traffic and hasn't been processed, process it now
			if hasIncoming && nodeOutgoingRPS[nodeID] == 0 {
				node := e.state.NodeStates[nodeID]
				if node != nil {
					// Calculate outgoing traffic
					nodeOutgoingRPS[nodeID] = e.calculateNodeOutgoing(node, nodeIncomingRPS[nodeID])
					processed[nodeID] = true
				}
			}
		}

		// If nothing was processed this iteration, we're done
		if len(processed) == 0 {
			break
		}
	}

	// STEP 2: Process each node with its final incoming traffic
	for nodeID, incomingRPS := range nodeIncomingRPS {
		if incomingRPS > 0 {
			e.processNodeWithTraffic(nodeID, incomingRPS)
		}
	}
}

// calculateNodeOutgoing calculates how much RPS a node sends downstream
func (e *Engine) calculateNodeOutgoing(node *NodeState, incomingRPS float64) float64 {
	if node.Failed {
		return 0
	}

	// CRITICAL FIX: Most nodes pass ALL incoming traffic downstream!
	// The downstream node will handle capacity limiting and generate errors.
	// This ensures traffic conservation: DB sees full attempted load from all APIs.

	outgoingRPS := incomingRPS

	// EXCEPTION 1: Cache reduces downstream traffic (only misses pass through)
	if node.Type == "cache_redis" || node.Type == "cache_memcached" {
		cacheHitRate := node.CacheHitRate
		if cacheHitRate < 0 {
			cacheHitRate = 0.75 // Default 75% hit rate
		}
		// Only cache misses go to downstream database
		outgoingRPS = incomingRPS * (1.0 - cacheHitRate)
	}

	// EXCEPTION 2: Databases - CDC Pattern (Change Data Capture)
	// Traffic out of a database is typically CDC events (writes only)
	if node.Type == "database_sql" || node.Type == "database_nosql" || node.Type == "database_postgres" || node.Type == "database_mysql" || node.Type == "database_mongodb" {
		readRatioFloat := float64(node.ReadRatio) / 100.0
		writeRatio := 1.0 - readRatioFloat
		
		// Only Writes generate downstream events (CDC)
		// Reads stop at the database (query response)
		if writeRatio > 0 {
			outgoingRPS = incomingRPS * writeRatio
		} else {
			outgoingRPS = 0 // Pure Read-Replica, no downstream events
		}
	}

	// EXCEPTION 2: Client nodes send unlimited traffic (traffic generators)
	if node.Type == "client" {
		outgoingRPS = incomingRPS
	}

	return outgoingRPS
}

// processNodeWithTraffic processes a node with its aggregated incoming traffic
func (e *Engine) processNodeWithTraffic(nodeID string, incomingRPS float64) {
	node := e.state.NodeStates[nodeID]
	if node == nil {
		return
	}

	// Update incoming RPS
	node.RPSIn = incomingRPS

	// Check if node has failed
	if node.Failed {
		e.state.FailedRequests += int(incomingRPS)
		node.ErrorCount += int(incomingRPS)
		return
	}

	// Calculate effective capacity
	effectiveCapacity := node.CapacityRPS * float64(node.Replicas)

	// Update current load
	node.CurrentLoad = incomingRPS

	// Calculate throughput and overflow
	var throughput, overflow float64
	if incomingRPS <= effectiveCapacity {
		throughput = incomingRPS
		overflow = 0
	} else {
		throughput = effectiveCapacity
		overflow = incomingRPS - effectiveCapacity
		node.ErrorCount += int(overflow)
		e.state.FailedRequests += int(overflow)
	}

	// Update outgoing RPS
	outgoingRPS := throughput

	// Apply cache logic
	if node.Type == "cache_redis" || node.Type == "cache_memcached" {
		cacheHitRate := node.CacheHitRate
		if cacheHitRate < 0 {
			cacheHitRate = 0.75
		}
		// Only cache misses go to downstream nodes
		outgoingRPS = throughput * (1.0 - cacheHitRate)
	}

	node.RPSOut = outgoingRPS

	// Calculate realistic resource usage based on component type
	// Uses the new resource model that understands each component's characteristics
	resources := calculateResourceUsage(node, incomingRPS, effectiveCapacity)

	node.CPUUsage = resources.CPUPercent
	node.MemoryUsage = resources.MemoryPercent

	// Calculate realistic latency based on load and queueing
	// CRITICAL FIX: Use BaseLatencyMS (original) NOT node.LatencyMS (which changes each tick!)
	baseLatency := node.BaseLatencyMS

	// REAL-WORLD: Add cross-region network latency
	// This simulates actual AWS inter-region communication delays
	crossRegionLatency := 0.0
	if len(e.state.NodeStates) > 0 {
		// Calculate average cross-region latency from all incoming edges
		incomingEdgeCount := 0
		totalCrossRegionLatency := 0.0

		// Get all source nodes that connect to this node
		if sourceNodes, ok := e.state.ReverseEdgeMap[nodeID]; ok {
			for _, sourceID := range sourceNodes {
				sourceNode := e.state.NodeStates[sourceID]
				if sourceNode != nil && IsCrossRegion(sourceNode.Region, node.Region) {
					totalCrossRegionLatency += GetRegionLatency(sourceNode.Region, node.Region)
					incomingEdgeCount++
				}
			}
		}

		if incomingEdgeCount > 0 {
			crossRegionLatency = totalCrossRegionLatency / float64(incomingEdgeCount)
		}
	}
	if incomingRPS > effectiveCapacity {
		// When overloaded, latency increases due to queueing
		overloadRatio := (incomingRPS - effectiveCapacity) / effectiveCapacity
		// Add queueing delay: overload causes latency increase
		queueingDelay := baseLatency * overloadRatio * 5.0 // 5x base latency per 100% overload
		calculatedLatency := baseLatency + queueingDelay

		// CRITICAL: Cap latency at 30 seconds (real systems timeout!)
		node.LatencyMS = math.Min(calculatedLatency+crossRegionLatency, 30000.0)

		// Record high latency for percentile calculation
		e.state.LatencyHistory = append(e.state.LatencyHistory, node.LatencyMS)
	} else {
		node.LatencyMS = baseLatency + crossRegionLatency
		e.state.LatencyHistory = append(e.state.LatencyHistory, node.LatencyMS)
	}

	// DON'T count successful requests per node (causes double counting!)
	// We'll calculate it as: TotalRequests - FailedRequests at the end
}

// OLD processNode (keeping for backward compatibility, but deprecated)
func (e *Engine) processNode(nodeID string, incomingRPS float64, currentLatency float64, visited map[string]bool) {
	// Prevent infinite loops
	if visited[nodeID] {
		return
	}
	visited[nodeID] = true

	node := e.state.NodeStates[nodeID]
	if node == nil {
		return
	}

	// Check if node has failed
	if node.Failed {
		e.state.FailedRequests += int(incomingRPS)
		return
	}

	// Calculate effective capacity
	effectiveCapacity := node.CapacityRPS * float64(node.Replicas)

	// Update node load and RPS tracking
	node.CurrentLoad = incomingRPS
	node.RPSIn += incomingRPS

	// Calculate throughput
	var throughput, overflow float64
	if incomingRPS <= effectiveCapacity {
		throughput = incomingRPS
		overflow = 0
	} else {
		throughput = effectiveCapacity
		overflow = incomingRPS - effectiveCapacity
	}

	node.RPSOut += throughput

	// Calculate latency with overload penalty
	nodeLatency := node.LatencyMS
	if overflow > 0 {
		overloadRatio := overflow / effectiveCapacity
		nodeLatency += nodeLatency * overloadRatio * 2.0 // 2x penalty factor
	}

	totalLatency := currentLatency + nodeLatency

	// Handle cache logic
	if node.Type == "cache_redis" || node.Type == "cache_memcached" {
		e.handleCache(node, throughput)
	}

	// Handle queue logic
	if node.Type == "queue" || node.Type == "message_broker" {
		e.handleQueue(node, overflow)
		overflow = 0 // Queue absorbs overflow
	}

	// Record latency metrics
	e.state.LatencyHistory = append(e.state.LatencyHistory, totalLatency)

	// NOTE: Do NOT increment SuccessRequests here!
	// Success is calculated as: TotalRequests - FailedRequests
	// Counting per-node causes massive over-counting (270% error rate bug)

	// Handle overflow
	if overflow > 0 {
		// Check if there's a queue downstream
		targets := e.state.EdgeMap[nodeID]
		hasQueue := false
		for _, targetID := range targets {
			targetNode := e.state.NodeStates[targetID]
			if targetNode != nil && (targetNode.Type == "queue" || targetNode.Type == "message_broker") {
				e.handleQueue(targetNode, overflow)
				hasQueue = true
				break
			}
		}

		if !hasQueue {
			e.state.FailedRequests += int(overflow)
		}
	}

	// Route to downstream nodes
	// Route to downstream nodes
	targets := e.state.EdgeMap[nodeID]
	if len(targets) > 0 {
		mainTargets := []string{}
		telemetryTargets := []string{}

		// Classify targets
		for _, targetID := range targets {
			targetNode := e.state.NodeStates[targetID]
			if targetNode != nil && (targetNode.Type == "monitoring" || targetNode.Type == "logging") {
				telemetryTargets = append(telemetryTargets, targetID)
			} else {
				mainTargets = append(mainTargets, targetID)
			}
		}

		// 1. Handle Main Targets (Load Balanced traffic splitting)
		if len(mainTargets) > 0 {
			rpsPerTarget := throughput / float64(len(mainTargets))
			for _, targetID := range mainTargets {
				e.processNode(targetID, rpsPerTarget, totalLatency, visited)
			}
		}

		// 2. Handle Telemetry Targets (Sidecar pattern - traffic copy/sampling)
		// Monitoring/Logging gets a COPY of traffic, doesn't consume main capacity
		if len(telemetryTargets) > 0 {
			// Telemetry usually samples traffic (e.g. 10%) or is batched
			// We simulate this as 10% load to represent overhead without killing the service
			telemetryRPS := throughput * 0.10
			for _, targetID := range telemetryTargets {
				// Create a new visited map branch for telemetry so it doesn't block main flow loops
				// Telemetry is usually "fire and forget"
				telemetryVisited := make(map[string]bool)
				for k, v := range visited {
					telemetryVisited[k] = v
				}
				e.processNode(targetID, telemetryRPS, totalLatency, telemetryVisited)
			}
		}
	}
}

// findEntryNodes finds nodes where requests start (client nodes)
func (e *Engine) findEntryNodes() []string {
	entryNodes := []string{}
	for _, node := range e.input.Nodes {
		nodeType := node.Data.NodeType
		if nodeType == "client" || nodeType == "mobile_app" || nodeType == "web_browser" {
			entryNodes = append(entryNodes, node.ID)
		}
	}

	// If no explicit client nodes, use nodes with no incoming edges
	if len(entryNodes) == 0 {
		for nodeID := range e.state.NodeStates {
			if len(e.state.ReverseEdgeMap[nodeID]) == 0 {
				entryNodes = append(entryNodes, nodeID)
			}
		}
	}

	return entryNodes
}

// Helper functions
func getFloat(config map[string]interface{}, key string, defaultValue float64) float64 {
	if val, ok := config[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return defaultValue
}

func getInt(config map[string]interface{}, key string, defaultValue int) int {
	if val, ok := config[key]; ok {
		switch v := val.(type) {
		case int:
			return v
		case float64:
			return int(v)
		case int64:
			return int(v)
		}
	}
	return defaultValue
}

func getString(config map[string]interface{}, key string, defaultValue string) string {
	if val, ok := config[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}

// calculatePercentile calculates the nth percentile of a sorted slice
func calculatePercentile(sorted []float64, percentile float64) float64 {
	if len(sorted) == 0 {
		return 0
	}

	index := int(math.Ceil(percentile*float64(len(sorted)))) - 1
	if index < 0 {
		index = 0
	}
	if index >= len(sorted) {
		index = len(sorted) - 1
	}

	return sorted[index]
}

// calculateAggregateMetrics calculates final metrics
func (e *Engine) calculateAggregateMetrics(autoscalingEvents []AutoscalingEvent) AggregateMetrics {
	// Sort latency history for percentile calculation
	sortedLatency := make([]float64, len(e.state.LatencyHistory))
	copy(sortedLatency, e.state.LatencyHistory)
	sort.Float64s(sortedLatency)

	// Calculate latency metrics
	var latency LatencyMetrics
	if len(sortedLatency) > 0 {
		// Round all latency values to 2 decimal places for clean UI
		latency.P50 = math.Round(calculatePercentile(sortedLatency, 0.50)*100) / 100
		latency.P95 = math.Round(calculatePercentile(sortedLatency, 0.95)*100) / 100
		latency.P99 = math.Round(calculatePercentile(sortedLatency, 0.99)*100) / 100
		latency.Max = math.Round(sortedLatency[len(sortedLatency)-1]*100) / 100

		sum := 0.0
		for _, l := range sortedLatency {
			sum += l
		}
		latency.Avg = math.Round((sum/float64(len(sortedLatency)))*100) / 100
	}

	// FIX: Calculate successful requests correctly (was being double-counted per node!)
	// SuccessRequests = TotalRequests - FailedRequests
	successfulRequests := e.state.TotalRequests - e.state.FailedRequests
	if successfulRequests < 0 {
		successfulRequests = 0
	}

	// Calculate throughput (average successful requests per second)
	throughput := float64(successfulRequests) / float64(e.config.DurationSeconds)

	// Calculate error rate with safeguards
	errorRate := 0.0
	if e.state.TotalRequests > 0 {
		// Safeguard: FailedRequests should never exceed TotalRequests
		if e.state.FailedRequests > e.state.TotalRequests {
			// This indicates a bug in request counting, cap it
			e.state.FailedRequests = e.state.TotalRequests
		}
		errorRate = float64(e.state.FailedRequests) / float64(e.state.TotalRequests)
		// Safeguard: Error rate must be between 0 and 1 (0% to 100%)
		if errorRate > 1.0 {
			errorRate = 1.0
		}
		if errorRate < 0.0 {
			errorRate = 0.0
		}
	}

	// Calculate cache hit rate
	cacheHitRate := 0.0
	totalCacheAccess := e.state.CacheHits + e.state.CacheMisses
	if totalCacheAccess > 0 {
		cacheHitRate = float64(e.state.CacheHits) / float64(totalCacheAccess)
	}

	// Get final queue depth
	queueDepth := 0
	for _, node := range e.state.NodeStates {
		if node.Type == "queue" || node.Type == "message_broker" {
			queueDepth += node.QueueDepth
		}
	}

	return AggregateMetrics{
		Latency:            latency,
		Throughput:         throughput,
		ErrorRate:          errorRate,
		CacheHitRate:       cacheHitRate,
		QueueDepth:         queueDepth,
		TotalRequests:      e.state.TotalRequests,
		SuccessfulRequests: successfulRequests, // FIX: Use calculated value, not double-counted state
		FailedRequests:     e.state.FailedRequests,
		AutoscalingEvents:  autoscalingEvents,
	}
}

// collectTimeSeriesPoint collects metrics for a single tick (enhanced for Module 5)
func (e *Engine) collectTimeSeriesPoint(tick int, incomingRPS float64) TimeSeriesPoint {
	// Calculate latency percentiles from recent history
	latency := LatencyMetrics{}
	if len(e.state.LatencyHistory) > 0 {
		recent := make([]float64, len(e.state.LatencyHistory))
		copy(recent, e.state.LatencyHistory)
		if len(recent) > 100 {
			recent = recent[len(recent)-100:]
		}
		sortedRecent := make([]float64, len(recent))
		copy(sortedRecent, recent)

		latency.P50 = calculatePercentile(sortedRecent, 0.50)
		latency.P95 = calculatePercentile(sortedRecent, 0.95)
		latency.P99 = calculatePercentile(sortedRecent, 0.99)

		sum := 0.0
		for _, l := range recent {
			sum += l
		}
		latency.Avg = sum / float64(len(recent))
	}

	// Calculate throughput for this tick
	throughput := float64(e.state.SuccessRequests) / float64(tick)

	// Calculate error rate
	errorRate := 0.0
	if e.state.TotalRequests > 0 {
		errorRate = float64(e.state.FailedRequests) / float64(e.state.TotalRequests)
	}

	// Calculate drop rate
	dropRate := 0.0
	if e.state.TotalRequests > 0 {
		dropRate = float64(e.state.DroppedRequests) / float64(e.state.TotalRequests)
	}

	// Calculate cache hit ratio
	cacheHitRatio := 0.0
	totalCacheAccess := e.state.CacheHits + e.state.CacheMisses
	if totalCacheAccess > 0 {
		cacheHitRatio = float64(e.state.CacheHits) / float64(totalCacheAccess)
	}

	// Get queue depth and wait time
	queueDepth := 0
	queueWaitTime := 0.0
	queueCount := 0
	for _, node := range e.state.NodeStates {
		if node.Type == "queue" || node.Type == "message_broker" {
			queueDepth += node.QueueDepth
			if node.QueueDepth > 0 && node.CapacityRPS > 0 {
				// Estimate wait time based on queue depth and drain rate
				drainRate := node.CapacityRPS * float64(node.Replicas)
				queueWaitTime += float64(node.QueueDepth) / drainRate * 1000 // ms
				queueCount++
			}
		}
	}
	if queueCount > 0 {
		queueWaitTime /= float64(queueCount)
	}

	// Calculate CPU and memory usage (aggregate)
	totalCPU := 0.0
	totalMem := 0.0
	nodeCount := 0
	for _, state := range e.state.NodeStates {
		effectiveCapacity := state.CapacityRPS * float64(state.Replicas)
		if effectiveCapacity > 0 {
			cpu := math.Min(100, (state.CurrentLoad/effectiveCapacity)*100)
			totalCPU += cpu
			state.CPUUsage = cpu
		}
		totalMem += state.MemoryUsage
		nodeCount++
	}
	avgCPU := 0.0
	avgMem := 20.0
	if nodeCount > 0 {
		avgCPU = totalCPU / float64(nodeCount)
		avgMem = totalMem / float64(nodeCount)
	}

	// Calculate regional metrics
	regionLatency, regionTraffic, regionErrorRate := e.calculateRegionalMetrics()

	// Collect node metrics
	nodeMetrics := e.calculateNodeMetrics()

	// Check SLA status
	slaStatus, _ := e.checkSLAStatus(latency, errorRate, throughput)

	// Calculate network latency (average latency across nodes)
	networkLatency := 0.0
	if latency.Avg > 0 {
		networkLatency = latency.Avg * 0.1 // Assume 10% of latency is network
	}

	return TimeSeriesPoint{
		Tick:               tick,
		IncomingRPS:        incomingRPS,
		ThroughputRPS:      throughput,
		TotalRPS:           throughput,
		Latency:            latency,
		ErrorRatePercent:   errorRate * 100,
		QueueDepth:         queueDepth,
		QueueWaitTime:      queueWaitTime,
		CacheHitRatio:      cacheHitRatio,
		DropRate:           dropRate,
		CPUUsagePercent:    avgCPU,
		MemoryUsagePercent: avgMem,
		NetworkLatencyMs:   networkLatency,
		RegionLatencyMap:   regionLatency,
		RegionTrafficMap:   regionTraffic,
		RegionErrorRateMap: regionErrorRate, // Add error rate per region
		NodeMetrics:        nodeMetrics,
		FailuresActive:     e.state.ActiveFailures,
		SLAStatus:          slaStatus,
	}
}

// calculateHardwarePerformance determines capacity and latency from hardware configuration
func calculateHardwarePerformance(nodeType string, config map[string]interface{}) (capacityRPS float64, latencyMS float64) {
	// Default values
	capacityRPS = 1000.0
	latencyMS = 10.0

	switch nodeType {
	case "client":
		// Clients generate unlimited traffic
		capacityRPS = 1000000.0
		latencyMS = 0.0

	case "load_balancer":
		// Load balancer capacity from lbType
		lbType := getString(config, "lbType", "alb")
		
		switch lbType {
		case "alb":
			capacityRPS = 50000.0
			latencyMS = 5.0
		case "nlb":
			capacityRPS = 500000.0
			latencyMS = 1.0
		case "classic":
			capacityRPS = 25000.0
			latencyMS = 10.0
		default:
			capacityRPS = 50000.0
			latencyMS = 5.0
		}

		// Internal LBs are faster (no WAF/public internet overhead)
		accessType := getString(config, "accessType", "external")
		if accessType == "internal" {
			latencyMS *= 0.6 // 40% latency reduction
		}

	case "subnet":
		// Subnets are logical containers (passthrough)
		capacityRPS = 1000000000.0 // Infinite
		latencyMS = 0.0            // Zero latency

	case "api_server", "compute":
		// Compute capacity from instance type
		instanceType := getString(config, "instanceType", "t3.medium")
		capacityRPS, latencyMS = getComputeCapacity(instanceType)

	case "database_postgres", "database_mysql", "database_mongodb":
		// Database capacity from instance type
		instanceType := getString(config, "instanceType", "db.t3.medium")
		capacityRPS, latencyMS = getDatabaseCapacity(instanceType)

	case "cache_redis", "cache_memcached":
		// Cache capacity from instance type
		instanceType := getString(config, "instanceType", "cache.t3.micro")
		capacityRPS, latencyMS = getCacheCapacity(instanceType)

	case "queue_sqs", "queue_kafka", "queue_rabbitmq":
		// Queue has very high throughput
		queueType := getString(config, "queueType", "sqs-standard")
		switch queueType {
		case "sqs-standard", "sqs-fifo":
			capacityRPS = 3000.0 // SQS batch limit
			latencyMS = 20.0
		case "kafka-standard", "kafka-premium":
			capacityRPS = 100000.0
			latencyMS = 5.0
		case "rabbitmq-basic", "rabbitmq-ha":
			capacityRPS = 50000.0
			latencyMS = 10.0
		default:
			capacityRPS = 10000.0
			latencyMS = 15.0
		}

	case "cdn_cloudfront", "cdn":
		// CDN has massive capacity
		capacityRPS = 1000000.0
		latencyMS = 50.0 // Higher latency due to edge locations

	case "storage_s3", "object_storage":
		// Object storage
		capacityRPS = 5500.0 // S3 limit per prefix
		latencyMS = 100.0

	case "search_elasticsearch", "search":
		// Search engines
		if getString(config, "searchType", "") == "" {
			capacityRPS = 1000.0
			latencyMS = 50.0
		} else {
			capacityRPS = 5000.0
			latencyMS = 30.0
		}

	default:
		// Unknown node type - use conservative defaults
		capacityRPS = 1000.0
		latencyMS = 10.0
	}

	return capacityRPS, latencyMS
}

// getComputeCapacity returns capacity for compute instances
func getComputeCapacity(instanceType string) (float64, float64) {
	switch instanceType {
	case "t3.micro":
		return 500.0, 50.0
	case "t3.small":
		return 1000.0, 30.0
	case "t3.medium":
		return 2000.0, 20.0
	case "t3.large":
		return 4000.0, 15.0
	case "m5.large":
		return 5000.0, 10.0
	case "m5.xlarge":
		return 10000.0, 8.0
	case "m5.2xlarge":
		return 20000.0, 5.0
	case "c5.large":
		return 6000.0, 8.0
	case "c5.xlarge":
		return 12000.0, 6.0
	case "c5.2xlarge":
		return 25000.0, 4.0
	default:
		return 2000.0, 20.0
	}
}

// getDatabaseCapacity returns capacity for database instances
func getDatabaseCapacity(instanceType string) (float64, float64) {
	switch instanceType {
	case "db.t3.micro":
		return 100.0, 50.0
	case "db.t3.small":
		return 300.0, 30.0
	case "db.t3.medium":
		return 800.0, 20.0
	case "db.m5.large":
		return 2000.0, 10.0
	case "db.m5.xlarge":
		return 5000.0, 8.0
	case "db.r5.large":
		return 3000.0, 12.0
	case "db.r5.xlarge":
		return 7000.0, 8.0
	default:
		return 800.0, 20.0
	}
}

// getCacheCapacity returns capacity for cache instances
func getCacheCapacity(instanceType string) (float64, float64) {
	switch instanceType {
	case "cache.t3.micro":
		return 5000.0, 5.0
	case "cache.t3.small":
		return 10000.0, 3.0
	case "cache.m5.large":
		return 25000.0, 2.0
	case "cache.m5.xlarge":
		return 50000.0, 1.0
	case "cache.r5.large":
		return 40000.0, 2.0
	case "cache.r5.xlarge":
		return 80000.0, 1.0
	default:
		return 10000.0, 3.0
	}
}

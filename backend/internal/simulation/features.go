package simulation

// handleCache processes cache hit/miss logic
func (e *Engine) handleCache(node *NodeState, throughput float64) {
	// Calculate reads (80% of requests by default)
	readRatio := float64(e.config.ReadWriteRatio.Read) / 100.0
	totalReads := throughput * readRatio
	
	// Calculate cache hits and misses
	cacheHits := int(totalReads * node.CacheHitRate)
	cacheMisses := int(totalReads) - cacheHits
	
	e.state.CacheHits += cacheHits
	e.state.CacheMisses += cacheMisses
	
	// Cache misses generate load on downstream database
	if cacheMisses > 0 {
		targets := e.state.EdgeMap[node.ID]
		for _, targetID := range targets {
			targetNode := e.state.NodeStates[targetID]
			if targetNode != nil && isDatabase(targetNode.Type) {
				// Add cache miss load to database
				targetNode.CurrentLoad += float64(cacheMisses)
			}
		}
	}
}

// handleQueue processes queue buildup and drain
func (e *Engine) handleQueue(node *NodeState, incomingLoad float64) {
	// Add incoming overflow to queue
	node.QueueDepth += int(incomingLoad)
	
	// Calculate drain rate (processing capacity of consumers)
	drainRate := int(node.CapacityRPS * float64(node.Replicas))
	
	// Drain queue
	if node.QueueDepth > 0 {
		drained := drainRate
		if drained > node.QueueDepth {
			drained = node.QueueDepth
		}
		node.QueueDepth -= drained
		e.state.SuccessRequests += drained
	}
	
	// Check if queue is full
	if node.MaxQueueDepth > 0 && node.QueueDepth > node.MaxQueueDepth {
		dropped := node.QueueDepth - node.MaxQueueDepth
		node.QueueDepth = node.MaxQueueDepth
		e.state.FailedRequests += dropped
		e.state.DroppedRequests += dropped
	}
	
	// Record queue depth
	e.state.QueueHistory = append(e.state.QueueHistory, node.QueueDepth)
}

// updateQueues updates all queue nodes
func (e *Engine) updateQueues() {
	for _, node := range e.state.NodeStates {
		if node.Type == "queue" || node.Type == "message_broker" || node.Type == "event_bus" {
			// Natural drain even without explicit incoming load
			drainRate := int(node.CapacityRPS * float64(node.Replicas))
			if node.QueueDepth > 0 {
				drained := drainRate
				if drained > node.QueueDepth {
					drained = node.QueueDepth
				}
				node.QueueDepth -= drained
			}
		}
	}
}

// applyFailures applies failure injections
func (e *Engine) applyFailures(tick int) {
	// Reset active failures list
	e.state.ActiveFailures = []string{}
	
	for _, failure := range e.config.Failures {
		// Check if failure should be active at this tick
		if failure.StartTick > 0 && tick < failure.StartTick {
			continue
		}
		if failure.EndTick > 0 && tick > failure.EndTick {
			continue
		}
		
		// Track active failure
		e.state.ActiveFailures = append(e.state.ActiveFailures, failure.Type)
		
		switch failure.Type {
		case "nodeFail":
			e.applyNodeFailure(failure.NodeID)
			
		case "regionFail":
			e.applyRegionFailure(failure.Region)
			
		case "cacheFail":
			e.applyCacheFailure(failure.NodeID)
			
		case "dbFail":
			e.applyDBFailure(failure.NodeID)
			
		case "networkDelay":
			e.applyNetworkDelay(failure.Region, failure.DelayMs)
		}
	}
}

// applyNodeFailure marks a node as failed
func (e *Engine) applyNodeFailure(nodeID string) {
	if node := e.state.NodeStates[nodeID]; node != nil {
		node.Failed = true
	}
}

// applyRegionFailure fails all nodes in a region
func (e *Engine) applyRegionFailure(region string) {
	for _, node := range e.state.NodeStates {
		// Check if node belongs to this region (simplified)
		if contains(e.config.Regions, region) {
			node.Failed = true
		}
	}
}

// applyCacheFailure sets cache hit rate to 0
func (e *Engine) applyCacheFailure(nodeID string) {
	if node := e.state.NodeStates[nodeID]; node != nil {
		if node.Type == "cache_redis" || node.Type == "cache_memcached" {
			node.CacheHitRate = 0.0
		}
	}
}

// applyDBFailure marks database as failed
func (e *Engine) applyDBFailure(nodeID string) {
	if node := e.state.NodeStates[nodeID]; node != nil {
		if isDatabase(node.Type) {
			node.Failed = true
		}
	}
}

// applyNetworkDelay adds latency to nodes in a region
func (e *Engine) applyNetworkDelay(region string, delayMs int) {
	if contains(e.config.Regions, region) {
		for _, node := range e.state.NodeStates {
			node.LatencyMS += float64(delayMs)
		}
	}
}

// DISABLED: Auto-scaling removed for better learning experience
// Users should learn to design proper capacity instead of relying on automatic scaling
// This teaches bottleneck identification and proper architecture design
/*
func (e *Engine) applyAutoScaling(tick int) []AutoscalingEvent {
	events := []AutoscalingEvent{}
	
	if e.config.AutoScaling == nil || !e.config.AutoScaling.Enabled {
		return events
	}
	
	config := e.config.AutoScaling
	
	for _, node := range e.state.NodeStates {
		// Skip nodes that don't support scaling
		if !canScale(node.Type) {
			continue
		}
		
		// Check cooldown
		if tick-node.LastScaleTime < config.CooldownSeconds {
			continue
		}
		
		// Calculate load ratio
		effectiveCapacity := node.CapacityRPS * float64(node.Replicas)
		loadRatio := 0.0
		if effectiveCapacity > 0 {
			loadRatio = node.CurrentLoad / effectiveCapacity
		}
		
		oldReplicas := node.Replicas
		
		// Scale up if above threshold
		if loadRatio > config.UpThreshold {
			if config.MaxReplicas == 0 || node.Replicas < config.MaxReplicas {
				node.Replicas++
				node.LastScaleTime = tick
				
				events = append(events, AutoscalingEvent{
					Tick:     tick,
					NodeID:   node.ID,
					OldValue: oldReplicas,
					NewValue: node.Replicas,
					Reason:   "High load - scaling up",
				})
			}
		}
		
		// Scale down if below threshold
		if loadRatio < config.DownThreshold {
			minReplicas := config.MinReplicas
			if minReplicas == 0 {
				minReplicas = 1
			}
			
			if node.Replicas > minReplicas {
				node.Replicas--
				node.LastScaleTime = tick
				
				events = append(events, AutoscalingEvent{
					Tick:     tick,
					NodeID:   node.ID,
					OldValue: oldReplicas,
					NewValue: node.Replicas,
					Reason:   "Low load - scaling down",
				})
			}
		}
	}
	
	return events
}
*/

// Stub function to maintain compatibility
func (e *Engine) applyAutoScaling(tick int) []AutoscalingEvent {
	// Auto-scaling disabled - return empty events
	return []AutoscalingEvent{}
}

// Helper functions

func isDatabase(nodeType string) bool {
	dbTypes := []string{
		"database_sql",
		"database_nosql",
		"database_graph",
		"database_timeseries",
	}
	return contains(dbTypes, nodeType)
}

func canScale(nodeType string) bool {
	scalableTypes := []string{
		"api_server",
		"web_server",
		"microservice",
		"worker",
		"cache_redis",
		"cache_memcached",
		"load_balancer",
		"database_sql",
		"database_nosql",
		"database_postgres",
		"database_mysql",
		"database_mongodb",
		"database_graph",
		"database_timeseries",
	}
	return contains(scalableTypes, nodeType)
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

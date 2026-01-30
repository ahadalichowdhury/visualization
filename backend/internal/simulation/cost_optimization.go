package simulation

import (
	"fmt"
	"math"
)

// CostOptimizationRecommendation represents a cost-saving suggestion
type CostOptimizationRecommendation struct {
	ComponentID    string  `json:"component_id"`
	ComponentType  string  `json:"component_type"`
	CurrentCost    float64 `json:"current_cost_monthly"`
	OptimizedCost  float64 `json:"optimized_cost_monthly"`
	Savings        float64 `json:"savings_monthly"`
	SavingsPercent float64 `json:"savings_percent"`
	Recommendation string  `json:"recommendation"`
	Reason         string  `json:"reason"`
	Priority       string  `json:"priority"` // "high", "medium", "low"
	Impact         string  `json:"impact"`   // "minimal", "moderate", "significant"
}

// AnalyzeCostOptimizations analyzes the architecture and suggests cost optimizations
func (e *Engine) AnalyzeCostOptimizations() []CostOptimizationRecommendation {
	recommendations := []CostOptimizationRecommendation{}

	for nodeID, node := range e.state.NodeStates {
		// Analyze each component type
		switch node.Type {
		case "api_server", "web_server", "microservice", "worker":
			rec := e.analyzeComputeOptimization(nodeID, node)
			if rec != nil {
				recommendations = append(recommendations, *rec)
			}

		case "database_sql", "database_nosql", "database_graph", "database_timeseries":
			rec := e.analyzeDatabaseOptimization(nodeID, node)
			if rec != nil {
				recommendations = append(recommendations, *rec)
			}

		case "cache_redis", "cache_memcached":
			rec := e.analyzeCacheOptimization(nodeID, node)
			if rec != nil {
				recommendations = append(recommendations, *rec)
			}

		case "load_balancer", "api_gateway":
			rec := e.analyzeNetworkOptimization(nodeID, node)
			if rec != nil {
				recommendations = append(recommendations, *rec)
			}
		}

		// Check for over-provisioning
		if rec := e.analyzeOverProvisioning(nodeID, node); rec != nil {
			recommendations = append(recommendations, *rec)
		}

		// Check for under-utilization
		if rec := e.analyzeUnderUtilization(nodeID, node); rec != nil {
			recommendations = append(recommendations, *rec)
		}

		// Check for reserved instance opportunities
		if rec := e.analyzeReservedInstanceOpportunity(nodeID, node); rec != nil {
			recommendations = append(recommendations, *rec)
		}
	}

	return recommendations
}

// analyzeComputeOptimization analyzes compute resources (EC2, containers)
func (e *Engine) analyzeComputeOptimization(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	avgCPU := node.CPUUsage
	avgMemory := node.MemoryUsage

	// If both CPU and memory are consistently low, recommend downsizing
	if avgCPU < 30 && avgMemory < 40 {
		currentCost := e.estimateInstanceCost(node.InstanceType)
		optimizedInstance := e.recommendSmallerInstance(node.InstanceType)
		optimizedCost := e.estimateInstanceCost(optimizedInstance)

		if optimizedCost < currentCost {
			return &CostOptimizationRecommendation{
				ComponentID:    nodeID,
				ComponentType:  node.Type,
				CurrentCost:    currentCost * 730, // Monthly
				OptimizedCost:  optimizedCost * 730,
				Savings:        (currentCost - optimizedCost) * 730,
				SavingsPercent: ((currentCost - optimizedCost) / currentCost) * 100,
				Recommendation: fmt.Sprintf("Downsize from %s to %s", node.InstanceType, optimizedInstance),
				Reason:         fmt.Sprintf("Average CPU: %.1f%%, Memory: %.1f%% - significantly under-utilized", avgCPU, avgMemory),
				Priority:       "high",
				Impact:         "minimal",
			}
		}
	}

	// If CPU is high but memory is low, recommend compute-optimized instance
	if avgCPU > 70 && avgMemory < 50 && !isComputeOptimized(node.InstanceType) {
		currentCost := e.estimateInstanceCost(node.InstanceType)
		optimizedInstance := e.recommendComputeOptimized(node.InstanceType)
		optimizedCost := e.estimateInstanceCost(optimizedInstance)

		if optimizedCost < currentCost {
			return &CostOptimizationRecommendation{
				ComponentID:    nodeID,
				ComponentType:  node.Type,
				CurrentCost:    currentCost * 730,
				OptimizedCost:  optimizedCost * 730,
				Savings:        (currentCost - optimizedCost) * 730,
				SavingsPercent: ((currentCost - optimizedCost) / currentCost) * 100,
				Recommendation: fmt.Sprintf("Switch to compute-optimized: %s", optimizedInstance),
				Reason:         "High CPU usage with low memory - compute-optimized instance is more cost-effective",
				Priority:       "medium",
				Impact:         "minimal",
			}
		}
	}

	return nil
}

// analyzeDatabaseOptimization analyzes database resources
func (e *Engine) analyzeDatabaseOptimization(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// Check read ratio - if mostly reads, recommend read replicas instead of larger instance
	readRatio := float64(node.ReadRatio) / 100.0

	if readRatio > 0.8 && node.Replicas == 1 {
		currentCost := e.estimateInstanceCost(node.InstanceType) * 730
		// Recommend smaller primary + read replicas
		optimizedCost := currentCost * 0.7 // Typically 30% savings

		return &CostOptimizationRecommendation{
			ComponentID:    nodeID,
			ComponentType:  node.Type,
			CurrentCost:    currentCost,
			OptimizedCost:  optimizedCost,
			Savings:        currentCost - optimizedCost,
			SavingsPercent: 30.0,
			Recommendation: "Add read replicas and downsize primary instance",
			Reason:         fmt.Sprintf("%.0f%% read traffic - read replicas are more cost-effective than vertical scaling", readRatio*100),
			Priority:       "high",
			Impact:         "moderate",
		}
	}

	// Check storage type optimization
	// Note: Using CPU as proxy for disk I/O activity (simplified)
	if node.StorageSizeGB > 1000 {
		avgDiskIO := node.CPUUsage // Simplified: CPU usage as proxy for I/O
		if avgDiskIO < 40 {
			// If disk I/O is low, can use cheaper storage
			currentCost := e.estimateStorageCost("io2", node.StorageSizeGB) * 730
			optimizedCost := e.estimateStorageCost("gp3", node.StorageSizeGB) * 730

			if optimizedCost < currentCost {
				return &CostOptimizationRecommendation{
					ComponentID:    nodeID,
					ComponentType:  node.Type,
					CurrentCost:    currentCost,
					OptimizedCost:  optimizedCost,
					Savings:        currentCost - optimizedCost,
					SavingsPercent: ((currentCost - optimizedCost) / currentCost) * 100,
					Recommendation: "Switch from io2 to gp3 storage",
					Reason:         "Low disk I/O doesn't justify premium IOPS storage",
					Priority:       "high",
					Impact:         "minimal",
				}
			}
		}
	}

	return nil
}

// analyzeCacheOptimization analyzes cache resources
func (e *Engine) analyzeCacheOptimization(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// If cache hit rate is very high and memory usage is low, can downsize
	if node.CacheHitRate > 0.95 && node.MemoryUsage < 50 {
		currentCost := e.estimateInstanceCost(node.InstanceType) * 730
		optimizedInstance := e.recommendSmallerInstance(node.InstanceType)
		optimizedCost := e.estimateInstanceCost(optimizedInstance) * 730

		if optimizedCost < currentCost {
			return &CostOptimizationRecommendation{
				ComponentID:    nodeID,
				ComponentType:  node.Type,
				CurrentCost:    currentCost,
				OptimizedCost:  optimizedCost,
				Savings:        currentCost - optimizedCost,
				SavingsPercent: ((currentCost - optimizedCost) / currentCost) * 100,
				Recommendation: fmt.Sprintf("Downsize Redis from %s to %s", node.InstanceType, optimizedInstance),
				Reason:         fmt.Sprintf("High hit rate (%.1f%%) with low memory usage (%.1f%%) - over-provisioned", node.CacheHitRate*100, node.MemoryUsage),
				Priority:       "medium",
				Impact:         "minimal",
			}
		}
	}

	return nil
}

// analyzeNetworkOptimization analyzes network components
func (e *Engine) analyzeNetworkOptimization(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// Check if load balancer is needed or if API Gateway can handle traffic
	if node.Type == "load_balancer" && node.RPSIn < 1000 {
		return &CostOptimizationRecommendation{
			ComponentID:    nodeID,
			ComponentType:  node.Type,
			CurrentCost:    0.025 * 730, // ALB hourly cost
			OptimizedCost:  0.0,
			Savings:        0.025 * 730,
			SavingsPercent: 100.0,
			Recommendation: "Consider removing load balancer - API Gateway can handle this traffic",
			Reason:         fmt.Sprintf("Low RPS (%.0f) - API Gateway may be sufficient", node.RPSIn),
			Priority:       "low",
			Impact:         "significant",
		}
	}

	return nil
}

// analyzeOverProvisioning detects over-provisioned resources
func (e *Engine) analyzeOverProvisioning(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// If resources are consistently under 20% utilized, it's over-provisioned
	if node.CPUUsage < 20 && node.MemoryUsage < 20 {
		return &CostOptimizationRecommendation{
			ComponentID:    nodeID,
			ComponentType:  node.Type,
			CurrentCost:    e.estimateInstanceCost(node.InstanceType) * 730,
			OptimizedCost:  0, // Calculate in caller
			Savings:        0,
			SavingsPercent: 0,
			Recommendation: "Significantly over-provisioned - consider downsizing by 50%",
			Reason:         fmt.Sprintf("Extremely low utilization - CPU: %.1f%%, Memory: %.1f%%", node.CPUUsage, node.MemoryUsage),
			Priority:       "high",
			Impact:         "minimal",
		}
	}

	return nil
}

// analyzeUnderUtilization detects idle or rarely used resources
func (e *Engine) analyzeUnderUtilization(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// If component receives almost no traffic, recommend removal
	if node.RPSIn < 0.1 && node.Type != "monitoring" && node.Type != "logging" {
		return &CostOptimizationRecommendation{
			ComponentID:    nodeID,
			ComponentType:  node.Type,
			CurrentCost:    e.estimateInstanceCost(node.InstanceType) * 730,
			OptimizedCost:  0.0,
			Savings:        e.estimateInstanceCost(node.InstanceType) * 730,
			SavingsPercent: 100.0,
			Recommendation: "Consider removing - receives almost no traffic",
			Reason:         fmt.Sprintf("Idle resource - only %.2f RPS", node.RPSIn),
			Priority:       "medium",
			Impact:         "significant",
		}
	}

	return nil
}

// analyzeReservedInstanceOpportunity suggests reserved instances for stable workloads
func (e *Engine) analyzeReservedInstanceOpportunity(nodeID string, node *NodeState) *CostOptimizationRecommendation {
	// If instance type is stable and not burstable, recommend reserved instance
	if !isBurstable(node.InstanceType) && node.CPUUsage > 40 && node.CPUUsage < 80 {
		currentCost := e.estimateInstanceCost(node.InstanceType) * 730
		reservedCost := currentCost * 0.6 // 40% savings with 1-year reserved

		return &CostOptimizationRecommendation{
			ComponentID:    nodeID,
			ComponentType:  node.Type,
			CurrentCost:    currentCost,
			OptimizedCost:  reservedCost,
			Savings:        currentCost - reservedCost,
			SavingsPercent: 40.0,
			Recommendation: "Purchase 1-year reserved instance",
			Reason:         "Stable workload with consistent usage - reserved instance offers 40% savings",
			Priority:       "high",
			Impact:         "minimal",
		}
	}

	return nil
}

// Helper functions for cost estimation
func (e *Engine) EstimateInstanceCost(instanceType string) float64 {
	return e.estimateInstanceCost(instanceType)
}

func (e *Engine) EstimateStorageCost(storageType string, sizeGB float64) float64 {
	return e.estimateStorageCost(storageType, sizeGB)
}

func (e *Engine) EstimateDataTransferCost() float64 {
	return e.estimateDataTransferCost()
}

// Helper functions for cost estimation (private)
func (e *Engine) estimateInstanceCost(instanceType string) float64 {
	// Simplified AWS EC2 pricing (hourly)
	costs := map[string]float64{
		"t3.micro":   0.0104,
		"t3.small":   0.0208,
		"t3.medium":  0.0416,
		"t3.large":   0.0832,
		"m5.large":   0.096,
		"m5.xlarge":  0.192,
		"m5.2xlarge": 0.384,
		"c5.large":   0.085,
		"c5.xlarge":  0.17,
		"c5.2xlarge": 0.34,
		"r5.large":   0.126,
		"r5.xlarge":  0.252,
	}

	if cost, ok := costs[instanceType]; ok {
		return cost
	}
	return 0.10 // Default
}

func (e *Engine) estimateStorageCost(storageType string, sizeGB float64) float64 {
	// AWS EBS pricing per GB-month
	pricePerGB := map[string]float64{
		"gp2": 0.10,
		"gp3": 0.08,
		"io1": 0.125,
		"io2": 0.125,
		"st1": 0.045,
		"sc1": 0.015,
	}

	if price, ok := pricePerGB[storageType]; ok {
		return price * sizeGB / 730 // Convert to hourly
	}
	return 0.10 * sizeGB / 730
}

func (e *Engine) recommendSmallerInstance(currentInstance string) string {
	// Simple downgrade logic
	downgrades := map[string]string{
		"t3.large":   "t3.medium",
		"t3.medium":  "t3.small",
		"m5.2xlarge": "m5.xlarge",
		"m5.xlarge":  "m5.large",
		"c5.2xlarge": "c5.xlarge",
		"c5.xlarge":  "c5.large",
		"r5.xlarge":  "r5.large",
	}

	if smaller, ok := downgrades[currentInstance]; ok {
		return smaller
	}
	return currentInstance
}

func (e *Engine) recommendComputeOptimized(currentInstance string) string {
	// Map general purpose to compute optimized
	mapping := map[string]string{
		"m5.large":   "c5.large",
		"m5.xlarge":  "c5.xlarge",
		"m5.2xlarge": "c5.2xlarge",
	}

	if optimized, ok := mapping[currentInstance]; ok {
		return optimized
	}
	return currentInstance
}

func isComputeOptimized(instanceType string) bool {
	return len(instanceType) > 0 && instanceType[0] == 'c'
}

func isBurstable(instanceType string) bool {
	return len(instanceType) > 0 && instanceType[0] == 't'
}

// CalculateTotalMonthlyCost calculates the total monthly cost of the architecture
func (e *Engine) CalculateTotalMonthlyCost() float64 {
	totalCost := 0.0

	for _, node := range e.state.NodeStates {
		// Instance cost
		if node.InstanceType != "" {
			totalCost += e.estimateInstanceCost(node.InstanceType) * 730 * float64(node.Replicas)
		}

		// Storage cost
		if node.StorageSizeGB > 0 {
			totalCost += e.estimateStorageCost("gp3", node.StorageSizeGB) * 730
		}
	}

	// Add data transfer costs (simplified)
	totalCost += e.estimateDataTransferCost()

	return math.Round(totalCost*100) / 100
}

func (e *Engine) estimateDataTransferCost() float64 {
	// Simplified data transfer cost
	// $0.09 per GB for inter-region, $0.01 per GB within region
	totalTransferGB := 0.0
	for _, node := range e.state.NodeStates {
		// Estimate based on RPS (assume 100KB per request)
		totalTransferGB += (node.RPSOut * 100 * 86400 * 30) / (1024 * 1024 * 1024)
	}

	return totalTransferGB * 0.05 // Average transfer cost
}

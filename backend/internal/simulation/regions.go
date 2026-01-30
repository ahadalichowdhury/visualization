package simulation

import (
	"fmt"
)

// RegionLatencyMatrix defines real-world latency between AWS regions (in milliseconds)
// Based on actual AWS CloudPing data and production measurements
var RegionLatencyMatrix = map[string]map[string]float64{
	"us-east": {
		"us-east":      1.0,   // Same region
		"us-west":      60.0,  // Cross-US
		"eu-central":   85.0,  // US to Europe
		"eu-west":      75.0,  // US to Europe
		"ap-south":     200.0, // US to India
		"ap-southeast": 180.0, // US to Singapore
		"ap-northeast": 150.0, // US to Japan
	},
	"us-west": {
		"us-east":      60.0,
		"us-west":      1.0,
		"eu-central":   140.0,
		"eu-west":      130.0,
		"ap-south":     220.0,
		"ap-southeast": 120.0, // Closer to Asia from US West
		"ap-northeast": 100.0,
	},
	"eu-central": {
		"us-east":      85.0,
		"us-west":      140.0,
		"eu-central":   1.0,
		"eu-west":      15.0, // Within Europe
		"ap-south":     120.0,
		"ap-southeast": 160.0,
		"ap-northeast": 220.0,
	},
	"eu-west": {
		"us-east":      75.0,
		"us-west":      130.0,
		"eu-central":   15.0,
		"eu-west":      1.0,
		"ap-south":     110.0,
		"ap-southeast": 170.0,
		"ap-northeast": 230.0,
	},
	"ap-south": {
		"us-east":      200.0,
		"us-west":      220.0,
		"eu-central":   120.0,
		"eu-west":      110.0,
		"ap-south":     1.0,
		"ap-southeast": 50.0, // Within Asia
		"ap-northeast": 80.0,
	},
	"ap-southeast": {
		"us-east":      180.0,
		"us-west":      120.0,
		"eu-central":   160.0,
		"eu-west":      170.0,
		"ap-south":     50.0,
		"ap-southeast": 1.0,
		"ap-northeast": 60.0,
	},
	"ap-northeast": {
		"us-east":      150.0,
		"us-west":      100.0,
		"eu-central":   220.0,
		"eu-west":      230.0,
		"ap-south":     80.0,
		"ap-southeast": 60.0,
		"ap-northeast": 1.0,
	},
}

// DataTransferCost defines real-world data transfer costs (USD per GB)
// Based on AWS pricing as of 2024
var DataTransferCost = map[string]map[string]float64{
	"us-east": {
		"us-east":      0.00, // Free within same region
		"us-west":      0.02, // Cross-region within US
		"eu-central":   0.02, // US to Europe
		"eu-west":      0.02,
		"ap-south":     0.09, // US to Asia (expensive!)
		"ap-southeast": 0.09,
		"ap-northeast": 0.09,
	},
	"us-west": {
		"us-east":      0.02,
		"us-west":      0.00,
		"eu-central":   0.02,
		"eu-west":      0.02,
		"ap-south":     0.09,
		"ap-southeast": 0.09,
		"ap-northeast": 0.09,
	},
	"eu-central": {
		"us-east":      0.02,
		"us-west":      0.02,
		"eu-central":   0.00,
		"eu-west":      0.02, // Cross-region within Europe
		"ap-south":     0.09,
		"ap-southeast": 0.11, // Europe to Asia (most expensive!)
		"ap-northeast": 0.11,
	},
	"eu-west": {
		"us-east":      0.02,
		"us-west":      0.02,
		"eu-central":   0.02,
		"eu-west":      0.00,
		"ap-south":     0.09,
		"ap-southeast": 0.11,
		"ap-northeast": 0.11,
	},
	"ap-south": {
		"us-east":      0.09,
		"us-west":      0.09,
		"eu-central":   0.09,
		"eu-west":      0.09,
		"ap-south":     0.00,
		"ap-southeast": 0.08, // Within Asia
		"ap-northeast": 0.08,
	},
	"ap-southeast": {
		"us-east":      0.09,
		"us-west":      0.09,
		"eu-central":   0.11,
		"eu-west":      0.11,
		"ap-south":     0.08,
		"ap-southeast": 0.00,
		"ap-northeast": 0.08,
	},
	"ap-northeast": {
		"us-east":      0.09,
		"us-west":      0.09,
		"eu-central":   0.11,
		"eu-west":      0.11,
		"ap-south":     0.08,
		"ap-southeast": 0.08,
		"ap-northeast": 0.00,
	},
}

// GetRegionLatency returns the network latency between two regions
func GetRegionLatency(sourceRegion, targetRegion string) float64 {
	// Default to us-east if region not specified
	if sourceRegion == "" {
		sourceRegion = "us-east"
	}
	if targetRegion == "" {
		targetRegion = "us-east"
	}

	// Get latency from matrix
	if regionMap, ok := RegionLatencyMatrix[sourceRegion]; ok {
		if latency, ok := regionMap[targetRegion]; ok {
			return latency
		}
	}

	// Fallback: assume high latency if regions not found
	if sourceRegion == targetRegion {
		return 1.0
	}
	return 100.0 // Default cross-region latency
}

// GetDataTransferCost returns the cost per GB for data transfer between regions
func GetDataTransferCost(sourceRegion, targetRegion string) float64 {
	// Default to us-east if region not specified
	if sourceRegion == "" {
		sourceRegion = "us-east"
	}
	if targetRegion == "" {
		targetRegion = "us-east"
	}

	// Get cost from matrix
	if regionMap, ok := DataTransferCost[sourceRegion]; ok {
		if cost, ok := regionMap[targetRegion]; ok {
			return cost
		}
	}

	// Fallback: assume moderate cost if regions not found
	if sourceRegion == targetRegion {
		return 0.0
	}
	return 0.05 // Default cross-region cost
}

// IsCrossRegion checks if two nodes are in different regions
func IsCrossRegion(sourceRegion, targetRegion string) bool {
	if sourceRegion == "" {
		sourceRegion = "us-east"
	}
	if targetRegion == "" {
		targetRegion = "us-east"
	}
	return sourceRegion != targetRegion
}

// GetRegionInfo returns human-readable information about region latency
func GetRegionInfo(sourceRegion, targetRegion string) string {
	latency := GetRegionLatency(sourceRegion, targetRegion)
	cost := GetDataTransferCost(sourceRegion, targetRegion)

	if sourceRegion == targetRegion {
		return "Same region - optimal performance"
	}

	// Categorize latency
	latencyCategory := ""
	if latency < 20 {
		latencyCategory = "Low latency"
	} else if latency < 100 {
		latencyCategory = "Moderate latency"
	} else if latency < 200 {
		latencyCategory = "High latency"
	} else {
		latencyCategory = "Very high latency"
	}

	// Categorize cost
	costCategory := ""
	if cost < 0.03 {
		costCategory = "low cost"
	} else if cost < 0.09 {
		costCategory = "moderate cost"
	} else {
		costCategory = "high cost"
	}

	return latencyCategory + " (~" + formatFloat(latency) + "ms), " + costCategory + " ($" + formatFloat(cost) + "/GB)"
}

func formatFloat(f float64) string {
	if f < 10 {
		return fmt.Sprintf("%.1f", f)
	}
	return fmt.Sprintf("%.0f", f)
}

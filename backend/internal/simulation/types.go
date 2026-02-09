package simulation

import "time"

// WorkloadConfig defines the input traffic and patterns
type WorkloadConfig struct {
	RPS             int                `json:"rps"`
	ReadWriteRatio  ReadWriteRatio     `json:"readWriteRatio"`
	Mode            string             `json:"mode"` // "constant", "burst", "spike"
	Regions         []string           `json:"regions"`
	DurationSeconds int                `json:"durationSeconds"`
	AutoScaling     *AutoScalingConfig `json:"autoScaling,omitempty"`
	Failures        []FailureInjection `json:"failures,omitempty"`
}

// ReadWriteRatio defines read/write distribution
type ReadWriteRatio struct {
	Read  int `json:"read"`
	Write int `json:"write"`
}

// AutoScalingConfig defines auto-scaling rules
type AutoScalingConfig struct {
	Enabled         bool    `json:"enabled"`
	UpThreshold     float64 `json:"upThreshold"`
	DownThreshold   float64 `json:"downThreshold"`
	CooldownSeconds int     `json:"cooldownSeconds"`
	MinReplicas     int     `json:"minReplicas"`
	MaxReplicas     int     `json:"maxReplicas"`
}

// FailureInjection defines fault scenarios
type FailureInjection struct {
	Type      string `json:"type"` // "nodeFail", "regionFail", "cacheFail", "dbFail", "networkDelay"
	NodeID    string `json:"nodeId,omitempty"`
	Region    string `json:"region,omitempty"`
	DelayMs   int    `json:"delayMs,omitempty"`
	StartTick int    `json:"startTick,omitempty"`
	EndTick   int    `json:"endTick,omitempty"`
}

// SimulationInput contains the architecture and workload (enhanced for Module 5)
type SimulationInput struct {
	Nodes     []SimNode      `json:"nodes"`
	Edges     []SimEdge      `json:"edges"`
	Workload  WorkloadConfig `json:"workload"`
	SLAConfig *SLAConfig     `json:"slaConfig,omitempty"`
}

// SimNode represents a node in the architecture
type SimNode struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Data     SimNodeData            `json:"data"`
	Position map[string]interface{} `json:"position"`
}

// SimNodeData contains node configuration
type SimNodeData struct {
	Label    string                 `json:"label"`
	NodeType string                 `json:"nodeType"`
	Config   map[string]interface{} `json:"config"`
}

// SimEdge represents a connection between nodes
type SimEdge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

// SimulationOutput contains the results (enhanced for Module 5)
type SimulationOutput struct {
	Metrics       AggregateMetrics  `json:"metrics"`
	TimeSeries    []TimeSeriesPoint `json:"timeSeries"`
	Bottlenecks   []Bottleneck      `json:"bottlenecks"`
	SLAViolations []string          `json:"slaViolations"`
	CostMetrics   CostMetrics       `json:"costMetrics"`
	Duration      time.Duration     `json:"duration"`
	Success       bool              `json:"success"`
	Error         string            `json:"error,omitempty"`
}

// AggregateMetrics contains final metrics
type AggregateMetrics struct {
	Latency            LatencyMetrics     `json:"latency"`
	Throughput         float64            `json:"throughput"`
	ErrorRate          float64            `json:"errorRate"`
	CacheHitRate       float64            `json:"cacheHitRate"`
	QueueDepth         int                `json:"queueDepth"`
	TotalRequests      int                `json:"totalRequests"`
	SuccessfulRequests int                `json:"successfulRequests"`
	FailedRequests     int                `json:"failedRequests"`
	AutoscalingEvents  []AutoscalingEvent `json:"autoscalingEvents"`
}

// LatencyMetrics contains latency percentiles
type LatencyMetrics struct {
	P50 float64 `json:"p50"`
	P95 float64 `json:"p95"`
	P99 float64 `json:"p99"`
	Avg float64 `json:"avg"`
	Max float64 `json:"max"`
}

// TimeSeriesPoint represents metrics at a specific tick (enhanced for Module 5)
type TimeSeriesPoint struct {
	Tick               int                    `json:"tick"`
	IncomingRPS        float64                `json:"incomingRPS"`
	ThroughputRPS      float64                `json:"throughputRPS"`
	TotalRPS           float64                `json:"totalRPS"`
	Latency            LatencyMetrics         `json:"latency"`
	ErrorRatePercent   float64                `json:"errorRatePercent"`
	QueueDepth         int                    `json:"queueDepth"`
	QueueWaitTime      float64                `json:"queueWaitTime"`
	CacheHitRatio      float64                `json:"cacheHitRatio"`
	DropRate           float64                `json:"dropRate"`
	CPUUsagePercent    float64                `json:"cpuUsagePercent"`
	MemoryUsagePercent float64                `json:"memoryUsagePercent"`
	NetworkLatencyMs   float64                `json:"networkLatencyMs"`
	RegionLatencyMap   map[string]float64     `json:"regionLatencyMap"`
	RegionTrafficMap   map[string]float64     `json:"regionTrafficMap"`
	RegionErrorRateMap map[string]float64     `json:"regionErrorRateMap"` // Error rate percentage per region
	NodeMetrics        map[string]NodeMetrics `json:"nodeMetrics"`
	FailuresActive     []string               `json:"failuresActive"`
	SLAStatus          string                 `json:"slaStatus"`     // GOOD/WARNING/FAIL
	ScalingEvents      []AutoscalingEvent     `json:"scalingEvents"` // Auto-scaling events at this tick
}

// NodeMetrics represents detailed metrics for a single node
type NodeMetrics struct {
	NodeID         string  `json:"nodeId"`
	RPSIn          float64 `json:"rpsIn"`
	RPSOut         float64 `json:"rpsOut"`
	LatencyMs      float64 `json:"latencyMs"`
	CPUPercent     float64 `json:"cpuPercent"`
	MemPercent     float64 `json:"memPercent"`
	DiskIOPercent  float64 `json:"diskIOPercent,omitempty"`  // NEW: Disk I/O percentage
	NetworkPercent float64 `json:"networkPercent,omitempty"` // NEW: Network utilization
	Errors         int     `json:"errors"`
	QueueDepth     int     `json:"queueDepth"`
	CacheHitRate   float64 `json:"cacheHitRate"`
	Status         string  `json:"status"`               // normal/warning/danger/failed
	SuccessRate    float64 `json:"successRate"`          // percentage of successful requests (0-100)
	Replicas       int     `json:"replicas"`             // Current replica count (for auto-scaling visualization)
	Bottleneck     string  `json:"bottleneck,omitempty"` // "cpu", "memory", "disk", "network", "none"
}

// Bottleneck represents a detected performance bottleneck
type Bottleneck struct {
	NodeID      string   `json:"nodeId"`
	Issue       string   `json:"issue"`
	RootCause   string   `json:"rootCause"`
	Impact      string   `json:"impact"`
	Suggestions []string `json:"suggestions"`
	Severity    string   `json:"severity"` // low/medium/high/critical
}

// SLAConfig defines SLA targets
type SLAConfig struct {
	P95LatencyMs        float64 `json:"p95LatencyMs"`
	P99LatencyMs        float64 `json:"p99LatencyMs"`
	ErrorRatePercent    float64 `json:"errorRatePercent"`
	AvailabilityPercent float64 `json:"availabilityPercent"`
	MinThroughputRPS    float64 `json:"minThroughputRPS"`
}

// CostMetrics represents cost calculation
type CostMetrics struct {
	TotalCostUSD float64            `json:"totalCostUSD"`
	Compute      map[string]float64 `json:"compute"`
	Storage      map[string]float64 `json:"storage"`
	Network      map[string]float64 `json:"network"`
	PerRegion    map[string]float64 `json:"perRegion"`
}

// AutoscalingEvent records scaling events
type AutoscalingEvent struct {
	Tick     int    `json:"tick"`
	NodeID   string `json:"nodeId"`
	OldValue int    `json:"oldValue"`
	NewValue int    `json:"newValue"`
	Reason   string `json:"reason"`
}

// NodeState tracks runtime state of a node (enhanced for Module 5)
type NodeState struct {
	ID              string
	Type            string
	InstanceType    string // e.g., "c5.2xlarge", "db.m5.large"
	StorageType     string // e.g., "gp3", "io2" (NEW - for disk performance)
	LBType          string // e.g., "alb", "nlb"
	AccessType      string // e.g., "internal", "external" (NEW)
	CapacityRPS     float64
	BaseCapacityRPS float64 // ORIGINAL capacity (for restoring after throttle)
	BaseLatencyMS   float64 // ORIGINAL latency from hardware (never changes)
	LatencyMS       float64 // CURRENT latency (includes queueing, calculated each tick)
	Replicas        int
	StorageSizeGB   float64
	TTL             int
	Consistency     string
	Region          string
	CurrentLoad     float64
	RPSIn           float64
	RPSOut          float64
	QueueDepth      int
	MaxQueueDepth   int
	CacheHitRate    float64
	CPUUsage        float64
	MemoryUsage     float64
	DiskIOUsage     float64 // NEW - for disk I/O tracking
	ErrorCount      int
	Failed          bool
	Partitioned     bool // NEW - Network partition (drops all outgoing traffic)
	ReadRatio       int  // Percentage of operations that are reads (0-100)
}

// SimulationState tracks the entire simulation state (enhanced for Module 5)
type SimulationState struct {
	Tick               int
	CurrentWorkloadRPS float64
	NodeStates         map[string]*NodeState
	EdgeMap            map[string][]string // source -> targets
	ReverseEdgeMap     map[string][]string // target -> sources
	LatencyHistory     []float64
	ThroughputHistory  []float64
	ErrorHistory       []int
	QueueHistory       []int
	TotalRequests      int
	SuccessRequests    int
	FailedRequests     int
	DroppedRequests    int
	CacheHits          int
	CacheMisses        int
	ActiveFailures     []string
	RegionLatency      map[string][]float64
	RegionTraffic      map[string]float64
}

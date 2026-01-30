import type { Edge, Node } from "reactflow";

export interface WorkloadConfig {
  rps: number;
  readWriteRatio: {
    read: number;
    write: number;
  };
  mode: "constant" | "burst" | "spike";
  regions: string[];
  durationSeconds: number;
  autoScaling?: AutoScalingConfig;
  failures?: FailureInjection[];
}

export interface AutoScalingConfig {
  enabled: boolean;
  upThreshold: number;
  downThreshold: number;
  cooldownSeconds: number;
  minReplicas: number;
  maxReplicas: number;
}

export interface FailureInjection {
  type: "nodeFail" | "regionFail" | "cacheFail" | "dbFail" | "networkDelay";
  nodeId?: string;
  region?: string;
  delayMs?: number;
  startTick?: number;
  endTick?: number;
}

export interface SimulationInput {
  nodes: Node[];
  edges: Edge[];
  workload: WorkloadConfig;
  slaConfig?: SLAConfig;
}

export interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
}

export interface AggregateMetrics {
  latency: LatencyMetrics;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  queueDepth: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  autoscalingEvents: AutoscalingEvent[];
}

export interface TimeSeriesPoint {
  tick: number;
  incomingRPS: number;
  throughputRPS: number;
  totalRPS: number;
  latency: LatencyMetrics;
  errorRatePercent: number;
  queueDepth: number;
  queueWaitTime: number;
  cacheHitRatio: number;
  dropRate: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  networkLatencyMs: number;
  regionLatencyMap: Record<string, number>;
  regionTrafficMap: Record<string, number>;
  regionErrorRateMap: Record<string, number>; // Error rate percentage per region
  nodeMetrics: Record<string, NodeMetrics>;
  failuresActive: string[];
  slaStatus: string; // GOOD/WARNING/FAIL
  scalingEvents: AutoscalingEvent[]; // Auto-scaling events at this tick
}

export interface NodeMetrics {
  nodeId: string;
  rpsIn: number;
  rpsOut: number;
  latencyMs: number;
  cpuPercent: number;
  memPercent: number;
  diskIOPercent?: number; // NEW: Disk I/O percentage (0-100)
  networkPercent?: number; // NEW: Network utilization percentage (0-100)
  errors: number;
  queueDepth: number;
  cacheHitRate: number;
  status: string; // normal/warning/danger/failed
  successRate?: number; // percentage of successful requests (0-100)
  replicas: number; // Current replica count (for auto-scaling visualization)
}

export interface Bottleneck {
  nodeId: string;
  issue: string;
  rootCause: string;
  impact: string;
  suggestions: string[];
  severity: string; // low/medium/high/critical
}

export interface SLAConfig {
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  availabilityPercent: number;
  minThroughputRPS: number;
}

export interface CostMetrics {
  totalCostUSD: number;
  compute: Record<string, number>;
  storage: Record<string, number>;
  network: Record<string, number>;
  perRegion: Record<string, number>;
}

export interface AutoscalingEvent {
  tick: number;
  nodeId: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface SimulationOutput {
  metrics: AggregateMetrics;
  timeSeries: TimeSeriesPoint[];
  bottlenecks: Bottleneck[];
  slaViolations: string[];
  costMetrics: CostMetrics;
  duration: number;
  success: boolean;
  error?: string;
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  workload: WorkloadConfig;
}

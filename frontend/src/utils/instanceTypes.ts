// Real-world instance types and their performance characteristics

export interface InstanceType {
  id: string;
  name: string;
  category: string;
  vcpu: number;
  memory: number; // GB
  network: string;
  capacityRPS: number; // Calculated based on specs
  latencyMs: number; // Base latency
  costPerHour: number; // USD
  description: string;
}

// Compute Instance Types (AWS-like)
export const COMPUTE_INSTANCES: InstanceType[] = [
  // Burstable - Development/Low traffic
  {
    id: "t3.micro",
    name: "t3.micro",
    category: "Burstable",
    vcpu: 2,
    memory: 1,
    network: "Low to Moderate",
    capacityRPS: 100,
    latencyMs: 50,
    costPerHour: 0.0104,
    description: "Dev/testing",
  },
  {
    id: "t3.small",
    name: "t3.small",
    category: "Burstable",
    vcpu: 2,
    memory: 2,
    network: "Low to Moderate",
    capacityRPS: 250,
    latencyMs: 40,
    costPerHour: 0.0208,
    description: "Small apps",
  },
  {
    id: "t3.medium",
    name: "t3.medium",
    category: "Burstable",
    vcpu: 2,
    memory: 4,
    network: "Low to Moderate",
    capacityRPS: 500,
    latencyMs: 35,
    costPerHour: 0.0416,
    description: "Medium traffic",
  },

  // General Purpose - Production
  {
    id: "m5.large",
    name: "m5.large",
    category: "General Purpose",
    vcpu: 2,
    memory: 8,
    network: "Up to 10 Gbps",
    capacityRPS: 1000,
    latencyMs: 25,
    costPerHour: 0.096,
    description: "Balanced compute",
  },
  {
    id: "m5.xlarge",
    name: "m5.xlarge",
    category: "General Purpose",
    vcpu: 4,
    memory: 16,
    network: "Up to 10 Gbps",
    capacityRPS: 2500,
    latencyMs: 20,
    costPerHour: 0.192,
    description: "High traffic",
  },
  {
    id: "m5.2xlarge",
    name: "m5.2xlarge",
    category: "General Purpose",
    vcpu: 8,
    memory: 32,
    network: "Up to 10 Gbps",
    capacityRPS: 5000,
    latencyMs: 15,
    costPerHour: 0.384,
    description: "Very high traffic",
  },
  {
    id: "m5.4xlarge",
    name: "m5.4xlarge",
    category: "General Purpose",
    vcpu: 16,
    memory: 64,
    network: "10 Gbps",
    capacityRPS: 10000,
    latencyMs: 12,
    costPerHour: 0.768,
    description: "Enterprise scale",
  },

  // Compute Optimized - CPU intensive
  {
    id: "c5.large",
    name: "c5.large",
    category: "Compute Optimized",
    vcpu: 2,
    memory: 4,
    network: "Up to 10 Gbps",
    capacityRPS: 1500,
    latencyMs: 18,
    costPerHour: 0.085,
    description: "CPU intensive",
  },
  {
    id: "c5.xlarge",
    name: "c5.xlarge",
    category: "Compute Optimized",
    vcpu: 4,
    memory: 8,
    network: "Up to 10 Gbps",
    capacityRPS: 3500,
    latencyMs: 15,
    costPerHour: 0.17,
    description: "High compute",
  },
  {
    id: "c5.2xlarge",
    name: "c5.2xlarge",
    category: "Compute Optimized",
    vcpu: 8,
    memory: 16,
    network: "Up to 10 Gbps",
    capacityRPS: 7000,
    latencyMs: 12,
    costPerHour: 0.34,
    description: "Very high compute",
  },
];

// Database Instance Types
export const DATABASE_INSTANCES: InstanceType[] = [
  {
    id: "db.t3.micro",
    name: "db.t3.micro",
    category: "Burstable",
    vcpu: 2,
    memory: 1,
    network: "Low",
    capacityRPS: 50,
    latencyMs: 100,
    costPerHour: 0.017,
    description: "Dev/testing DB",
  },
  {
    id: "db.t3.small",
    name: "db.t3.small",
    category: "Burstable",
    vcpu: 2,
    memory: 2,
    network: "Low",
    capacityRPS: 100,
    latencyMs: 80,
    costPerHour: 0.034,
    description: "Small DB",
  },
  {
    id: "db.t3.medium",
    name: "db.t3.medium",
    category: "Burstable",
    vcpu: 2,
    memory: 4,
    network: "Moderate",
    capacityRPS: 200,
    latencyMs: 60,
    costPerHour: 0.068,
    description: "Medium DB",
  },
  {
    id: "db.m5.large",
    name: "db.m5.large",
    category: "General Purpose",
    vcpu: 2,
    memory: 8,
    network: "Up to 10 Gbps",
    capacityRPS: 500,
    latencyMs: 40,
    costPerHour: 0.146,
    description: "Production DB",
  },
  {
    id: "db.m5.xlarge",
    name: "db.m5.xlarge",
    category: "General Purpose",
    vcpu: 4,
    memory: 16,
    network: "Up to 10 Gbps",
    capacityRPS: 1000,
    latencyMs: 30,
    costPerHour: 0.292,
    description: "High traffic DB",
  },
  {
    id: "db.r5.large",
    name: "db.r5.large",
    category: "Memory Optimized",
    vcpu: 2,
    memory: 16,
    network: "Up to 10 Gbps",
    capacityRPS: 800,
    latencyMs: 25,
    costPerHour: 0.24,
    description: "Memory intensive",
  },
  {
    id: "db.r5.xlarge",
    name: "db.r5.xlarge",
    category: "Memory Optimized",
    vcpu: 4,
    memory: 32,
    network: "Up to 10 Gbps",
    capacityRPS: 1500,
    latencyMs: 20,
    costPerHour: 0.48,
    description: "Large memory DB",
  },
  {
    id: "db.r5.2xlarge",
    name: "db.r5.2xlarge",
    category: "Memory Optimized",
    vcpu: 8,
    memory: 64,
    network: "Up to 10 Gbps",
    capacityRPS: 3000,
    latencyMs: 15,
    costPerHour: 0.96,
    description: "Enterprise DB",
  },
];

// Cache Instance Types (Redis/Memcached)
export const CACHE_INSTANCES: InstanceType[] = [
  {
    id: "cache.t3.micro",
    name: "cache.t3.micro",
    category: "Cache",
    vcpu: 2,
    memory: 0.5,
    network: "Low",
    capacityRPS: 5000,
    latencyMs: 5,
    costPerHour: 0.017,
    description: "Small cache",
  },
  {
    id: "cache.t3.small",
    name: "cache.t3.small",
    category: "Cache",
    vcpu: 2,
    memory: 1.37,
    network: "Low",
    capacityRPS: 10000,
    latencyMs: 3,
    costPerHour: 0.034,
    description: "Medium cache",
  },
  {
    id: "cache.m5.large",
    name: "cache.m5.large",
    category: "Cache",
    vcpu: 2,
    memory: 6.38,
    network: "Up to 10 Gbps",
    capacityRPS: 25000,
    latencyMs: 2,
    costPerHour: 0.136,
    description: "Production cache",
  },
  {
    id: "cache.m5.xlarge",
    name: "cache.m5.xlarge",
    category: "Cache",
    vcpu: 4,
    memory: 12.93,
    network: "Up to 10 Gbps",
    capacityRPS: 50000,
    latencyMs: 1,
    costPerHour: 0.272,
    description: "High perf cache",
  },
  {
    id: "cache.r5.large",
    name: "cache.r5.large",
    category: "Cache",
    vcpu: 2,
    memory: 13.07,
    network: "Up to 10 Gbps",
    capacityRPS: 40000,
    latencyMs: 2,
    costPerHour: 0.252,
    description: "Large cache",
  },
  {
    id: "cache.r5.xlarge",
    name: "cache.r5.xlarge",
    category: "Cache",
    vcpu: 4,
    memory: 26.32,
    network: "Up to 10 Gbps",
    capacityRPS: 80000,
    latencyMs: 1,
    costPerHour: 0.504,
    description: "Enterprise cache",
  },
];

// Storage Types
export interface StorageType {
  id: string;
  name: string;
  type: "SSD" | "HDD" | "NVMe";
  iopsPerGB: number;
  throughputMBps: number;
  latencyMs: number;
  costPerGBMonth: number;
  description: string;
}

export const STORAGE_TYPES: StorageType[] = [
  {
    id: "gp3",
    name: "General Purpose SSD (gp3)",
    type: "SSD",
    iopsPerGB: 3,
    throughputMBps: 125,
    latencyMs: 10,
    costPerGBMonth: 0.08,
    description: "Balanced price/performance",
  },
  {
    id: "io2",
    name: "Provisioned IOPS SSD (io2)",
    type: "SSD",
    iopsPerGB: 50,
    throughputMBps: 1000,
    latencyMs: 3,
    costPerGBMonth: 0.125,
    description: "High performance",
  },
  {
    id: "st1",
    name: "Throughput Optimized HDD (st1)",
    type: "HDD",
    iopsPerGB: 0.5,
    throughputMBps: 500,
    latencyMs: 30,
    costPerGBMonth: 0.045,
    description: "Big data, data warehouse",
  },
  {
    id: "sc1",
    name: "Cold HDD (sc1)",
    type: "HDD",
    iopsPerGB: 0.25,
    throughputMBps: 250,
    latencyMs: 50,
    costPerGBMonth: 0.015,
    description: "Infrequent access",
  },
];

// Load Balancer Types
export interface LoadBalancerType {
  id: string;
  name: string;
  maxConnections: number;
  capacityRPS: number;
  latencyMs: number;
  costPerHour: number;
  description: string;
}

export const LOAD_BALANCER_TYPES: LoadBalancerType[] = [
  {
    id: "alb",
    name: "Application Load Balancer",
    maxConnections: 100000,
    capacityRPS: 50000,
    latencyMs: 5,
    costPerHour: 0.0225,
    description: "HTTP/HTTPS traffic",
  },
  {
    id: "nlb",
    name: "Network Load Balancer",
    maxConnections: 1000000,
    capacityRPS: 500000,
    latencyMs: 1,
    costPerHour: 0.0225,
    description: "TCP/UDP, ultra-low latency",
  },
  {
    id: "classic",
    name: "Classic Load Balancer",
    maxConnections: 50000,
    capacityRPS: 25000,
    latencyMs: 10,
    costPerHour: 0.025,
    description: "Legacy, basic balancing",
  },
];

// Helper function to get instance by ID
export const getInstanceType = (
  instanceId: string,
  category: "compute" | "database" | "cache"
): InstanceType | undefined => {
  switch (category) {
    case "compute":
      return COMPUTE_INSTANCES.find((i) => i.id === instanceId);
    case "database":
      return DATABASE_INSTANCES.find((i) => i.id === instanceId);
    case "cache":
      return CACHE_INSTANCES.find((i) => i.id === instanceId);
  }
};

export const getStorageType = (storageId: string): StorageType | undefined => {
  return STORAGE_TYPES.find((s) => s.id === storageId);
};

export const getLoadBalancerType = (
  lbId: string
): LoadBalancerType | undefined => {
  return LOAD_BALANCER_TYPES.find((lb) => lb.id === lbId);
};

// Queue / Message Broker Types
export interface QueueType {
  id: string;
  name: string;
  maxMessages: number;
  throughputMsgsPerSec: number;
  latencyMs: number;
  costPerMillionRequests: number;
  description: string;
}

export const QUEUE_TYPES: QueueType[] = [
  {
    id: "sqs-standard",
    name: "SQS Standard",
    maxMessages: 120000,
    throughputMsgsPerSec: 3000,
    latencyMs: 10,
    costPerMillionRequests: 0.4,
    description: "At-least-once delivery",
  },
  {
    id: "sqs-fifo",
    name: "SQS FIFO",
    maxMessages: 20000,
    throughputMsgsPerSec: 300,
    latencyMs: 15,
    costPerMillionRequests: 0.5,
    description: "Exactly-once, ordered",
  },
  {
    id: "rabbitmq-small",
    name: "RabbitMQ (Small)",
    maxMessages: 50000,
    throughputMsgsPerSec: 2000,
    latencyMs: 5,
    costPerMillionRequests: 0.3,
    description: "t3.medium equivalent",
  },
  {
    id: "rabbitmq-large",
    name: "RabbitMQ (Large)",
    maxMessages: 200000,
    throughputMsgsPerSec: 10000,
    latencyMs: 3,
    costPerMillionRequests: 0.5,
    description: "m5.xlarge equivalent",
  },
  {
    id: "kafka-small",
    name: "Kafka (Small)",
    maxMessages: 1000000,
    throughputMsgsPerSec: 10000,
    latencyMs: 2,
    costPerMillionRequests: 0.2,
    description: "3 brokers, m5.large",
  },
  {
    id: "kafka-large",
    name: "Kafka (Large)",
    maxMessages: 10000000,
    throughputMsgsPerSec: 50000,
    latencyMs: 1,
    costPerMillionRequests: 0.15,
    description: "6 brokers, m5.xlarge",
  },
];

// CDN Types
export interface CDNType {
  id: string;
  name: string;
  edgeLocations: number;
  throughputGbps: number;
  latencyMs: number;
  costPerGB: number;
  description: string;
}

export const CDN_TYPES: CDNType[] = [
  {
    id: "cloudfront-basic",
    name: "CloudFront (Basic)",
    edgeLocations: 200,
    throughputGbps: 100,
    latencyMs: 80,
    costPerGB: 0.085,
    description: "Standard distribution",
  },
  {
    id: "cloudfront-premium",
    name: "CloudFront (Premium)",
    edgeLocations: 400,
    throughputGbps: 500,
    latencyMs: 30,
    costPerGB: 0.12,
    description: "Low-latency, more edges",
  },
  {
    id: "akamai",
    name: "Akamai CDN",
    edgeLocations: 4000,
    throughputGbps: 1000,
    latencyMs: 20,
    costPerGB: 0.15,
    description: "Enterprise CDN",
  },
  {
    id: "custom-cdn",
    name: "Custom CDN",
    edgeLocations: 50,
    throughputGbps: 50,
    latencyMs: 100,
    costPerGB: 0.05,
    description: "Self-hosted",
  },
];

// Object Storage Types
export interface ObjectStorageType {
  id: string;
  name: string;
  storageClass: string;
  availability: string;
  latencyMs: number;
  costPerGBMonth: number;
  retrievalCost: number;
  description: string;
}

export const OBJECT_STORAGE_TYPES: ObjectStorageType[] = [
  {
    id: "s3-standard",
    name: "S3 Standard",
    storageClass: "Standard",
    availability: "99.99%",
    latencyMs: 100,
    costPerGBMonth: 0.023,
    retrievalCost: 0,
    description: "Frequent access",
  },
  {
    id: "s3-ia",
    name: "S3 Infrequent Access",
    storageClass: "IA",
    availability: "99.9%",
    latencyMs: 100,
    costPerGBMonth: 0.0125,
    retrievalCost: 0.01,
    description: "Less frequent access",
  },
  {
    id: "s3-glacier",
    name: "S3 Glacier",
    storageClass: "Glacier",
    availability: "99.99%",
    latencyMs: 3600000,
    costPerGBMonth: 0.004,
    retrievalCost: 0.02,
    description: "Archive, hours retrieval",
  },
  {
    id: "s3-intelligent",
    name: "S3 Intelligent-Tiering",
    storageClass: "Intelligent",
    availability: "99.9%",
    latencyMs: 100,
    costPerGBMonth: 0.023,
    retrievalCost: 0,
    description: "Auto-optimization",
  },
];

// Search Engine Types
export interface SearchType {
  id: string;
  name: string;
  vcpu: number;
  memory: number;
  storageGB: number;
  queriesPerSec: number;
  latencyMs: number;
  costPerHour: number;
  description: string;
}

export const SEARCH_TYPES: SearchType[] = [
  {
    id: "es-small",
    name: "Elasticsearch (Small)",
    vcpu: 2,
    memory: 4,
    storageGB: 100,
    queriesPerSec: 500,
    latencyMs: 50,
    costPerHour: 0.1,
    description: "t3.medium equivalent",
  },
  {
    id: "es-medium",
    name: "Elasticsearch (Medium)",
    vcpu: 4,
    memory: 16,
    storageGB: 500,
    queriesPerSec: 2000,
    latencyMs: 30,
    costPerHour: 0.3,
    description: "m5.xlarge equivalent",
  },
  {
    id: "es-large",
    name: "Elasticsearch (Large)",
    vcpu: 8,
    memory: 32,
    storageGB: 1000,
    queriesPerSec: 5000,
    latencyMs: 20,
    costPerHour: 0.6,
    description: "m5.2xlarge equivalent",
  },
];

// Helper functions
export const getQueueType = (queueId: string): QueueType | undefined => {
  return QUEUE_TYPES.find((q) => q.id === queueId);
};

export const getCDNType = (cdnId: string): CDNType | undefined => {
  return CDN_TYPES.find((c) => c.id === cdnId);
};

export const getObjectStorageType = (
  storageId: string
): ObjectStorageType | undefined => {
  return OBJECT_STORAGE_TYPES.find((s) => s.id === storageId);
};

export const getSearchType = (searchId: string): SearchType | undefined => {
  return SEARCH_TYPES.find((s) => s.id === searchId);
};

// Region pricing multipliers (based on AWS actual pricing)
export interface RegionPricing {
  id: string;
  name: string;
  computeMultiplier: number; // Multiplier for EC2/compute costs
  storageMultiplier: number; // Multiplier for storage costs
  transferCostPerGB: number; // Data transfer out cost
}

export const REGION_PRICING: RegionPricing[] = [
  {
    id: "us-east",
    name: "US East (N. Virginia)",
    computeMultiplier: 1.0,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.09,
  },
  {
    id: "us-west",
    name: "US West (Oregon)",
    computeMultiplier: 1.0,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.09,
  },
  {
    id: "eu-central",
    name: "EU Central (Frankfurt)",
    computeMultiplier: 1.12,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.09,
  },
  {
    id: "eu-west",
    name: "EU West (Ireland)",
    computeMultiplier: 1.08,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.09,
  },
  {
    id: "ap-south",
    name: "Asia Pacific (Mumbai)",
    computeMultiplier: 0.9,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.109,
  },
  {
    id: "ap-southeast",
    name: "Asia Pacific (Singapore)",
    computeMultiplier: 1.1,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.12,
  },
  {
    id: "ap-northeast",
    name: "Asia Pacific (Tokyo)",
    computeMultiplier: 1.15,
    storageMultiplier: 1.0,
    transferCostPerGB: 0.114,
  },
];

export const getRegionPricing = (regionId: string): RegionPricing => {
  return REGION_PRICING.find((r) => r.id === regionId) || REGION_PRICING[0];
};

// Reserved instance pricing (percentage of on-demand)
export const RESERVED_PRICING = {
  onDemand: 1.0, // 100% of on-demand price
  reserved1Year: 0.6, // 40% discount
  reserved3Year: 0.4, // 60% discount
};

// Data transfer tiers (AWS pricing)
export const DATA_TRANSFER_TIERS = [
  { upToGB: 10240, pricePerGB: 0.09 }, // First 10 TB
  { upToGB: 51200, pricePerGB: 0.085 }, // Next 40 TB
  { upToGB: 153600, pricePerGB: 0.07 }, // Next 100 TB
  { upToGB: Infinity, pricePerGB: 0.05 }, // Over 150 TB
];

export const calculateDataTransferCost = (
  transferGB: number
): number => {
  let cost = 0;
  let remaining = transferGB;
  let processed = 0;

  for (const tier of DATA_TRANSFER_TIERS) {
    const tierSize = tier.upToGB - processed;
    const amount = Math.min(remaining, tierSize);
    cost += amount * tier.pricePerGB;
    remaining -= amount;
    processed += amount;
    if (remaining <= 0) break;
  }

  return cost;
};

import { NodeConfig } from "../types/builder.types";
import {
  getCDNType,
  getInstanceType,
  getLoadBalancerType,
  getObjectStorageType,
  getQueueType,
  getSearchType,
  getStorageType,
} from "./instanceTypes";

/**
 * Calculate performance metrics based on real-world configuration
 */
export const calculateNodePerformance = (
  nodeType: string,
  config: NodeConfig
): { capacity_rps: number; latency_ms: number } => {
  let capacityRPS = 1000; // Default fallback
  let latencyMs = 20; // Default fallback

  // Determine node category
  const isCompute = [
    "api_server",
    "web_server",
    "microservice",
    "worker",
    "ml_model",
  ].includes(nodeType);

  const isService = [
    "auth_service",
    "notification",
    "email_service",
    "payment_gateway",
    "analytics_service",
    "monitoring",
    "logging",
    "container_orchestration",
    "service_mesh",
  ].includes(nodeType);

  const isDatabase = [
    "database_sql",
    "database_nosql",
    "database_graph",
    "database_timeseries",
  ].includes(nodeType);
  const isCache = ["cache_redis", "cache_memcached"].includes(nodeType);
  const isLoadBalancer = ["load_balancer", "api_gateway"].includes(nodeType);
  const isQueue = ["queue", "message_broker", "event_bus"].includes(nodeType);
  const isCDN = ["cdn"].includes(nodeType);
  const isObjectStorage = ["object_storage", "file_storage"].includes(nodeType);
  const isSearch = ["search", "elasticsearch"].includes(nodeType);

  // Compute instances (including service components)
  if ((isCompute || isService) && config.instanceType) {
    const instance = getInstanceType(config.instanceType, "compute");
    if (instance) {
      capacityRPS = instance.capacityRPS;
      latencyMs = instance.latencyMs;
    }
  }

  // Database instances
  if (isDatabase && config.instanceType) {
    const instance = getInstanceType(config.instanceType, "database");
    if (instance) {
      capacityRPS = instance.capacityRPS;
      latencyMs = instance.latencyMs;

      // Adjust for storage type
      if (config.storageType) {
        const storage = getStorageType(config.storageType);
        if (storage) {
          latencyMs = latencyMs * (storage.latencyMs / 10); // Normalized to gp3 baseline
        }
      }
    }
  }

  // Cache instances
  if (isCache && config.instanceType) {
    const instance = getInstanceType(config.instanceType, "cache");
    if (instance) {
      capacityRPS = instance.capacityRPS;
      latencyMs = instance.latencyMs;
    }
  }

  // Load balancers
  if (isLoadBalancer && config.lbType) {
    const lb = getLoadBalancerType(config.lbType);
    if (lb) {
      capacityRPS = lb.capacityRPS;
      latencyMs = lb.latencyMs;
    }
  }

  // Queues
  if (isQueue && config.queueType) {
    const queue = getQueueType(config.queueType);
    if (queue) {
      capacityRPS = queue.throughputMsgsPerSec;
      latencyMs = queue.latencyMs;
    }
  }

  // CDN
  if (isCDN && config.cdnType) {
    const cdn = getCDNType(config.cdnType);
    if (cdn) {
      capacityRPS = cdn.throughputGbps * 1000; // Convert Gbps to rough RPS estimate
      latencyMs = cdn.latencyMs;
    }
  }

  // Object Storage
  if (isObjectStorage && config.objectStorageType) {
    const storage = getObjectStorageType(config.objectStorageType);
    if (storage) {
      capacityRPS = 1000; // S3 can handle high RPS
      latencyMs = storage.latencyMs / 1000; // Convert to ms if needed
    }
  }

  // Search engines
  if (isSearch && config.searchType) {
    const search = getSearchType(config.searchType);
    if (search) {
      capacityRPS = search.queriesPerSec;
      latencyMs = search.latencyMs;
    }
  }

  // Defaults if nothing configured
  if (
    !config.instanceType &&
    !config.lbType &&
    !config.queueType &&
    !config.cdnType &&
    !config.objectStorageType &&
    !config.searchType
  ) {
    if (isCompute) {
      capacityRPS = 1000;
      latencyMs = 25;
    } else if (isDatabase) {
      capacityRPS = 500;
      latencyMs = 40;
    } else if (isCache) {
      capacityRPS = 10000;
      latencyMs = 2;
    } else if (isLoadBalancer) {
      capacityRPS = 50000;
      latencyMs = 5;
    } else if (isQueue) {
      capacityRPS = 3000;
      latencyMs = 10;
    } else if (isCDN) {
      capacityRPS = 100000;
      latencyMs = 50;
    } else if (isObjectStorage) {
      capacityRPS = 1000;
      latencyMs = 100;
    } else if (isSearch) {
      capacityRPS = 500;
      latencyMs = 50;
    }
  }

  return { capacity_rps: capacityRPS, latency_ms: latencyMs };
};

/**
 * Get default configuration for a node type
 */
export const getDefaultConfig = (nodeType: string): Partial<NodeConfig> => {
  const isCompute = [
    "api_server",
    "web_server",
    "microservice",
    "worker",
    "ml_model",
  ].includes(nodeType);

  const isService = [
    "auth_service",
    "notification",
    "email_service",
    "payment_gateway",
    "analytics_service",
    "monitoring",
    "logging",
    "container_orchestration",
    "service_mesh",
  ].includes(nodeType);

  const isDatabase = [
    "database_sql",
    "database_nosql",
    "database_graph",
    "database_timeseries",
  ].includes(nodeType);
  const isCache = ["cache_redis", "cache_memcached"].includes(nodeType);
  const isLoadBalancer = ["load_balancer", "api_gateway"].includes(nodeType);
  const isQueue = ["queue", "message_broker", "event_bus"].includes(nodeType);
  const isCDN = ["cdn"].includes(nodeType);
  const isObjectStorage = ["object_storage", "file_storage"].includes(nodeType);
  const isSearch = ["search", "elasticsearch"].includes(nodeType);

  const baseConfig: Partial<NodeConfig> = {
    region: "us-east",
    replicas: 1,
  };

  if (isCompute || isService) {
    return { ...baseConfig, instanceType: "t3.medium" };
  }
  if (isDatabase) {
    return {
      ...baseConfig,
      instanceType: "db.t3.medium",
      storageType: "gp3",
      storage_size_gb: 100,
      consistency: "strong",
      readRatio: 80, // Default 80% reads / 20% writes
    };
  }
  if (isCache) {
    return {
      ...baseConfig,
      instanceType: "cache.t3.small",
      ttl_ms: 3600000,
      readRatio: 90, // Caches are usually read-heavy
    };
  }
  if (isLoadBalancer) {
    return { ...baseConfig, lbType: "alb", accessType: "external" };
  }
  if (isQueue) {
    return { ...baseConfig, queueType: "sqs-standard" };
  }
  if (isCDN) {
    return { ...baseConfig, cdnType: "cloudfront-basic" };
  }
  if (isObjectStorage) {
    return {
      ...baseConfig,
      objectStorageType: "s3-standard",
      storage_size_gb: 1000,
    };
  }
  if (isSearch) {
    return { ...baseConfig, searchType: "es-small" };
  }

  return baseConfig;
};

/**
 * Get configuration fields applicable for a node type
 */
export const getConfigFields = (nodeType: string): string[] => {
  const isCompute = [
    "api_server",
    "web_server",
    "microservice",
    "worker",
    "ml_model", // ML models run on compute instances
  ].includes(nodeType);

  // Service components (also run on compute instances!)
  const isService = [
    "auth_service",
    "notification",
    "email_service",
    "payment_gateway",
    "analytics_service",
    "monitoring",
    "logging",
    "container_orchestration", // K8s control plane
    "service_mesh", // Istio control plane
  ].includes(nodeType);

  const isDatabase = [
    "database_sql",
    "database_nosql",
    "database_graph",
    "database_timeseries",
  ].includes(nodeType);
  const isCache = ["cache_redis", "cache_memcached"].includes(nodeType);
  const isLoadBalancer = ["load_balancer", "api_gateway"].includes(nodeType);
  const isQueue = ["queue", "message_broker", "event_bus"].includes(nodeType);
  const isCDN = ["cdn"].includes(nodeType);
  const isObjectStorage = ["object_storage", "file_storage"].includes(nodeType);
  const isSearch = ["search", "elasticsearch"].includes(nodeType);

  // Client types (users can connect from ANY region, not just one!)
  const isClient = ["client", "mobile_app", "web_browser"].includes(nodeType);

  // Common fields for server components (region matters for servers!)
  const common = ["region", "replicas"];

  // Client components don't need region (users are everywhere!)
  const clientCommon = ["replicas"];

  if (isClient) return clientCommon; // No region for clients!
  if (isCompute || isService) return [...common, "instanceType"]; // All compute-based services
  if (isDatabase)
    return [
      ...common,
      "instanceType",
      "storageType",
      "storage_size_gb",
      "readRatio",
      "consistency",
    ];
  if (isCache) return [...common, "instanceType", "ttl_ms", "readRatio"];
  if (isLoadBalancer) return ["region", "lbType", "accessType"];
  if (isQueue) return ["region", "queueType"];
  if (isCDN) return ["cdnType"];
  if (isObjectStorage)
    return ["region", "objectStorageType", "storage_size_gb"];
  if (nodeType === "subnet") return ["region"]; // Subnets just need a region
  if (isSearch) return [...common, "searchType"];

  return common;
};

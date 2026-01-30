import { NodeConfig } from "../types/builder.types";
import {
  calculateDataTransferCost,
  getCDNType,
  getInstanceType,
  getLoadBalancerType,
  getObjectStorageType,
  getQueueType,
  getRegionPricing,
  getSearchType,
  getStorageType,
  RESERVED_PRICING,
} from "./instanceTypes";

export interface CostBreakdown {
  // Hourly costs
  computeHourly: {
    onDemand: number;
    reserved1Year: number;
    reserved3Year: number;
  };
  storageMonthly: number;
  transferMonthly: number; // Estimated based on average traffic

  // Monthly totals
  monthlyTotal: {
    onDemand: number;
    reserved1Year: number;
    reserved3Year: number;
  };

  // Breakdown details
  details: {
    instanceCost: number;
    storageCost: number;
    transferCost: number;
    region: string;
    replicas: number;
  };
}

/**
 * Calculate comprehensive cost breakdown for a component
 */
export const calculateComponentCost = (
  nodeType: string,
  config: NodeConfig,
  estimatedMonthlyTrafficGB: number = 0,
): CostBreakdown => {
  const region = config.region || "us-east";
  const replicas = config.replicas || 1;
  const regionPricing = getRegionPricing(region);

  let hourlyComputeCost = 0;
  let monthlyStorageCost = 0;

  // Compute costs
  const isCompute = [
    "api_server",
    "web_server",
    "microservice",
    "worker",
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

  // Calculate compute costs
  if (config.instanceType) {
    let instance;
    if (isCompute) {
      instance = getInstanceType(config.instanceType, "compute");
    } else if (isDatabase) {
      instance = getInstanceType(config.instanceType, "database");
    } else if (isCache) {
      instance = getInstanceType(config.instanceType, "cache");
    }

    if (instance) {
      hourlyComputeCost =
        instance.costPerHour * regionPricing.computeMultiplier * replicas;
    }
  }

  // Load balancer costs
  if (isLoadBalancer && config.lbType) {
    const lb = getLoadBalancerType(config.lbType);
    if (lb) {
      hourlyComputeCost = lb.costPerHour * regionPricing.computeMultiplier;
    }
  }

  // Queue costs (per million requests, convert to monthly estimate)
  if (isQueue && config.queueType) {
    const queue = getQueueType(config.queueType);
    if (queue) {
      // Estimate: assume 1M requests/month as baseline
      monthlyStorageCost = queue.costPerMillionRequests * 1; // 1M requests
    }
  }

  // CDN costs
  if (isCDN && config.cdnType) {
    const cdn = getCDNType(config.cdnType);
    if (cdn) {
      // CDN charged per GB transfer
      monthlyStorageCost = estimatedMonthlyTrafficGB * cdn.costPerGB;
    }
  }

  // Object storage costs
  if (isObjectStorage && config.objectStorageType) {
    const storage = getObjectStorageType(config.objectStorageType);
    if (storage) {
      const storageSize = config.storage_size_gb || 1000;
      monthlyStorageCost =
        storageSize * storage.costPerGBMonth * regionPricing.storageMultiplier;
    }
  }

  // Search engine costs
  if (isSearch && config.searchType) {
    const search = getSearchType(config.searchType);
    if (search) {
      hourlyComputeCost =
        search.costPerHour * regionPricing.computeMultiplier * replicas;
    }
  }

  // Storage costs (for databases/instances with attached storage)
  if (config.storageType && config.storage_size_gb) {
    const storage = getStorageType(config.storageType);
    if (storage) {
      monthlyStorageCost +=
        config.storage_size_gb *
        storage.costPerGBMonth *
        regionPricing.storageMultiplier;
    }
  }

  // Data transfer costs
  const transferMonthlyCost =
    estimatedMonthlyTrafficGB > 0
      ? calculateDataTransferCost(estimatedMonthlyTrafficGB)
      : 0;

  // Calculate monthly totals (730 hours/month average)
  const hoursPerMonth = 730;
  const computeMonthlyOnDemand = hourlyComputeCost * hoursPerMonth;
  const computeMonthlyReserved1Year =
    hourlyComputeCost * hoursPerMonth * RESERVED_PRICING.reserved1Year;
  const computeMonthlyReserved3Year =
    hourlyComputeCost * hoursPerMonth * RESERVED_PRICING.reserved3Year;

  return {
    computeHourly: {
      onDemand: hourlyComputeCost,
      reserved1Year: hourlyComputeCost * RESERVED_PRICING.reserved1Year,
      reserved3Year: hourlyComputeCost * RESERVED_PRICING.reserved3Year,
    },
    storageMonthly: monthlyStorageCost,
    transferMonthly: transferMonthlyCost,
    monthlyTotal: {
      onDemand:
        computeMonthlyOnDemand + monthlyStorageCost + transferMonthlyCost,
      reserved1Year:
        computeMonthlyReserved1Year + monthlyStorageCost + transferMonthlyCost,
      reserved3Year:
        computeMonthlyReserved3Year + monthlyStorageCost + transferMonthlyCost,
    },
    details: {
      instanceCost: hourlyComputeCost,
      storageCost: monthlyStorageCost,
      transferCost: transferMonthlyCost,
      region,
      replicas,
    },
  };
};

/**
 * Calculate total architecture cost
 */
export const calculateArchitectureCost = (
  nodes: Array<{ nodeType: string; config: NodeConfig }>,
  estimatedMonthlyTrafficGB: number = 1000,
): {
  totalMonthly: {
    onDemand: number;
    reserved1Year: number;
    reserved3Year: number;
  };
  breakdown: {
    compute: number;
    storage: number;
    transfer: number;
  };
  savings: {
    reserved1Year: number;
    reserved1YearPercent: number;
    reserved3Year: number;
    reserved3YearPercent: number;
  };
} => {
  let totalComputeMonthly = 0;
  let totalStorageMonthly = 0;
  let totalTransferMonthly = 0;

  let totalOnDemand = 0;
  let totalReserved1Year = 0;
  let totalReserved3Year = 0;

  // Distribute traffic across nodes (simplified)
  const trafficPerNode =
    nodes.length > 0 ? estimatedMonthlyTrafficGB / nodes.length : 0;

  for (const node of nodes) {
    const cost = calculateComponentCost(
      node.nodeType,
      node.config,
      trafficPerNode,
    );

    totalOnDemand += cost.monthlyTotal.onDemand;
    totalReserved1Year += cost.monthlyTotal.reserved1Year;
    totalReserved3Year += cost.monthlyTotal.reserved3Year;

    totalComputeMonthly += cost.computeHourly.onDemand * 730;
    totalStorageMonthly += cost.storageMonthly;
    totalTransferMonthly += cost.transferMonthly;
  }

  const savings1Year = totalOnDemand - totalReserved1Year;
  const savings3Year = totalOnDemand - totalReserved3Year;

  return {
    totalMonthly: {
      onDemand: totalOnDemand,
      reserved1Year: totalReserved1Year,
      reserved3Year: totalReserved3Year,
    },
    breakdown: {
      compute: totalComputeMonthly,
      storage: totalStorageMonthly,
      transfer: totalTransferMonthly,
    },
    savings: {
      reserved1Year: savings1Year,
      reserved1YearPercent:
        totalOnDemand > 0 ? (savings1Year / totalOnDemand) * 100 : 0,
      reserved3Year: savings3Year,
      reserved3YearPercent:
        totalOnDemand > 0 ? (savings3Year / totalOnDemand) * 100 : 0,
    },
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Component Catalog API Service
// Fetches component data from the backend API

const API_BASE = import.meta.env.VITE_API_URL || "";
const CATALOG_API = `${API_BASE}/api/catalog`;

export interface ComponentType {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  cloudProvider: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstanceType {
  id: string;
  componentTypeId: string;
  name: string;
  vcpu: number;
  memoryGb: number;
  networkGbps: number;
  storageType?: string;
  baseIops?: number;
  costPerHourUsd: number;
  cloudProvider: string;
  regionMultiplier: number;
  isActive: boolean;
}

export interface StorageType {
  id: string;
  name: string;
  iopsPerGb: number;
  throughputMbps: number;
  latencyMs: number;
  costPerGbMonthUsd: number;
  cloudProvider: string;
  isActive: boolean;
}

export interface QueueType {
  id: string;
  name: string;
  maxMessages: number;
  throughputMsgsPerSec: number;
  latencyMs: number;
  costPerMillionRequestsUsd: number;
  messageRetentionDays: number;
  supportsFifo: boolean;
  cloudProvider: string;
  isActive: boolean;
}

export interface LoadBalancerType {
  id: string;
  name: string;
  maxConnections: number;
  capacityRps: number;
  latencyMs: number;
  costPerHourUsd: number;
  cloudProvider: string;
  isActive: boolean;
}

export interface CDNType {
  id: string;
  name: string;
  edgeLocations: number;
  throughputGbps: number;
  latencyMs: number;
  costPerGbUsd: number;
  cloudProvider: string;
  isActive: boolean;
}

export interface ObjectStorageType {
  id: string;
  name: string;
  availability: string;
  latencyMs: number;
  costPerGbMonthUsd: number;
  retrievalCostPerGbUsd: number;
  cloudProvider: string;
  isActive: boolean;
}

export interface SearchType {
  id: string;
  name: string;
  vcpu: number;
  memoryGb: number;
  storageGb: number;
  queriesPerSec: number;
  latencyMs: number;
  costPerHourUsd: number;
  cloudProvider: string;
  isActive: boolean;
}

export interface ComponentConfigField {
  id: number;
  componentTypeId: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue?: string;
  options?: any;
  displayOrder: number;
}

export interface ComponentDetailsResponse {
  component: ComponentType;
  instanceTypes?: InstanceType[];
  storageTypes?: StorageType[];
  loadBalancerTypes?: LoadBalancerType[];
  queueTypes?: QueueType[];
  cdnTypes?: CDNType[];
  objectStorageTypes?: ObjectStorageType[];
  searchTypes?: SearchType[];
  configFields: ComponentConfigField[];
  allowedTargets: string[];
}

export const catalogService = {
  /**
   * Get all available component types
   */
  async getComponents(): Promise<ComponentType[]> {
    const response = await fetch(`${CATALOG_API}/components`);
    if (!response.ok) {
      throw new Error("Failed to fetch components");
    }
    const data = await response.json();
    return data.components;
  },

  /**
   * Get detailed information about a specific component
   */
  async getComponentDetails(
    componentId: string,
  ): Promise<ComponentDetailsResponse> {
    const response = await fetch(`${CATALOG_API}/components/${componentId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch component details for ${componentId}`);
    }
    return response.json();
  },

  /**
   * Get full catalog (all components, config fields, connection rules)
   */
  async getFullCatalog() {
    const response = await fetch(`${CATALOG_API}/full`);
    if (!response.ok) {
      throw new Error("Failed to fetch full catalog");
    }
    return response.json();
  },

  /**
   * Get instance types for a specific component
   */
  async getInstanceTypes(componentType: string): Promise<InstanceType[]> {
    const response = await fetch(
      `${CATALOG_API}/instance-types/${componentType}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch instance types for ${componentType}`);
    }
    const data = await response.json();
    return data.instanceTypes;
  },

  /**
   * Get all storage types (EBS)
   */
  async getStorageTypes(): Promise<StorageType[]> {
    const response = await fetch(`${CATALOG_API}/storage-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch storage types");
    }
    const data = await response.json();
    return data.storageTypes;
  },

  /**
   * Get all load balancer types
   */
  async getLoadBalancerTypes(): Promise<LoadBalancerType[]> {
    const response = await fetch(`${CATALOG_API}/load-balancer-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch load balancer types");
    }
    const data = await response.json();
    return data.loadBalancerTypes;
  },

  /**
   * Get all queue types
   */
  async getQueueTypes(): Promise<QueueType[]> {
    const response = await fetch(`${CATALOG_API}/queue-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch queue types");
    }
    const data = await response.json();
    return data.queueTypes;
  },

  /**
   * Get all CDN types
   */
  async getCDNTypes(): Promise<CDNType[]> {
    const response = await fetch(`${CATALOG_API}/cdn-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch CDN types");
    }
    const data = await response.json();
    return data.cdnTypes;
  },

  /**
   * Get all object storage types (S3)
   */
  async getObjectStorageTypes(): Promise<ObjectStorageType[]> {
    const response = await fetch(`${CATALOG_API}/object-storage-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch object storage types");
    }
    const data = await response.json();
    return data.objectStorageTypes;
  },

  /**
   * Get all search engine types
   */
  async getSearchTypes(): Promise<SearchType[]> {
    const response = await fetch(`${CATALOG_API}/search-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch search types");
    }
    const data = await response.json();
    return data.searchTypes;
  },
};

// Cache for component data to avoid repeated API calls
let componentsCache: ComponentType[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get components with caching
 */
export async function getCachedComponents(): Promise<ComponentType[]> {
  const now = Date.now();
  if (componentsCache && now - cacheTimestamp < CACHE_DURATION) {
    return componentsCache;
  }

  componentsCache = await catalogService.getComponents();
  cacheTimestamp = now;
  return componentsCache;
}

/**
 * Clear the component cache (call this when data changes)
 */
export function clearComponentCache() {
  componentsCache = null;
  cacheTimestamp = 0;
}

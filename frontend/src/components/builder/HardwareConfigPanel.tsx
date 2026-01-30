import { useEffect, useState } from "react";
import { Node } from "reactflow";
import type { NodeConfig } from "../../types/builder.types";
import { getNodeTypeDefinition } from "../../types/builder.types";
import { getConfigFields, getDefaultConfig } from "../../utils/configCalculator";
import { calculateComponentCost, formatCurrency } from "../../utils/costCalculator";
import {
    CACHE_INSTANCES,
    CDN_TYPES,
    COMPUTE_INSTANCES,
    DATABASE_INSTANCES,
    LOAD_BALANCER_TYPES,
    OBJECT_STORAGE_TYPES,
    QUEUE_TYPES,
    SEARCH_TYPES,
    STORAGE_TYPES,
    getRegionPricing,
} from "../../utils/instanceTypes";
import { NumericInput } from "../common/NumericInput";

interface HardwareConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, config: Partial<NodeConfig> & { label?: string }) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

const REGIONS = [
  { id: "us-east", name: "US East (N. Virginia)" },
  { id: "us-west", name: "US West (Oregon)" },
  { id: "eu-central", name: "EU Central (Frankfurt)" },
  { id: "eu-west", name: "EU West (Ireland)" },
  { id: "ap-south", name: "Asia Pacific (Mumbai)" },
  { id: "ap-southeast", name: "Asia Pacific (Singapore)" },
  { id: "ap-northeast", name: "Asia Pacific (Tokyo)" },
];

export const HardwareConfigPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
}: HardwareConfigPanelProps) => {
  const [localConfig, setLocalConfig] = useState<NodeConfig>({});
  const [localName, setLocalName] = useState<string>("");

  useEffect(() => {
    if (selectedNode?.data?.config) {
      const defaultConfig = getDefaultConfig(selectedNode.data.nodeType || "");
      const mergedConfig = { ...defaultConfig, ...selectedNode.data.config };
      setLocalConfig(mergedConfig);
      setLocalName(selectedNode.data.label || "");
    }
  }, [
    selectedNode?.id,
    selectedNode?.data?.config,
    selectedNode?.data?.nodeType,
    selectedNode?.data?.label,
  ]);

  if (!selectedNode) return null;

  const nodeTypeDef = getNodeTypeDefinition(selectedNode.data.nodeType || "");
  const configFields = getConfigFields(selectedNode.data.nodeType || "");

  const handleChange = (key: keyof NodeConfig, value: NodeConfig[keyof NodeConfig]) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onUpdateNode(selectedNode.id, newConfig);
  };

  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    onUpdateNode(selectedNode.id, { ...localConfig, label: newName });
  };

  // Get hardware specs for display
  const getHardwareSpecs = () => {
    const specs: { label: string; value: string }[] = [];
    
    if (localConfig.instanceType) {
      const isDatabase = selectedNode.data.nodeType?.includes("database");
      const isCache = selectedNode.data.nodeType?.includes("cache");
      const instances = isDatabase ? DATABASE_INSTANCES : isCache ? CACHE_INSTANCES : COMPUTE_INSTANCES;
      const instance = instances.find(i => i.id === localConfig.instanceType);
      
      if (instance) {
        specs.push({ label: "vCPU", value: `${instance.vcpu} cores` });
        specs.push({ label: "Memory", value: `${instance.memory} GB` });
        specs.push({ label: "Network", value: instance.network });
        specs.push({ label: "Cost", value: `$${instance.costPerHour.toFixed(4)}/hour` });
      }
    }
    
    if (localConfig.storageType) {
      const storage = STORAGE_TYPES.find(s => s.id === localConfig.storageType);
      if (storage) {
        specs.push({ label: "Storage Type", value: storage.name });
        const storageSize = localConfig.storage_size_gb || 100;
        specs.push({ label: "IOPS", value: (storage.iopsPerGB * storageSize).toLocaleString() });
        specs.push({ label: "Throughput", value: `${storage.throughputMBps} MB/s` });
        specs.push({ label: "Storage Cost", value: `$${storage.costPerGBMonth}/GB/month` });
      }
    }
    
    if (localConfig.lbType) {
      const lb = LOAD_BALANCER_TYPES.find(l => l.id === localConfig.lbType);
      if (lb) {
        specs.push({ label: "Type", value: lb.name });
        specs.push({ label: "Max Connections", value: lb.maxConnections.toLocaleString() });
        specs.push({ label: "Cost", value: `$${lb.costPerHour.toFixed(4)}/hour` });
      }
    }
    
    if (localConfig.queueType) {
      const queue = QUEUE_TYPES.find(q => q.id === localConfig.queueType);
      if (queue) {
        specs.push({ label: "Type", value: queue.name });
        specs.push({ label: "Max Messages", value: queue.maxMessages.toLocaleString() });
        specs.push({ label: "Cost", value: `$${queue.costPerMillionRequests}/million requests` });
      }
    }
    
    if (localConfig.cdnType) {
      const cdn = CDN_TYPES.find(c => c.id === localConfig.cdnType);
      if (cdn) {
        specs.push({ label: "Type", value: cdn.name });
        specs.push({ label: "Edge Locations", value: cdn.edgeLocations.toString() });
        specs.push({ label: "Bandwidth", value: `${cdn.throughputGbps} Gbps` });
        specs.push({ label: "Cost", value: `$${cdn.costPerGB}/GB transfer` });
      }
    }
    
    if (localConfig.objectStorageType) {
      const storage = OBJECT_STORAGE_TYPES.find(s => s.id === localConfig.objectStorageType);
      if (storage) {
        specs.push({ label: "Storage Class", value: storage.name });
        specs.push({ label: "Availability", value: storage.availability });
        specs.push({ label: "Cost", value: `$${storage.costPerGBMonth}/GB/month` });
        specs.push({ label: "Retrieval Cost", value: `$${storage.retrievalCost}/GB` });
      }
    }
    
    if (localConfig.searchType) {
      const search = SEARCH_TYPES.find(s => s.id === localConfig.searchType);
      if (search) {
        specs.push({ label: "vCPU", value: `${search.vcpu} cores` });
        specs.push({ label: "Memory", value: `${search.memory} GB` });
        specs.push({ label: "Storage", value: `${search.storageGB} GB` });
        specs.push({ label: "Cost", value: `$${search.costPerHour.toFixed(4)}/hour` });
      }
    }
    
    return specs;
  };

  const renderField = (field: string) => {
    switch (field) {
      case "region":
        return (
          <div key="region" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🌍 Region
            </label>
            <select
              value={localConfig.region || "us-east"}
              onChange={(e) => handleChange("region", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "replicas":
        return (
          <div key="replicas" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🔢 Replicas
            </label>
            <NumericInput
              value={localConfig.replicas}
              onChange={(val) => handleChange("replicas", val ?? 1)}
              min={1}
              max={100}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">High availability instances</p>
          </div>
        );

      case "instanceType": {
        const instances = selectedNode.data.nodeType?.includes("database")
          ? DATABASE_INSTANCES
          : selectedNode.data.nodeType?.includes("cache")
          ? CACHE_INSTANCES
          : COMPUTE_INSTANCES;
        return (
          <div key="instanceType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              💻 Instance Type
            </label>
            <select
              value={localConfig.instanceType || ""}
              onChange={(e) => handleChange("instanceType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select instance...</option>
              {instances.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.vcpu} vCPU, {inst.memory}GB RAM)
                </option>
              ))}
            </select>
          </div>
        );
      }

      case "storageType":
        return (
          <div key="storageType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              💾 Storage Type
            </label>
            <select
              value={localConfig.storageType || "gp3"}
              onChange={(e) => handleChange("storageType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {STORAGE_TYPES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.iopsPerGB} IOPS/GB, {st.throughputMBps} MB/s)
                </option>
              ))}
            </select>
          </div>
        );

      case "storage_size_gb":
        return (
          <div key="storage_size_gb" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              📦 Storage Size (GB)
            </label>
            <NumericInput
              value={localConfig.storage_size_gb}
              onChange={(val) => handleChange("storage_size_gb", val ?? 100)}
              min={10}
              className="w-full"
            />
          </div>
        );

      case "consistency":
        return (
          <div key="consistency" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🔄 Consistency Model
            </label>
            <select
              value={localConfig.consistency || "strong"}
              onChange={(e) =>
                handleChange(
                  "consistency",
                  e.target.value as "strong" | "eventual"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              <option value="strong">Strong (Immediate)</option>
              <option value="eventual">Eventual (Better performance)</option>
            </select>
          </div>
        );

      case "ttl_ms":
        return (
          <div key="ttl_ms" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              ⏳ Cache TTL
            </label>
            <NumericInput
              value={localConfig.ttl_ms}
              onChange={(val) => handleChange("ttl_ms", val ?? 3600000)}
              min={1000}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {((localConfig.ttl_ms || 3600000) / 60000).toFixed(0)} minutes
            </p>
          </div>
        );

      case "lbType":
        return (
          <div key="lbType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              ⚖️ Load Balancer Type
            </label>
            <select
              value={localConfig.lbType || "alb"}
              onChange={(e) => handleChange("lbType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              {LOAD_BALANCER_TYPES.map((lb) => (
                <option key={lb.id} value={lb.id}>
                  {lb.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "accessType":
        return (
          <div key="accessType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🔒 Access Scheme
            </label>
            <select
              value={localConfig.accessType || "external"}
              onChange={(e) =>
                handleChange("accessType", e.target.value as "internal" | "external")
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              <option value="external">Internet Facing</option>
              <option value="internal">Internal (VPC Only)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Internal LBs are shielded from public traffic latency.
            </p>
          </div>
        );

      case "queueType":
        return (
          <div key="queueType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              📬 Queue Type
            </label>
            <select
              value={localConfig.queueType || "sqs-standard"}
              onChange={(e) => handleChange("queueType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              {QUEUE_TYPES.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "cdnType":
        return (
          <div key="cdnType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🌐 CDN Provider
            </label>
            <select
              value={localConfig.cdnType || "cloudfront-basic"}
              onChange={(e) => handleChange("cdnType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              {CDN_TYPES.map((cdn) => (
                <option key={cdn.id} value={cdn.id}>
                  {cdn.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "objectStorageType":
        return (
          <div key="objectStorageType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🗄️ Storage Class
            </label>
            <select
              value={localConfig.objectStorageType || "s3-standard"}
              onChange={(e) =>
                handleChange("objectStorageType", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              {OBJECT_STORAGE_TYPES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "searchType":
        return (
          <div key="searchType" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              🔍 Search Instance
            </label>
            <select
              value={localConfig.searchType || "es-small"}
              onChange={(e) => handleChange("searchType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md"
            >
              {SEARCH_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        );

      case "readRatio":
        return (
          <div key="readRatio" className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
              ⚖️ Read/Write Ratio
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={localConfig.readRatio ?? 80}
                onChange={(e) =>
                  handleChange("readRatio", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-sm font-bold text-gray-900 dark:text-[#cccccc] w-12 text-right">
                {localConfig.readRatio ?? 80}%
              </span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-[#9ca3af]">
              <span>Writes: {100 - (localConfig.readRatio ?? 80)}%</span>
              <span>Reads: {localConfig.readRatio ?? 80}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Writes consume more CPU & Disk I/O than reads.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const hardwareSpecs = getHardwareSpecs();

  return (
    <div className="w-80 bg-white dark:bg-[#252526] border-l border-gray-200 dark:border-[#3e3e3e] overflow-y-auto flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e] p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#cccccc]">⚙️ Hardware Config</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-[#d4d4d4] text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-[#9ca3af]">
          Configure hardware only. Performance calculated during simulation.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Node Info */}
        {/* Node Info & Renaming */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:border-blue-900/50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-start space-x-3">
            <span className="text-3xl mt-1">{nodeTypeDef?.icon || "📦"}</span>
            <div className="flex-1">
              <div className="mb-2">
                <label className="block text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wider mb-1">
                  Component Name
                </label>
                <input 
                  type="text" 
                  value={localName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-black/20 border border-blue-200 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="Name this component..."
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-blue-200/70 flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-[10px] mr-2 border border-blue-200 dark:border-blue-800">
                  {nodeTypeDef?.label || "Component"}
                </span>
                {nodeTypeDef?.description}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Fields */}
        {configFields.map((field) => renderField(field))}

        {/* Hardware Specifications */}
        {hardwareSpecs.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <h4 className="font-semibold text-gray-900 dark:text-[#cccccc] mb-3 text-sm">
              📋 Hardware Specifications
            </h4>
            <div className="space-y-2">
              {hardwareSpecs.map((spec, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-[#9ca3af]">{spec.label}:</span>
                  <span className="font-medium text-gray-900 dark:text-[#cccccc]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Cost Breakdown */}
        {(() => {
          const costBreakdown = calculateComponentCost(
            selectedNode.data.nodeType || '',
            localConfig,
            500 // Estimated 500GB/month traffic per component
          );
          const region = getRegionPricing(localConfig.region || 'us-east');
          const hasAnyCost = costBreakdown.monthlyTotal.onDemand > 0;

          if (!hasAnyCost) return null;

          return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 dark:text-[#cccccc] mb-3 text-sm">
                💰 Cost Breakdown ({region.name})
              </h4>

              {/* Monthly Cost Comparison */}
              <div className="bg-white dark:bg-[#252526] rounded-lg p-3 mb-3 border border-green-100">
                <div className="text-xs font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">Monthly Total</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-[#9ca3af]">On-Demand:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-[#cccccc]">
                      {formatCurrency(costBreakdown.monthlyTotal.onDemand)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 -mx-3 px-3 py-1 rounded">
                    <span className="text-xs text-blue-700">Reserved (1 year):</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-900">
                        {formatCurrency(costBreakdown.monthlyTotal.reserved1Year)}
                      </div>
                      <div className="text-xs text-blue-600">
                        Save{' '}
                        {formatCurrency(
                          costBreakdown.monthlyTotal.onDemand -
                            costBreakdown.monthlyTotal.reserved1Year
                        )}{' '}
                        (40%)
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 -mx-3 px-3 py-1 rounded">
                    <span className="text-xs text-green-700">Reserved (3 years):</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-900">
                        {formatCurrency(costBreakdown.monthlyTotal.reserved3Year)}
                      </div>
                      <div className="text-xs text-green-600">
                        Save{' '}
                        {formatCurrency(
                          costBreakdown.monthlyTotal.onDemand -
                            costBreakdown.monthlyTotal.reserved3Year
                        )}{' '}
                        (60%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Components */}
              <div className="space-y-2 text-xs">
                {costBreakdown.computeHourly.onDemand > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-[#9ca3af]">Compute (hourly):</span>
                    <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                      {formatCurrency(costBreakdown.computeHourly.onDemand)}
                      {localConfig.replicas && localConfig.replicas > 1 && (
                        <span className="text-gray-500 ml-1">× {localConfig.replicas}</span>
                      )}
                    </span>
                  </div>
                )}
                {costBreakdown.storageMonthly > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-[#9ca3af]">Storage (monthly):</span>
                    <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                      {formatCurrency(costBreakdown.storageMonthly)}
                    </span>
                  </div>
                )}
                {costBreakdown.transferMonthly > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-[#9ca3af]">Transfer (est.):</span>
                    <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                      {formatCurrency(costBreakdown.transferMonthly)}
                    </span>
                  </div>
                )}
              </div>

              {/* Region pricing note */}
              {region.computeMultiplier !== 1.0 && (
                <div className="mt-3 pt-2 border-t border-green-200">
                  <p className="text-xs text-gray-600 dark:text-[#9ca3af]">
                    {region.computeMultiplier > 1.0 ? '📈' : '📉'} Region pricing:{' '}
                    <span className="font-medium">
                      {region.computeMultiplier > 1.0 ? '+' : ''}
                      {((region.computeMultiplier - 1) * 100).toFixed(0)}%
                    </span>{' '}
                    vs us-east-1
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>💡 Performance Testing:</strong> After building your architecture, 
            use the Simulation Engine to run load tests and measure actual RPS, 
            latency, and bottlenecks based on these hardware specs.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white dark:bg-[#252526] border-t border-gray-200 dark:border-[#3e3e3e] p-4 space-y-2">
        <button
          onClick={() => {
            if (
              confirm(
                `Delete "${nodeTypeDef?.label}" node?\n\nThis will also remove all connected edges.`
              )
            ) {
              onDeleteNode(selectedNode.id);
              onClose();
            }
          }}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
        >
          🗑️ Delete Node
        </button>
        <button
          onClick={onClose}
          className="w-full bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3e3e3e] font-medium"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
};

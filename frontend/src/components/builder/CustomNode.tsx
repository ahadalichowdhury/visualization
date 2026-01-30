import { memo } from "react";
import { Handle, NodeProps, NodeResizer, Position } from "reactflow";
import type { NodeData } from "../../types/builder.types";
import { getNodeTypeDefinition } from "../../types/builder.types";

interface NodeActivity {
  rpsIn: number;
  rpsOut: number;
  cpu: number;
  memPercent?: number;
  diskIOPercent?: number;
  networkPercent?: number;
  errors: number;
  status: "normal" | "warning" | "danger" | "failed";
  successRate?: number;
  bottleneck?: "cpu" | "memory" | "disk" | "network" | "none";
}

// Modern gradient backgrounds based on component category
const getGradientByType = (nodeType: string): string => {
  const gradients: Record<string, string> = {
    // Compute - Purple/Blue
    api_server: "from-indigo-500/90 via-purple-500/90 to-pink-500/90",
    web_server: "from-blue-500/90 via-indigo-500/90 to-purple-500/90",
    microservice: "from-violet-500/90 via-purple-500/90 to-fuchsia-500/90",
    worker: "from-purple-600/90 via-indigo-600/90 to-blue-600/90",

    // Databases - Pink/Red
    database_sql: "from-rose-500/90 via-pink-500/90 to-fuchsia-500/90",
    database_nosql: "from-pink-500/90 via-rose-500/90 to-red-500/90",
    database_graph: "from-fuchsia-500/90 via-pink-500/90 to-rose-500/90",
    database_timeseries: "from-red-500/90 via-rose-500/90 to-pink-500/90",

    // Caches - Orange/Yellow
    cache_redis: "from-orange-500/90 via-amber-500/90 to-yellow-500/90",
    cache_memcached: "from-amber-500/90 via-yellow-500/90 to-orange-500/90",

    // Network - Cyan/Blue
    load_balancer: "from-cyan-500/90 via-blue-500/90 to-indigo-500/90",
    api_gateway: "from-blue-500/90 via-cyan-500/90 to-teal-500/90",
    cdn: "from-teal-500/90 via-cyan-500/90 to-blue-500/90",

    // Messaging - Green
    queue: "from-emerald-500/90 via-green-500/90 to-teal-500/90",
    message_broker: "from-green-500/90 via-emerald-500/90 to-cyan-500/90",

    // Storage - Purple
    object_storage: "from-violet-500/90 via-purple-500/90 to-indigo-500/90",
    search: "from-indigo-500/90 via-violet-500/90 to-purple-500/90",

    // Network Group - Subnet
    subnet: "from-slate-800/50 via-gray-800/50 to-zinc-800/50", // Transparent dark

    // Clients - Gray
    client: "from-slate-600/90 via-gray-600/90 to-zinc-600/90",
    mobile_app: "from-gray-600/90 via-slate-600/90 to-stone-600/90",
    web_browser: "from-zinc-600/90 via-gray-600/90 to-slate-600/90",
  };

  return (
    gradients[nodeType] || "from-gray-500/90 via-slate-500/90 to-zinc-500/90"
  );
};

interface ExtendedNodeData extends NodeData {
  replicaGroup?: string;
  replicaIndex?: number;
  totalReplicas?: number;
  activity?: NodeActivity;
  chaosFailure?: "crash" | "latency" | "throttle" | "partition";
  chaosSeverity?: number;
}

export const CustomNode = memo(
  ({ data, selected, id }: NodeProps<NodeData>) => {
    const extendedData = data as ExtendedNodeData;
    const nodeType = getNodeTypeDefinition(data.nodeType || "");
    const isPartOfReplicaGroup = extendedData.replicaGroup !== undefined;
    const replicaIndex = extendedData.replicaIndex;
    const totalReplicas = extendedData.totalReplicas;

    const activity = extendedData.activity;
    const isActive = activity && (activity.rpsIn > 0 || activity.rpsOut > 0);

    // PERFORMANCE: Detect if simulation is actively running
    const isSimulationActive =
      activity &&
      (data.nodeType === "client" ? activity.rpsOut > 0 : activity.rpsIn > 0);

    const isSubnet = data.nodeType === "subnet";

    // Status-based glow
    const getStatusGlow = () => {
      if (!activity || data.nodeType === "client") return "";
      switch (activity.status) {
        case "failed":
          return "shadow-[0_0_30px_rgba(239,68,68,0.6)]";
        case "danger":
          return "shadow-[0_0_25px_rgba(249,115,22,0.5)]";
        case "warning":
          return "shadow-[0_0_20px_rgba(234,179,8,0.4)]";
        case "normal":
          return "shadow-[0_0_20px_rgba(34,197,94,0.4)]";
        default:
          return "";
      }
    };

    // Subnet special rendering
    if (isSubnet) {
      return (
        <div
          className={`
            relative px-8 py-8 rounded-xl w-full h-full
            border-2 border-dashed border-slate-600
            bg-slate-900/10
            ${selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""}
            transition-all duration-300
            min-w-[300px] min-h-[200px] flex items-start justify-start
          `}
        >
          <NodeResizer
            minWidth={300}
            minHeight={200}
            isVisible={selected}
            lineClassName="border-indigo-500"
            handleClassName="h-3 w-3 bg-indigo-500 border-2 border-white rounded"
          />
          <div className="absolute top-0 left-0 bg-slate-800 px-3 py-1 rounded-br-lg rounded-tl-lg border-r border-b border-slate-600 flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span className="text-xs font-mono text-slate-300 font-bold tracking-wider uppercase">
              {data.label}
            </span>
          </div>
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-slate-500 !border-slate-800"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-slate-500 !border-slate-800"
          />
        </div>
      );
    }

    const gradient = getGradientByType(data.nodeType || "");

    return (
      <div className="relative group">
        {/* Main node with glassmorphism */}
        <div
          className={`
            relative px-5 py-4 rounded-2xl
            backdrop-blur-xl
            bg-gradient-to-br ${gradient}
            border border-white/20
            shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
            ${
              isSimulationActive
                ? "transition-none" // PERFORMANCE: Disable transitions during simulation
                : "transition-all duration-300 ease-out" // Enable smooth transitions when idle
            }
            ${
              selected
                ? "ring-4 ring-white/50 scale-105 shadow-[0_12px_40px_0_rgba(31,38,135,0.5)]"
                : isSimulationActive
                  ? "" // PERFORMANCE: No hover effects during simulation
                  : "hover:scale-102 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.45)]"
            }
            ${isActive && data.nodeType !== "client" ? getStatusGlow() : ""}
            ${isPartOfReplicaGroup ? "border-l-4 border-l-white/60" : ""}
          `}
          style={{ minWidth: "180px" }}
        >
          {/* Animated gradient overlay - only when not simulating */}
          {!isSimulationActive && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}

          <Handle
            type="target"
            position={Position.Top}
            className={`w-3 h-3 !bg-white dark:bg-[#252526] border-2 border-white/50 shadow-lg ${
              isSimulationActive ? "" : "transition-transform hover:scale-125"
            }`}
          />

          {/* Node ID Badge - Modern floating design */}
          <div className="absolute -top-3 -left-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white/30 backdrop-blur-sm">
            {id}
          </div>

          {/* Replica Badge - Floating pill */}
          {isPartOfReplicaGroup && (
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white/30 backdrop-blur-sm">
              {replicaIndex}/{totalReplicas}
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center">
            {/* Bottleneck Indicator Badge - Top Right Corner */}
            {activity && activity.bottleneck && activity.bottleneck !== "none" && (
              <div className="absolute -top-2 -right-2 z-20">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full 
                  border-2 border-white shadow-lg animate-pulse
                  ${activity.bottleneck === "cpu" ? "bg-red-500" : ""}
                  ${activity.bottleneck === "memory" ? "bg-blue-500" : ""}
                  ${activity.bottleneck === "disk" ? "bg-yellow-500" : ""}
                  ${activity.bottleneck === "network" ? "bg-green-500" : ""}
                `} title={`Bottleneck: ${activity.bottleneck.toUpperCase()}`}>
                  <span className="text-lg">
                    {activity.bottleneck === "cpu" && "🔥"}
                    {activity.bottleneck === "memory" && "💾"}
                    {activity.bottleneck === "disk" && "💿"}
                    {activity.bottleneck === "network" && "🌐"}
                  </span>
                </div>
              </div>
            )}

            {/* Chaos Failure Indicator - Top Left Corner */}
            {extendedData.chaosFailure && (
              <div className="absolute -top-2 -left-2 z-20">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full 
                  border-2 border-white shadow-lg animate-bounce
                  ${extendedData.chaosFailure === "crash" ? "bg-black" : ""}
                  ${extendedData.chaosFailure === "latency" ? "bg-yellow-600" : ""}
                  ${extendedData.chaosFailure === "throttle" ? "bg-orange-600" : ""}
                  ${extendedData.chaosFailure === "partition" ? "bg-gray-600" : ""}
                `} title={`Chaos: ${extendedData.chaosFailure.toUpperCase()} (${extendedData.chaosSeverity}%)`}>
                  <span className="text-lg">
                    {extendedData.chaosFailure === "crash" && "💥"}
                    {extendedData.chaosFailure === "latency" && "🐌"}
                    {extendedData.chaosFailure === "throttle" && "🚦"}
                    {extendedData.chaosFailure === "partition" && "🔌"}
                  </span>
                </div>
              </div>
            )}

            {/* Icon with subtle animation - disabled during simulation */}
            <div
              className={`text-4xl mb-3 drop-shadow-lg ${
                isSimulationActive
                  ? ""
                  : "transform transition-transform duration-300 group-hover:scale-110"
              }`}
            >
              {nodeType?.icon || "📦"}
            </div>

            {/* Label with better typography */}
            <div className="text-sm font-bold text-white text-center leading-tight drop-shadow-md">
              {data.label}
            </div>

            {/* Hardware Specs - Modern pills */}
            <div className="mt-3 space-y-1.5 w-full">
              {data.config.instanceType && (
                <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                  💻 {data.config.instanceType}
                </div>
              )}

              {data.config.region &&
                !["client", "mobile_app", "web_browser"].includes(
                  data.nodeType || "",
                ) && (
                  <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                    🌍 {data.config.region}
                  </div>
                )}

              {data.config.storageType && (
                <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                  💾 {data.config.storageType}
                  {data.config.storage_size_gb &&
                  data.config.storage_size_gb >= 1000
                    ? ` (${(data.config.storage_size_gb / 1000).toFixed(1)}TB)`
                    : data.config.storage_size_gb
                      ? ` (${data.config.storage_size_gb}GB)`
                      : ""}
                </div>
              )}

              {!data.config.instanceType &&
                !data.config.storageType &&
                data.config.lbType && (
                  <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                    ⚖️ {data.config.lbType.toUpperCase()}
                  </div>
                )}

              {data.config.queueType && (
                <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                  📬 {data.config.queueType}
                </div>
              )}

              {data.config.cdnType && (
                <div className="text-xs text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium border border-white/30 shadow-sm">
                  🌐 {data.config.cdnType}
                </div>
              )}

              {/* Activity Metrics - Modern cards */}
              {activity &&
                (data.nodeType === "client"
                  ? activity.rpsOut > 0
                  : activity.rpsIn > 0) && (
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-1.5">
                    {/* RPS Display */}
                    {data.nodeType === "client" ? (
                      <div className="text-xs text-center bg-white dark:bg-[#252526]/25 backdrop-blur-sm text-white px-3 py-1 rounded-full font-bold border border-white/40 shadow-sm">
                        📤{" "}
                        {activity.rpsOut >= 1000
                          ? `${(activity.rpsOut / 1000).toFixed(1)}K`
                          : activity.rpsOut}{" "}
                        RPS
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-center bg-white dark:bg-[#252526]/25 backdrop-blur-sm text-white px-3 py-1 rounded-full font-bold border border-white/40 shadow-sm">
                          📥{" "}
                          {activity.rpsIn >= 1000
                            ? `${(activity.rpsIn / 1000).toFixed(1)}K`
                            : activity.rpsIn}{" "}
                          RPS
                        </div>

                        {/* 2x2 Resource Grid - Compact & Modern */}
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          <div className="text-[10px] text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg font-medium border border-white/30">
                            🔥 {Math.round(activity.cpu)}%
                          </div>
                          <div className="text-[10px] text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg font-medium border border-white/30">
                            💾 {Math.round(activity.memPercent || 0)}%
                          </div>
                          <div className="text-[10px] text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg font-medium border border-white/30">
                            💿 {Math.round(activity.diskIOPercent || 0)}%
                          </div>
                          <div className="text-[10px] text-center bg-white dark:bg-[#252526]/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg font-medium border border-white/30">
                            🌐 {Math.round(activity.networkPercent || 0)}%
                          </div>
                        </div>

                        {/* Success Rate */}
                        {activity.successRate !== undefined && (
                          <div
                            className={`text-xs text-center backdrop-blur-sm px-3 py-1 rounded-full font-bold border shadow-sm ${
                              activity.successRate >= 99.5
                                ? "bg-emerald-500/30 text-white border-emerald-400/50"
                                : activity.successRate >= 95
                                  ? "bg-yellow-500/30 text-white border-yellow-400/50"
                                  : "bg-red-500/30 text-white border-red-400/50"
                            }`}
                          >
                            ✓ {activity.successRate.toFixed(2)}%
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Bottom}
            className={`w-3 h-3 !bg-white dark:bg-[#252526] border-2 border-white/50 shadow-lg ${
              isSimulationActive ? "" : "transition-transform hover:scale-125"
            }`}
          />
        </div>

        {/* Hover tooltip - only when not simulating */}
        {!isSimulationActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
              {nodeType?.label || data.nodeType}
            </div>
          </div>
        )}
      </div>
    );
  },
  // PERFORMANCE: Smart comparison to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    const prevActivity = (prevProps.data as ExtendedNodeData).activity;
    const nextActivity = (nextProps.data as ExtendedNodeData).activity;

    // If both have activity data, check for significant changes
    if (prevActivity && nextActivity) {
      // Only re-render if there's a significant change
      const hasSignificantChange =
        Math.abs(prevActivity.cpu - nextActivity.cpu) > 5 || // >5% CPU change
        Math.abs(
          (prevActivity.memPercent || 0) - (nextActivity.memPercent || 0),
        ) > 5 || // >5% memory change
        Math.abs(prevActivity.rpsIn - nextActivity.rpsIn) > 100 || // >100 RPS change
        Math.abs(prevActivity.rpsOut - nextActivity.rpsOut) > 100 || // >100 RPS change
        prevActivity.status !== nextActivity.status || // Status changed
        prevProps.selected !== nextProps.selected; // Selection changed

      // Return true to SKIP re-render if no significant change
      return !hasSignificantChange;
    }

    // If activity state changed (started/stopped), always re-render
    if ((prevActivity === undefined) !== (nextActivity === undefined)) {
      return false;
    }

    // For non-activity changes, only re-render if selected state or label changed
    return (
      prevProps.selected === nextProps.selected &&
      prevProps.data.label === nextProps.data.label
    );
  },
);

CustomNode.displayName = "CustomNode";

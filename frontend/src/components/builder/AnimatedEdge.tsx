import { EdgeProps, getBezierPath } from "reactflow";

interface TrafficData {
  rps: number;
  latency: number;
  errorRate: number;
}

export const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const traffic = data?.traffic as TrafficData | undefined;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge color based on traffic
  const getEdgeColor = () => {
    if (!traffic || traffic.rps === 0) return "#64748b"; // Light gray (no traffic)
    if (traffic.errorRate > 0.1) return "#ef4444"; // Red (high errors)
    if (traffic.rps > 10000) return "#f97316"; // Orange (heavy traffic)
    if (traffic.rps > 5000) return "#eab308"; // Yellow (moderate traffic)
    return "#22c55e"; // Green (normal traffic)
  };

  // Determine edge width based on traffic
  const getEdgeWidth = () => {
    if (!traffic) return 5;
    const rps = traffic.rps;
    if (rps === 0) return 5;
    if (rps > 10000) return 10;
    if (rps > 5000) return 8;
    if (rps > 1000) return 6;
    return 5;
  };

  const edgeColor = getEdgeColor();
  const edgeWidth = getEdgeWidth();
  const hasTraffic = traffic && traffic.rps > 0;

  return (
    <>
      {/* Main edge path with lightweight animation */}
      <path
        id={id}
        style={{ 
          ...style, 
          strokeWidth: edgeWidth,
          // Lightweight CSS animation when traffic flows
          strokeDasharray: hasTraffic ? "10 5" : "none",
          animation: hasTraffic ? "dash 1s linear infinite" : "none",
        }}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={edgeColor}
        strokeOpacity={hasTraffic ? 0.9 : 0.5}
        fill="none"
        markerEnd={markerEnd}
      />

      {/* Traffic label (shows RPS) */}
      {hasTraffic && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-30}
            y={-12}
            width={60}
            height={24}
            fill="white"
            stroke={edgeColor}
            strokeWidth={2}
            rx={12}
            opacity={0.95}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={edgeColor}
            fontSize={11}
            fontWeight="bold"
          >
            {traffic.rps >= 1000
              ? `${(traffic.rps / 1000).toFixed(1)}K`
              : traffic.rps}
          </text>
        </g>
      )}

      {/* CSS Animation Definition */}
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -15;
            }
          }
        `}
      </style>
    </>
  );
};

import { useEffect, useState } from "react";
import type { Bottleneck } from "../../types/simulation.types";

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

interface AlertsPanelProps {
  bottlenecks: Bottleneck[];
  slaViolations: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsPanel = ({
  bottlenecks,
  slaViolations,
  isOpen,
  onClose,
}: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Add bottleneck alerts
    bottlenecks.forEach((bottleneck, idx) => {
      const type =
        bottleneck.severity === "critical" || bottleneck.severity === "high"
          ? "error"
          : "warning";
      newAlerts.push({
        id: `bottleneck-${idx}`,
        type,
        title: `Bottleneck: ${bottleneck.nodeId}`,
        message: `${bottleneck.issue} - ${bottleneck.rootCause}`,
        timestamp: new Date(),
      });
    });

    // Add SLA violation alerts
    slaViolations.forEach((violation, idx) => {
      newAlerts.push({
        id: `sla-${idx}`,
        type: "warning",
        title: "SLA Violation",
        message: violation,
        timestamp: new Date(),
      });
    });

    setAlerts(newAlerts);
  }, [bottlenecks, slaViolations]);

  const getBottleneckIcon = (issue: string) => {
    if (issue.includes("CPU")) return "🔥";
    if (issue.includes("Memory")) return "💾";
    if (issue.includes("Disk")) return "💿";
    if (issue.includes("Network")) return "🌐";
    if (issue.includes("Queue")) return "📬";
    if (issue.includes("Cache")) return "⚡";
    if (issue.includes("Overload")) return "⚠️";
    return "🚨";
  };

  const getAlertIcon = (type: string, title?: string) => {
    // For bottleneck alerts, use resource-specific icons
    if (title?.startsWith("Bottleneck:")) {
      const bottleneck = bottlenecks.find((b) => title.includes(b.nodeId));
      if (bottleneck) {
        return getBottleneckIcon(bottleneck.issue);
      }
    }

    // Default icons
    switch (type) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-[#3e3e3e] text-gray-800 dark:text-gray-300";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-y-auto bg-white dark:bg-[#252526] rounded-lg shadow-2xl border border-gray-200 dark:border-[#3e3e3e] z-50">
      <div className="sticky top-0 bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e] p-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-[#cccccc]">
          🔔 Alerts ({alerts.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-[#d4d4d4] dark:hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>No alerts - All systems operational!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-2 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {getAlertIcon(alert.type, alert.title)}
                  </span>
                  <span className="font-semibold text-sm">{alert.title}</span>
                </div>
                <span className="text-xs opacity-75">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs mt-2">{alert.message}</p>
            </div>
          ))
        )}
      </div>

      {alerts.length > 0 && (
        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#2d2d2d] border-t border-gray-200 dark:border-[#3e3e3e] p-3 text-center">
          <button
            onClick={() => setAlerts([])}
            className="text-xs text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-[#cccccc] font-medium"
          >
            Clear All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

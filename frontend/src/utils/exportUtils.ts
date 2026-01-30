import type { SimulationOutput } from '../types/simulation.types';
import { showInfo } from './toast';

// Export simulation results as JSON
export const exportToJSON = (data: SimulationOutput, filename: string = 'simulation-results.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, filename, 'application/json');
};

// Export simulation results as CSV
export const exportToCSV = (data: SimulationOutput, filename: string = 'simulation-results.csv') => {
  const headers = [
    'Tick',
    'Incoming RPS',
    'Throughput RPS',
    'Latency P50 (ms)',
    'Latency P95 (ms)',
    'Latency P99 (ms)',
    'Error Rate (%)',
    'Queue Depth',
    'Cache Hit Ratio',
    'CPU Usage (%)',
    'Memory Usage (%)',
    'SLA Status'
  ];

  const rows = data.timeSeries.map((point) => [
    point.tick,
    point.incomingRPS.toFixed(2),
    point.throughputRPS.toFixed(2),
    point.latency.p50?.toFixed(2) || '0',
    point.latency.p95?.toFixed(2) || '0',
    point.latency.p99?.toFixed(2) || '0',
    point.errorRatePercent.toFixed(2),
    point.queueDepth,
    point.cacheHitRatio.toFixed(4),
    point.cpuUsagePercent.toFixed(2),
    point.memoryUsagePercent.toFixed(2),
    point.slaStatus
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv');
};

// Export chart as PNG (requires html2canvas library - optional feature)
export const exportChartToPNG = async (elementId: string, filename: string = 'chart.png') => {
  showInfo('PNG export requires html2canvas library. Use JSON/CSV export instead.');
  console.log('PNG export feature not available. Element ID:', elementId, 'Filename:', filename);
};

// Export summary report as text
export const exportSummaryReport = (data: SimulationOutput, filename: string = 'simulation-report.txt') => {
  const report = `
SIMULATION SUMMARY REPORT
========================

Duration: ${(data.duration / 1000000000).toFixed(2)}s
Total Requests: ${data.metrics.totalRequests.toLocaleString()}
Successful Requests: ${data.metrics.successfulRequests.toLocaleString()}
Failed Requests: ${data.metrics.failedRequests.toLocaleString()}

PERFORMANCE METRICS
-------------------
Latency P50: ${data.metrics.latency.p50?.toFixed(2) || 0}ms
Latency P95: ${data.metrics.latency.p95?.toFixed(2) || 0}ms
Latency P99: ${data.metrics.latency.p99?.toFixed(2) || 0}ms
Latency Avg: ${data.metrics.latency.avg?.toFixed(2) || 0}ms
Latency Max: ${data.metrics.latency.max?.toFixed(2) || 0}ms

Throughput: ${data.metrics.throughput.toFixed(2)} RPS
Error Rate: ${(data.metrics.errorRate * 100).toFixed(2)}%
Cache Hit Rate: ${(data.metrics.cacheHitRate * 100).toFixed(2)}%
Queue Depth: ${data.metrics.queueDepth}

${data.bottlenecks && data.bottlenecks.length > 0 ? `
BOTTLENECKS DETECTED
--------------------
${data.bottlenecks.map((b, i) => `
${i + 1}. ${b.nodeId} - ${b.issue}
   Root Cause: ${b.rootCause}
   Impact: ${b.impact}
   Severity: ${b.severity.toUpperCase()}
   Suggestions:
   ${b.suggestions.map((s) => `   - ${s}`).join('\n')}
`).join('\n')}
` : ''}

${data.slaViolations && data.slaViolations.length > 0 ? `
SLA VIOLATIONS
--------------
${data.slaViolations.map((v, i) => `${i + 1}. ${v}`).join('\n')}
` : ''}

${data.costMetrics ? `
COST ANALYSIS
-------------
Total Cost: $${data.costMetrics.totalCostUSD.toFixed(2)} USD

Compute Costs:
${Object.entries(data.costMetrics.compute).map(([k, v]) => `  ${k}: $${(v as number).toFixed(2)}`).join('\n')}

Storage Costs:
${Object.entries(data.costMetrics.storage).map(([k, v]) => `  ${k}: $${(v as number).toFixed(2)}`).join('\n')}

Network Costs:
${Object.entries(data.costMetrics.network).map(([k, v]) => `  ${k}: $${(v as number).toFixed(2)}`).join('\n')}
` : ''}

AUTO-SCALING EVENTS
-------------------
${data.metrics.autoscalingEvents && data.metrics.autoscalingEvents.length > 0
    ? data.metrics.autoscalingEvents.map((e, i) => `${i + 1}. Tick ${e.tick}: ${e.nodeId} scaled from ${e.oldValue} to ${e.newValue} replicas - ${e.reason}`).join('\n')
    : 'No auto-scaling events'}
  `.trim();

  downloadFile(report, filename, 'text/plain');
};

// Helper function to trigger download
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

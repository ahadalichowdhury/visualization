import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { exportService, ExportFormat } from '../../services/export.service';
import { showSuccess, showError, showWarning } from '../../utils/toast';

interface ExportPanelProps {
  nodes: Node[];
  edges: Edge[];
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ nodes, edges }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('terraform');

  const handleExport = async () => {
    if (nodes.length === 0) {
      showWarning('Please add some nodes to your architecture before exporting');
      return;
    }

    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      if (selectedFormat === 'terraform') {
        blob = await exportService.exportToTerraform(nodes, edges);
        filename = 'main.tf';
      } else {
        blob = await exportService.exportToCloudFormation(nodes, edges);
        filename = 'template.yaml';
      }

      exportService.downloadFile(blob, filename);
      showSuccess(`Successfully exported to ${selectedFormat.toUpperCase()}! File saved as: ${filename}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        title="Export Infrastructure as Code"
      >
        <span>📦</span>
        <span>Export IaC</span>
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📦 Export Infrastructure as Code
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Convert your architecture diagram to production-ready IaC templates
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Terraform Option */}
                <button
                  onClick={() => setSelectedFormat('terraform')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedFormat === 'terraform'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      TF
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Terraform</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">HashiCorp HCL</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Multi-cloud infrastructure as code. Supports AWS, Azure, GCP, and 100+ providers.
                  </p>
                </button>

                {/* CloudFormation Option */}
                <button
                  onClick={() => setSelectedFormat('cloudformation')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedFormat === 'cloudformation'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded bg-orange-500 flex items-center justify-center text-white text-xl">
                      ☁️
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">CloudFormation</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">AWS YAML</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    AWS native infrastructure as code. Deep integration with AWS services and features.
                  </p>
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Architecture Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{nodes.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Components</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{edges.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(nodes.map((n) => n.data?.config?.region || 'default')).size}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Regions</div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                What's Included
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>All compute, storage, and network resources</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Security groups, IAM roles, and policies</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Variables and outputs for customization</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Best practice tags and naming conventions</span>
                </li>
              </ul>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> Review and customize the generated templates before deploying to production.
                Add secrets management, adjust security settings, and configure networking for your specific requirements.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting || nodes.length === 0}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  isExporting || nodes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isExporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>Exporting...</span>
                  </span>
                ) : (
                  <span>📥 Download {selectedFormat === 'terraform' ? 'main.tf' : 'template.yaml'}</span>
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

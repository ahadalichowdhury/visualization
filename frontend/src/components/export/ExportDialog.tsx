import { useState } from 'react';
import type { Edge, Node } from 'reactflow';
import { exportService, type ExportFormat } from '../../services/export.service';
import { showError, showSuccess } from '../../utils/toast';

interface ExportDialogProps {
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog = ({ nodes, edges, isOpen, onClose }: ExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('terraform');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (nodes.length === 0) {
      showError('No components to export');
      return;
    }

    setExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      switch (selectedFormat) {
        case 'terraform':
          blob = await exportService.exportToTerraform(nodes, edges);
          filename = 'main.tf';
          break;
        case 'cloudformation':
          blob = await exportService.exportToCloudFormation(nodes, edges);
          filename = 'template.json';
          break;
        default:
          throw new Error('Unsupported format');
      }

      exportService.downloadFile(blob, filename);
      showSuccess(`Exported as ${selectedFormat.toUpperCase()}!`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export architecture');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#252526] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3e3e3e] flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#cccccc]">
            📦 Export Infrastructure
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-[#cccccc]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Export your architecture as Infrastructure-as-Code to deploy on AWS.
              This generates ready-to-use configuration files.
            </p>
          </div>

          {/* Export Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {nodes.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
                Components
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {edges.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
                Connections
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-3">
              Select Export Format
            </label>
            <div className="space-y-3">
              {/* Terraform Option */}
              <button
                onClick={() => setSelectedFormat('terraform')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === 'terraform'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-[#3e3e3e] hover:border-gray-300 dark:hover:border-[#4e4e4e]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedFormat === 'terraform'
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 dark:border-[#4e4e4e]'
                    }`}>
                      {selectedFormat === 'terraform' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        Terraform (HCL)
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#9ca3af]">
                      Generate <code>.tf</code> files compatible with HashiCorp Terraform.
                      Multi-cloud support and wide adoption.
                    </p>
                  </div>
                </div>
              </button>

              {/* CloudFormation Option */}
              <button
                onClick={() => setSelectedFormat('cloudformation')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === 'cloudformation'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-[#3e3e3e] hover:border-gray-300 dark:hover:border-[#4e4e4e]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedFormat === 'cloudformation'
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 dark:border-[#4e4e4e]'
                    }`}>
                      {selectedFormat === 'cloudformation' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        AWS CloudFormation
                      </span>
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                        AWS Native
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#9ca3af]">
                      Generate CloudFormation <code>template.json</code> for native AWS deployments.
                      Deep AWS integration.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
              📋 What's Included:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-[#9ca3af] space-y-1">
              <li>✅ All compute resources (EC2, Lambda)</li>
              <li>✅ Databases (RDS, DynamoDB, ElastiCache)</li>
              <li>✅ Storage (S3 buckets)</li>
              <li>✅ Networking (Load Balancers, API Gateway)</li>
              <li>✅ Messaging (SQS queues)</li>
              <li>✅ VPC and security groups</li>
              <li>✅ Variables for sensitive data</li>
              <li>✅ Outputs for endpoint URLs</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Important:</strong> Review and customize the generated configuration before deploying.
              Update instance types, regions, and security settings as needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3e3e3e] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || nodes.length === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                📦 Export {selectedFormat === 'terraform' ? 'Terraform' : 'CloudFormation'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import { api } from './api';
import type { Edge, Node } from 'reactflow';

export type ExportFormat = 'terraform' | 'cloudformation';

class ExportService {
  // Export to Terraform
  async exportToTerraform(nodes: Node[], edges: Edge[]): Promise<Blob> {
    const response = await api.post('/export/terraform', 
      { nodes, edges },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Export to CloudFormation
  async exportToCloudFormation(nodes: Node[], edges: Edge[]): Promise<Blob> {
    const response = await api.post('/export/cloudformation',
      { nodes, edges },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Generic export
  async export(nodes: Node[], edges: Edge[], format: ExportFormat): Promise<Blob> {
    const response = await api.post('/export',
      { nodes, edges, format },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Download helper
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();

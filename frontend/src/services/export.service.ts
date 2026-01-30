// Infrastructure Export Service
import { Edge, Node } from "reactflow";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export type ExportFormat = "terraform" | "cloudformation";

class ExportService {
  // Export architecture to Terraform
  async exportToTerraform(nodes: Node[], edges: Edge[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/terraform`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes, edges }),
    });

    if (!response.ok) {
      throw new Error("Export to Terraform failed");
    }

    return response.blob();
  }

  // Export architecture to CloudFormation
  async exportToCloudFormation(nodes: Node[], edges: Edge[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/cloudformation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes, edges }),
    });

    if (!response.ok) {
      throw new Error("Export to CloudFormation failed");
    }

    return response.blob();
  }

  // Generic export with format selection
  async exportArchitecture(
    nodes: Node[],
    edges: Edge[],
    format: ExportFormat,
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes, edges, format }),
    });

    if (!response.ok) {
      throw new Error(`Export to ${format} failed`);
    }

    return response.blob();
  }

  // Download exported file
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const exportService = new ExportService();

import { API_BASE_URL } from '../utils/constants';
import type { FeatureLimits, CollaborationAccess } from '../types/auth.types';

export interface SaveArchitectureRequest {
  id?: string;
  scenario_id?: string;
  title: string;
  description?: string;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  is_submitted: boolean;
}

export interface Architecture {
  id: string;
  user_id: string;
  scenario_id?: string;
  title: string;
  description?: string;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  is_submitted: boolean;
  score?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface ArchitectureListItem {
  id: string;
  title: string;
  description?: string;
  scenario_id?: string;
  node_count: number;
  edge_count: number;
  is_submitted: boolean;
  score?: number;
  created_at: string;
  updated_at: string;
}

export const architectureService = {
  async saveArchitecture(data: SaveArchitectureRequest): Promise<Architecture> {
    const token = localStorage.getItem('auth_token');
    const url = data.id
      ? `${API_BASE_URL}/architectures/${data.id}`
      : `${API_BASE_URL}/architectures`;
    
    const method = data.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save architecture');
    }

    const result = await response.json();
    return result.architecture;
  },

  async getArchitecture(id: string): Promise<Architecture> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/architectures/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load architecture');
    }

    return response.json();
  },

  async getUserArchitectures(scenarioId?: string, standaloneOnly?: boolean): Promise<ArchitectureListItem[]> {
    const token = localStorage.getItem('auth_token');
    let url = `${API_BASE_URL}/architectures`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (scenarioId) {
      params.append('scenario_id', scenarioId);
    } else if (standaloneOnly) {
      params.append('standalone', 'true');
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load architectures');
    }

    const data = await response.json();
    return data.architectures || [];
  },

  async deleteArchitecture(id: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/architectures/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete architecture');
    }
  },

  async getFeatureLimits(): Promise<FeatureLimits> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/architectures/limits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get feature limits');
    }

    return response.json();
  },

  async checkCollaborationAccess(architectureId: string): Promise<CollaborationAccess> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/architectures/${architectureId}/collaboration-access`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check collaboration access');
    }

    return response.json();
  },
};

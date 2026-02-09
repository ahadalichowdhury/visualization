import { api } from './api';
import type { Edge, Node } from 'reactflow';

export interface PublicArchitecture {
  id: string;
  architecture_id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  tags: string[];
  category?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  node_count: number;
  edge_count: number;
  is_featured: boolean;
  view_count: number;
  clone_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  is_liked_by_user: boolean;
  canvas_data?: {
    nodes: Node[];
    edges: Edge[];
  };
}

export interface PublicArchitectureDetail extends PublicArchitecture {
  architecture?: {
    id: string;
    title: string;
    description?: string;
    canvas_data: {
      nodes: Node[];
      edges: Edge[];
    };
  };
}

export interface GalleryComment {
  id: string;
  public_architecture_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface GalleryFilters {
  category?: string;
  complexity?: string;
  tags?: string[];
  search?: string;
  sort_by?: 'recent' | 'popular' | 'liked' | 'viewed';
  page?: number;
  limit?: number;
}

export interface GalleryListResponse {
  architectures: PublicArchitecture[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PublishArchitectureRequest {
  architecture_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

class GalleryService {
  // Publish an architecture to the gallery
  async publishArchitecture(data: PublishArchitectureRequest): Promise<PublicArchitecture> {
    const response = await api.post('/gallery/publish', data);
    return response.data;
  }

  // Browse gallery with filters
  async browseGallery(filters: GalleryFilters = {}): Promise<GalleryListResponse> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.complexity) params.append('complexity', filters.complexity);
    if (filters.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/gallery?${params.toString()}`);
    return response.data;
  }

  // Get a single public architecture with full details
  async getPublicArchitecture(id: string): Promise<PublicArchitectureDetail> {
    const response = await api.get(`/gallery/${id}`);
    return response.data;
  }

  // Clone an architecture to your workspace
  async cloneArchitecture(id: string): Promise<{ id: string; title: string }> {
    const response = await api.post(`/gallery/${id}/clone`, {});
    return response.data;
  }

  // Like/unlike an architecture
  async likeArchitecture(id: string): Promise<{ liked: boolean }> {
    const response = await api.post(`/gallery/${id}/like`, {});
    return response.data;
  }

  // Add a comment
  async addComment(id: string, comment: string): Promise<GalleryComment> {
    const response = await api.post(`/gallery/${id}/comments`, { comment });
    return response.data;
  }

  // Get comments
  async getComments(id: string, limit = 50, offset = 0): Promise<{ comments: GalleryComment[]; limit: number; offset: number }> {
    const response = await api.get(`/gallery/${id}/comments?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Unpublish an architecture
  async unpublishArchitecture(id: string): Promise<void> {
    await api.delete(`/gallery/${id}`);
  }
}

export const galleryService = new GalleryService();

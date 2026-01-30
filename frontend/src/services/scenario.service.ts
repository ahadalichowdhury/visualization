import axios from "axios";
import type {
  PaginatedScenariosResponse,
  PaginatedScenariosWithProgressResponse,
  Scenario,
  ScenarioDetailResponse,
  ScenarioProgress,
  ScenarioWithProgress,
  UpdateProgressRequest,
} from "../types/scenario.types";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const scenarioService = {
  // Get all scenarios (public)
  async getAllScenarios(): Promise<Scenario[]> {
    const response = await api.get("/scenarios");
    return response.data;
  },

  // Get scenarios with pagination (public)
  async getScenariosPaginated(params: {
    cursor?: string;
    limit?: number;
    category?: string;
    difficulty?: string;
    tier?: string;
    search?: string;
  }): Promise<PaginatedScenariosResponse> {
    const response = await api.get("/scenarios/paginated", { params });
    return response.data;
  },

  // Get scenario by ID (public)
  async getScenarioById(id: string): Promise<Scenario> {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },

  // Search scenarios (public)
  async searchScenarios(params: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<Scenario[]> {
    const response = await api.get("/scenarios", { params });
    return response.data;
  },

  // Get scenario categories (public)
  async getCategories(): Promise<string[]> {
    const response = await api.get("/scenarios/categories");
    return response.data.categories;
  },

  // Get user's scenarios with progress (protected)
  async getUserScenarios(): Promise<ScenarioWithProgress[]> {
    const response = await api.get("/user/scenarios");
    return response.data;
  },

  // Get user's scenarios with progress using pagination (protected)
  async getUserScenariosPaginated(params: {
    cursor?: string;
    limit?: number;
    category?: string;
    difficulty?: string;
    tier?: string;
    search?: string;
  }): Promise<PaginatedScenariosWithProgressResponse> {
    const response = await api.get("/user/scenarios/paginated", { params });
    return response.data;
  },

  // Get user's progress for a specific scenario (protected)
  async getUserScenarioProgress(
    scenarioId: string,
  ): Promise<ScenarioDetailResponse> {
    const response = await api.get(`/user/scenarios/${scenarioId}/progress`);
    return response.data;
  },

  // Update user's progress for a scenario (protected)
  async updateProgress(
    scenarioId: string,
    progress: UpdateProgressRequest,
  ): Promise<ScenarioProgress> {
    const response = await api.post(
      `/user/scenarios/${scenarioId}/progress`,
      progress,
    );
    return response.data;
  },

  // Create scenario (admin only)
  async createScenario(scenario: Partial<Scenario>): Promise<Scenario> {
    const response = await api.post("/admin/scenarios", scenario);
    return response.data;
  },
};

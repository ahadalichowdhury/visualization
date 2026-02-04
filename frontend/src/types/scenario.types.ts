export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  thumbnail_url?: string;
  requirements: Requirements;
  hints: string[];
  goals: Goals;
  tier: "free" | "premium";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Requirements {
  traffic_load: string;
  sla: string;
  user_base: string;
  consistency: string;
  constraints: string[];
}

export interface Goals {
  max_latency_ms: number;
  max_error_rate_percent: number;
  min_throughput_rps: number;
  must_support_regions: string[];
  data_durability?: string;
}

export interface ScenarioProgress {
  id: string;
  user_id: string;
  scenario_id: string;
  status: "not_started" | "in_progress" | "completed" | "completed_with_errors";
  steps_completed: number;
  total_steps: number;
  score?: number;
  score_breakdown: ScoreBreakdown;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  latency: number;
  throughput: number;
  errors: number;
  hints_penalty: number;
}

export interface ScenarioWithProgress extends Scenario {
  status: string;
  steps_completed: number;
  score?: number;
}

export interface UpdateProgressRequest {
  status: string;
  steps_completed: number;
  total_steps: number;
  score?: number;
  score_breakdown?: ScoreBreakdown;
}

export interface ScenarioDetailResponse {
  scenario: Scenario;
  progress: ScenarioProgress | null;
}

export interface PaginatedScenariosResponse {
  scenarios: Scenario[];
  nextCursor: string;
  hasMore: boolean;
}

export interface PaginatedScenariosWithProgressResponse {
  scenarios: ScenarioWithProgress[];
  nextCursor: string;
  hasMore: boolean;
}

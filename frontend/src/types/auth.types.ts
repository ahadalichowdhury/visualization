export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'basic' | 'pro' | 'admin';
  subscription_tier: 'free' | 'premium' | 'admin';
  created_at: string;
  progress_summary?: ProgressSummary;
}

export interface ProgressSummary {
  completed_scenarios: number;
  total_scenarios: number;
  pro_features_unlocked: boolean;
  streak_days?: number;
  best_score?: number;
}

export interface FeatureLimits {
  subscription_tier: 'free' | 'premium' | 'admin';
  standalone_canvases: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
  architectures_per_scenario: {
    limit: number;
    unlimited: boolean;
  };
  collaboration: {
    enabled_on_scenarios: boolean;
    enabled_on_canvases: boolean;
  };
}

export interface CollaborationAccess {
  can_collaborate: boolean;
  is_scenario_architecture: boolean;
  subscription_tier: string;
  reason: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ApiError {
  error: string;
}

import { api } from './api';
import type {
  AuthResponse,
  SignupRequest,
  LoginRequest,
  User,
  UpdateProfileRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '../types/auth.types';

export const authService = {
  // Signup
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest): Promise<void> => {
    await api.post('/auth/password/forgot', data);
  },

  // Reset password
  resetPassword: async (data: PasswordResetConfirm): Promise<void> => {
    await api.post('/auth/password/reset', data);
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<User>('/user/profile', data);
    return response.data;
  },

  // OAuth login URLs
  getGoogleAuthUrl: (): string => {
    return `${api.defaults.baseURL}/auth/oauth/google`;
  },

  getGitHubAuthUrl: (): string => {
    return `${api.defaults.baseURL}/auth/oauth/github`;
  },
};

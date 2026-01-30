import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import type { User, SignupRequest, LoginRequest, UpdateProfileRequest } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (data: SignupRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearError: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.signup(data);
          localStorage.setItem('auth_token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Signup failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          localStorage.setItem('auth_token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        const token = get().token || localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data: UpdateProfileRequest) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.updateProfile(data);
          set({ user, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Update failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setToken: (token: string) => {
        localStorage.setItem('auth_token', token);
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

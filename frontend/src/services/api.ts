import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: string })?.error;
    return message || "An error occurred. Please try again.";
  }
  return "An unexpected error occurred.";
};

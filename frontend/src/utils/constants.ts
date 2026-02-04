export const APP_NAME = "Visualization Platform";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const USER_ROLES = {
  BASIC: "basic",
  PRO: "pro",
  ADMIN: "admin",
} as const;

export const ROLE_LABELS = {
  [USER_ROLES.BASIC]: "Basic",
  [USER_ROLES.PRO]: "Pro",
  [USER_ROLES.ADMIN]: "Admin",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/scenarios",
  PROFILE: "/profile",
  PRO: "/pro",
  ADMIN: "/admin",
  SCENARIOS: "/scenarios",
  SCENARIO_DETAIL: (id: string) => `/scenarios/${id}`,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    FORGOT_PASSWORD: "/auth/password/forgot",
    RESET_PASSWORD: "/auth/password/reset",
  },
  USER: {
    PROFILE: "/user/profile",
  },
  ADMIN: {
    USERS: "/admin/users",
    UPDATE_ROLE: (id: string) => `/admin/users/${id}/role`,
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
} as const;

export const PASSWORD_MIN_LENGTH = 6;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Please login to continue.",
  FORBIDDEN: "You do not have permission to access this resource.",
  SERVER_ERROR: "Something went wrong. Please try again later.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_EXISTS: "This email is already registered.",
} as const;

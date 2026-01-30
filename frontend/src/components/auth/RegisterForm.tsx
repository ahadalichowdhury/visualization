import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
      });
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f1419] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white dark:bg-[#252526] p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-[#3e3e3e]"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Name (optional)"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              placeholder="John Doe"
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Create account
          </Button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-[#3e3e3e]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-[#252526] text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/auth/oauth/google";
                }}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/auth/oauth/github";
                }}
              >
                GitHub
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

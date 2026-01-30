import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { showError, showSuccess } from "../../utils/toast";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  message,
}: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login({ email, password });
        showSuccess("Logged in successfully!");
        onSuccess();
      } else {
        await signup({ email, password, name });
        showSuccess("Account created successfully!");
        onSuccess();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${mode === "login" ? "Login" : "Signup"} failed`;
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {message || "Please authenticate to save your architecture"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required={mode === "signup"}
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            disabled={isLoading}
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

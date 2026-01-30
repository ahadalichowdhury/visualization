import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { handleApiError } from '../../services/api';

export const PasswordResetRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset({ email });
      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Check your email
            </h3>
            <p className="text-green-700">
              If an account exists with that email, we've sent password reset
              instructions.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-primary-600 hover:text-primary-500"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-[#cccccc]">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-[#9ca3af]">
            Enter your email address and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Send reset link
          </Button>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PasswordResetConfirmProps {
  token: string;
}

export const PasswordResetConfirm: React.FC<PasswordResetConfirmProps> = ({
  token,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Password reset successful
            </h3>
            <p className="text-green-700">
              You can now login with your new password.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-primary-600 hover:text-primary-500"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-[#cccccc]">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-[#9ca3af]">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/authStore";

export const Profile: React.FC = () => {
  const { user, updateProfile, isLoading, fetchProfile } = useAuthStore();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    try {
      await updateProfile({
        name: name || undefined,
        avatar_url: avatarUrl || undefined,
      });
      await fetchProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || "Failed to update profile");
      } else {
        setError("Failed to update profile");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Profile Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User"}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 border-4 border-blue-500 dark:border-blue-400"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mx-auto mb-4 shadow-lg">
                    {user.name
                      ? user.name[0].toUpperCase()
                      : user.email[0].toUpperCase()}
                  </div>
                )}
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {user.name || "User"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 break-all px-2">
                  {user.email}
                </p>
                <span className="inline-block mt-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs sm:text-sm font-medium">
                  {user.subscription_tier}
                </span>
              </div>

              {user.progress_summary && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#3e3e3e]">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm sm:text-base">
                    Progress
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Completed:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.progress_summary.completed_scenarios}
                      </span>
                    </div>
                    {user.progress_summary.streak_days !== undefined && (
                      <div className="flex justify-between p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded">
                        <span className="text-gray-600 dark:text-gray-400">
                          Streak:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.progress_summary.streak_days} days 🔥
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Pro Features:
                      </span>
                      <span
                        className={`font-medium ${
                          user.progress_summary.pro_features_unlocked
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {user.progress_summary.pro_features_unlocked
                          ? "Unlocked ✓"
                          : "Locked 🔒"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="lg:col-span-2">
            <div className="card hover:shadow-lg transition-shadow">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                Edit Profile
              </h2>

              {success && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 sm:px-4 py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Profile updated successfully!
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <Input
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />

                <Input
                  label="Avatar URL"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />

                <div className="mb-4">
                  <label className="label text-gray-900 dark:text-white text-sm sm:text-base">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input bg-gray-100 dark:bg-[#2d2d2d] cursor-not-allowed opacity-60 text-gray-900 dark:text-gray-400 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email cannot be changed
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full text-base sm:text-lg py-3"
                >
                  💾 Save Changes
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

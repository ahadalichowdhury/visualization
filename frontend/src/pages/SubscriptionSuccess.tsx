import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { showSuccess } from "../utils/toast";

export const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    showSuccess("Payment successful! Your subscription has been activated.");

    // Fetch updated user profile from backend
    const refreshAndRedirect = async () => {
      try {
        await fetchProfile(); // Refresh user data from backend
        console.log("DEBUG: Profile refreshed after payment");
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }

      // Redirect to subscription page after 3 seconds
      setTimeout(() => {
        navigate("/subscription");
      }, 3000);
    };

    refreshAndRedirect();
  }, [navigate, sessionId, fetchProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-[#1e1e1e] dark:to-[#252526] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#252526] rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-[#3e3e3e]">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your Premium subscription has been activated. You now have access to
          all premium features!
        </p>

        {/* Features Unlocked */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Features Unlocked:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 text-left">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Unlimited Standalone Canvases
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Unlimited Architectures per Scenario
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Full Collaboration Features
            </li>
          </ul>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
          <span className="text-sm">Redirecting to subscription page...</span>
        </div>

        {/* Manual redirect */}
        <button
          onClick={async () => {
            await fetchProfile();
            navigate("/subscription");
          }}
          className="mt-6 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          Click here if not redirected automatically
        </button>
      </div>
    </div>
  );
};

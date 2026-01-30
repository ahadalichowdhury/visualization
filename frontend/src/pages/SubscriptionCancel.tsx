import { useNavigate } from "react-router-dom";

export const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e1e1e] dark:to-[#252526] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#252526] rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-[#3e3e3e]">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>Need help?</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you experienced any issues during checkout, please contact our
            support team and we'll be happy to assist you.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/subscription")}
            className="w-full py-3 px-6 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Subscription Plans
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Have questions?{" "}
          <a
            href="mailto:support@example.com"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

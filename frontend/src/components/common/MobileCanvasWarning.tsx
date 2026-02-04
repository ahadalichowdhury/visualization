import { useEffect, useState } from "react";

interface MobileCanvasWarningProps {
  isCanvas?: boolean;
}

export const MobileCanvasWarning: React.FC<MobileCanvasWarningProps> = ({
  isCanvas = true,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 768px (tablet/mobile)
      const mobile = window.innerWidth < 768;
      setShowModal(mobile && isCanvas);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [isCanvas]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#252526] rounded-2xl max-w-md w-full p-8 shadow-2xl border-2 border-blue-500 dark:border-blue-400">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Desktop Required
        </h2>

        {/* Message */}
        <div className="space-y-3 mb-6">
          <p className="text-center text-gray-700 dark:text-gray-300 leading-relaxed">
            The Canvas Builder requires a larger screen for the best experience.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">
              📱 Recommended:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Desktop computer or laptop</li>
              <li>• Tablet in landscape mode (minimum 768px width)</li>
              <li>• Screen resolution: 1024x768 or higher</li>
            </ul>
          </div>
        </div>

        {/* Features Available on Mobile */}
        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            ✨ Still available on mobile:
          </p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Browse scenarios</li>
            <li>• View your dashboard</li>
            <li>• Manage your profile</li>
            <li>• Explore documentation</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="w-full py-3 px-4 bg-gray-200 dark:bg-[#2d2d2d] hover:bg-gray-300 dark:hover:bg-[#3e3e3e] text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all duration-200"
          >
            Continue Anyway (Not Recommended)
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          For the best experience, please use a desktop or laptop computer
        </p>
      </div>
    </div>
  );
};

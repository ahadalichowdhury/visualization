import { useState } from "react";
import { X, Copy, Check, Share2, Link2 } from "lucide-react";
import { showSuccess } from "../../utils/toast";

interface ShareDialogProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareDialog = ({ roomId, isOpen, onClose }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate shareable URL
  const shareUrl = `${window.location.origin}/canvas/room/${roomId}`;

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showSuccess("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Share via Web Share API (mobile)
  const shareViaAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Collaborate on Architecture Diagram",
          text: "Join me to collaborate on this architecture diagram in real-time!",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#252526] rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#3e3e3e]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#d4d4d4]">
                Share Collaboration Link
              </h3>
              <p className="text-sm text-gray-500 dark:text-[#9ca3af]">
                Anyone with this link can join and edit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-[#d4d4d4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Room ID Display */}
          <div className="p-4 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
            <div className="flex items-center space-x-2 mb-2">
              <Link2 className="w-4 h-4 text-gray-500 dark:text-[#9ca3af]" />
              <span className="text-xs font-medium text-gray-600 dark:text-[#9ca3af]">
                Room ID
              </span>
            </div>
            <code className="text-sm font-mono text-gray-900 dark:text-[#d4d4d4] break-all">
              {roomId}
            </code>
          </div>

          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#d4d4d4] mb-2">
              Shareable Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3e3e3e] rounded-md text-gray-900 dark:text-[#d4d4d4] font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Web Share API Button (if supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={shareViaAPI}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md font-medium transition-all flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share via...</span>
            </button>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              🎯 How it works
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Share this link with your team members</li>
              <li>• They must be logged in to collaborate</li>
              <li>• All changes sync in real-time</li>
              <li>• See each other's cursors and edits</li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-400">
              ⚠️ Anyone with this link can edit your diagram. Only share with trusted collaborators.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-[#3e3e3e]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

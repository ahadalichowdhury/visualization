import { useEffect, useState } from "react";
import {
  architectureService,
  type ArchitectureListItem,
} from "../../services/architecture.service";
import { showError, showSuccess } from "../../utils/toast";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { UpgradePrompt } from "../common/UpgradePrompt";

interface ArchitectureManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (architectureId: string) => void;
  onNew: () => void;
  currentArchitectureId: string | null;
  scenarioId?: string;
  isFreeCanvas?: boolean; // New prop to indicate standalone canvas mode
}

export const ArchitectureManager: React.FC<ArchitectureManagerProps> = ({
  isOpen,
  onClose,
  onLoad,
  onNew,
  currentArchitectureId,
  scenarioId,
  isFreeCanvas = false,
}) => {
  const [architectures, setArchitectures] = useState<ArchitectureListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  
  const { 
    limits, 
    isFreeUser, 
    canCreateStandaloneCanvas, 
    getUpgradeMessage 
  } = useFeatureAccess();

  const loadArchitectures = async () => {
    try {
      setLoading(true);
      // If it's a free canvas (no scenario), only load standalone architectures
      const data = await architectureService.getUserArchitectures(
        scenarioId,
        isFreeCanvas,
      );
      setArchitectures(data);
    } catch (error) {
      showError("Failed to load architectures");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArchitectures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, scenarioId, isFreeCanvas]);

  const handleNewCanvas = () => {
    // Check if free user has reached standalone canvas limit
    if (isFreeCanvas && isFreeUser && !canCreateStandaloneCanvas()) {
      setUpgradeMessage(getUpgradeMessage('canvas'));
      setShowUpgrade(true);
      return;
    }

    // Check if free user has reached scenario architecture limit
    if (scenarioId && isFreeUser && architectures.length >= 1) {
      setUpgradeMessage(getUpgradeMessage('scenario'));
      setShowUpgrade(true);
      return;
    }

    onNew();
    onClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await architectureService.deleteArchitecture(id);
      showSuccess("Architecture deleted successfully");
      setArchitectures(architectures.filter((arch) => arch.id !== id));
      setDeleteConfirm(null);

      // If deleting current architecture, trigger new canvas
      if (id === currentArchitectureId) {
        onNew();
      }
    } catch (error) {
      showError("Failed to delete architecture");
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#252526] rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-[#3e3e3e]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3e3e3e] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Architectures
              </h2>
              {isFreeUser && limits && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isFreeCanvas ? (
                    <>
                      {limits.standalone_canvases.used} / {limits.standalone_canvases.limit} standalone canvases used
                    </>
                  ) : (
                    <>
                      {architectures.length} / 1 architecture for this scenario
                    </>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
            {/* New Canvas Button */}
            <button
              onClick={handleNewCanvas}
              className="w-full mb-6 p-4 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Create New Architecture
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Start with a blank canvas
                  </div>
                </div>
              </div>
            </button>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : architectures.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  No saved architectures yet
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  Create your first architecture to get started!
                </p>
              </div>
            ) : (
              /* Architecture List */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectures.map((arch) => (
                  <div
                    key={arch.id}
                    className={`relative group p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                      arch.id === currentArchitectureId
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-[#3e3e3e] bg-white dark:bg-[#2d2d2d] hover:border-blue-300 dark:hover:border-blue-600"
                    }`}
                  >
                    {/* Current Badge */}
                    {arch.id === currentArchitectureId && (
                      <div className="absolute -top-2 -right-2 bg-blue-600 dark:bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                        Current
                      </div>
                    )}

                    {/* Title and Description */}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {arch.title}
                      </h3>
                      {arch.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {arch.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                        <span>{arch.node_count} nodes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>{arch.edge_count} connections</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {arch.is_submitted && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                          ✓ Submitted
                        </span>
                      )}
                      {arch.score !== undefined && arch.score !== null && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full font-medium">
                          Score: {arch.score}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Updated: {formatDate(arch.updated_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onLoad(arch.id);
                          onClose();
                        }}
                        disabled={arch.id === currentArchitectureId}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                          arch.id === currentArchitectureId
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                        }`}
                      >
                        {arch.id === currentArchitectureId ? "Current" : "Load"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(arch.id)}
                        className="py-2 px-4 rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Delete Confirmation */}
                    {deleteConfirm === arch.id && (
                      <div className="absolute inset-0 bg-white dark:bg-[#252526] rounded-lg flex items-center justify-center p-4 border-2 border-red-500">
                        <div className="text-center">
                          <p className="text-gray-900 dark:text-white font-semibold mb-4">
                            Delete this architecture?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(arch.id)}
                              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradePrompt
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
        feature={isFreeCanvas ? 'canvas' : 'scenario'}
      />
    </>
  );
};

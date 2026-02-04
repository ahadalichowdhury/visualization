import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { scenarioService } from "../services/scenario.service";
import { useAuthStore } from "../store/authStore";
import type { ScenarioWithProgress } from "../types/scenario.types";

export const Scenarios = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [scenarios, setScenarios] = useState<ScenarioWithProgress[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string>("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Check if user is free tier (not premium)
  const isFreeUser = !user || user.subscription_tier === "free";

  // Ref for infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchScenarios = useCallback(
    async (cursor: string = "") => {
      try {
        const params = {
          cursor,
          limit: 12,
          category: selectedCategory || undefined,
          difficulty: selectedDifficulty || undefined,
          tier: selectedTier || undefined,
          search: searchTerm || undefined,
        };

        const response = isAuthenticated
          ? await scenarioService.getUserScenariosPaginated(params)
          : await scenarioService.getScenariosPaginated(params);

        if (cursor) {
          // Append to existing scenarios
          setScenarios((prev) => [
            ...prev,
            ...(response.scenarios as ScenarioWithProgress[]),
          ]);
        } else {
          // Replace scenarios (initial load or filter change)
          setScenarios(response.scenarios as ScenarioWithProgress[]);
        }

        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || "Failed to load scenarios");
      }
    },
    [
      isAuthenticated,
      selectedCategory,
      selectedDifficulty,
      selectedTier,
      searchTerm,
    ],
  );

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setScenarios([]);
      setNextCursor("");
      setHasMore(true);

      const categoriesData = await scenarioService.getCategories();
      setCategories(categoriesData);

      await fetchScenarios();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  }, [fetchScenarios]);

  // Reset and refetch when filters change or auth status changes
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);
      await fetchScenarios(nextCursor);
    } catch (err) {
      console.error("Failed to load more scenarios:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor, fetchScenarios]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-[#2d2d2d] text-gray-800";
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === "not_started") return null;

    const badges = {
      in_progress: (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          In Progress
        </span>
      ),
      completed: (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          ✓ Completed
        </span>
      ),
      completed_with_errors: (
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
          Completed with Errors
        </span>
      ),
    };

    return badges[status as keyof typeof badges];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading scenarios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            System Design Scenarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Learn system design through hands-on scenarios
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#252526] rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-[#3e3e3e]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search scenarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white transition-all"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white transition-all"
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Scenarios Grid */}
        {scenarios.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white dark:bg-[#252526] rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No scenarios found
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => {
                const isPremium = scenario.tier === "premium";
                const isLocked = isPremium && isFreeUser;

                return (
                  <Link
                    key={scenario.id}
                    to={isLocked ? "#" : `/scenarios/${scenario.id}`}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                        toast(
                          "This is a premium scenario. Upgrade to access it!",
                        );
                      }
                    }}
                    className={`bg-white dark:bg-[#252526] rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-[#3e3e3e] group relative ${
                      isLocked
                        ? "opacity-75 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                  >
                    {/* Premium Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="text-center text-white">
                          <svg
                            className="w-16 h-16 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <p className="font-semibold text-lg">Premium</p>
                          <p className="text-sm">Upgrade to unlock</p>
                        </div>
                      </div>
                    )}

                    {/* Premium Badge */}
                    {isPremium && (
                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          PREMIUM
                        </span>
                      </div>
                    )}

                    {/* Free Badge */}
                    {!isPremium && (
                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-3 py-1 bg-green-500 dark:bg-green-600 text-white text-xs font-bold rounded-full shadow">
                          FREE
                        </span>
                      </div>
                    )}

                    {scenario.thumbnail_url && (
                      <img
                        src={scenario.thumbnail_url}
                        alt={scenario.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {scenario.title}
                        </h3>
                        {getStatusBadge(scenario.status)}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {scenario.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                              scenario.difficulty,
                            )}`}
                          >
                            {scenario.difficulty}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {scenario.category}
                          </span>
                        </div>

                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {loadingMore && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Loading more scenarios...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* End of Results Message */}
            {!hasMore && scenarios.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  You've reached the end of the list
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

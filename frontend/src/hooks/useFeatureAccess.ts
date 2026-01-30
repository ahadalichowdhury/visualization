import { useEffect, useState } from "react";
import { architectureService } from "../services/architecture.service";
import { useAuthStore } from "../store/authStore";
import type { FeatureLimits } from "../types/auth.types";

export const useFeatureAccess = () => {
  const user = useAuthStore((state) => state.user);
  const [limits, setLimits] = useState<FeatureLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        setLoading(true);
        const data = await architectureService.getFeatureLimits();
        setLimits(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load feature limits",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [user]);

  const isFreeUser = user?.subscription_tier === "free";
  const isPremiumUser =
    user?.subscription_tier === "premium" ||
    user?.subscription_tier === "admin";
  const isAdminUser = user?.subscription_tier === "admin";

  const canCreateStandaloneCanvas = () => {
    if (!limits) return true; // Assume allowed if limits not loaded yet
    if (limits.standalone_canvases.unlimited) return true;
    return limits.standalone_canvases.used < limits.standalone_canvases.limit;
  };

  const canCreateScenarioArchitecture = () => {
    if (!limits) return true;
    if (limits.architectures_per_scenario.unlimited) return true;
    // Per-scenario count check is handled by backend on save
    return true;
  };

  const canAccessCollaboration = (isScenarioArchitecture: boolean) => {
    if (!limits) return true;
    if (isScenarioArchitecture) {
      return limits.collaboration.enabled_on_scenarios;
    }
    return limits.collaboration.enabled_on_canvases;
  };

  const getStandaloneCanvasLimit = () => {
    if (!limits) return null;
    return limits.standalone_canvases;
  };

  const getUpgradeMessage = (
    feature: "canvas" | "scenario" | "collaboration",
  ) => {
    switch (feature) {
      case "canvas":
        return "You have reached the maximum number of standalone canvases (2). Upgrade to Premium for unlimited canvases.";
      case "scenario":
        return "You have reached the maximum number of architectures for this scenario (1). Upgrade to Premium for unlimited architectures per scenario.";
      case "collaboration":
        return "Collaboration is not available on scenario architectures for free users. Upgrade to Premium to collaborate on scenarios.";
      default:
        return "Upgrade to Premium to unlock this feature.";
    }
  };

  return {
    user,
    limits,
    loading,
    error,
    isFreeUser,
    isPremiumUser,
    isAdminUser,
    canCreateStandaloneCanvas,
    canCreateScenarioArchitecture,
    canAccessCollaboration,
    getStandaloneCanvasLimit,
    getUpgradeMessage,
  };
};

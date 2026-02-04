import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { showError, showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "";

interface PricingTier {
  id: string;
  name: string;
  display_name: string;
  price: number;
  price_formatted: string;
  billing_period: string;
  description: string;
  features: string[];
  limitations: string[];
  is_highlighted: boolean;
  button_text: string;
  button_variant: "primary" | "secondary";
  max_standalone_canvases: number;
  max_architectures_per_scenario: number;
  collaboration_on_scenarios: boolean;
  collaboration_on_canvases: boolean;
  stripe_price_id?: string; // Add Stripe price ID
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  receipt_url?: string;
}

export const Subscription = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [showManagement, setShowManagement] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const token = localStorage.getItem("auth_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/subscription/plans`, {
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscription plans");
        }

        const data = await response.json();
        setPricingTiers(data.plans || []);
        // Use user's subscription_tier from auth store, fallback to API response
        setCurrentTier(user?.subscription_tier || data.current_tier || "free");
        console.log(
          "DEBUG: Current tier set to:",
          user?.subscription_tier || data.current_tier || "free",
        );
      } catch (error) {
        console.error("Error fetching plans:", error);
        showError("Failed to load subscription plans");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [user?.subscription_tier]);

  // Fetch payment history when management modal opens
  useEffect(() => {
    if (showManagement && currentTier === "premium") {
      fetchSubscriptionDetails();
      fetchPaymentHistory();
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showManagement, currentTier]);

  const fetchSubscriptionDetails = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_URL}/api/stripe/subscription-details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCancelAtPeriodEnd(data.cancel_at_period_end || false);
        setPeriodEnd(data.current_period_end || null);
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/stripe/payment-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll be downgraded to the Free plan at the end of your billing period.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_URL}/api/stripe/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cancel_at_period_end: true,
          }),
        },
      );

      if (response.ok) {
        showSuccess(
          "Subscription canceled. You'll retain access until the end of your billing period.",
        );
        setCancelAtPeriodEnd(true); // Update state
        // Optionally refresh the page or update state
      } else {
        const error = await response.json();
        showError(error.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      showError("An error occurred while canceling subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm("Are you sure you want to reactivate your subscription?")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_URL}/api/stripe/reactivate-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        showSuccess(
          "Subscription reactivated! Your subscription will continue automatically.",
        );
        setCancelAtPeriodEnd(false); // Update state
      } else {
        const error = await response.json();
        showError(error.error || "Failed to reactivate subscription");
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      showError("An error occurred while reactivating subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: PricingTier) => {
    if (tier.name.toLowerCase() === currentTier.toLowerCase()) return;

    setSelectedTier(tier.name);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");

      // For premium upgrades with Stripe
      if (tier.name === "premium" && tier.price > 0 && tier.stripe_price_id) {
        const response = await fetch(
          `${API_URL}/api/stripe/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              price_id: tier.stripe_price_id,
              plan_id: tier.id,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }

        const { checkout_url } = await response.json();

        // Redirect to Stripe Checkout
        window.location.href = checkout_url;
        return;
      }

      // For downgrades to free (or if no Stripe ID)
      const response = await fetch(`${API_URL}/api/user/subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription_tier: tier.name.toLowerCase(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      showSuccess(
        `Successfully ${tier.name === "free" ? "downgraded to" : "upgraded to"} ${tier.display_name}!`,
      );

      // Refresh user data
      window.location.reload();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to update subscription",
      );
      setLoading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e1e1e] dark:to-[#252526] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Select the perfect plan for your cloud architecture needs. Upgrade
            or downgrade anytime.
          </p>
          {user && (
            <div className="mt-4 sm:mt-6 inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm sm:text-base">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">
                Current Plan: <span className="capitalize">{currentTier}</span>
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingPlans ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Loading subscription plans...
              </p>
            </div>
          </div>
        ) : pricingTiers.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              No subscription plans available at the moment.
            </p>
          </div>
        ) : (
          <>
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
                    tier.is_highlighted
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 ring-4 ring-blue-500 dark:ring-blue-400 lg:scale-105"
                      : "bg-white dark:bg-[#252526] border-2 border-gray-200 dark:border-[#3e3e3e]"
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.is_highlighted && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 text-sm font-bold rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    {/* Tier Name */}
                    <h2
                      className={`text-2xl sm:text-3xl font-bold mb-2 ${
                        tier.is_highlighted
                          ? "text-white"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {tier.display_name}
                    </h2>

                    {/* Price */}
                    <div className="mb-4">
                      <span
                        className={`text-4xl sm:text-5xl font-bold ${
                          tier.is_highlighted
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {tier.price_formatted}
                      </span>
                      <span
                        className={`text-base sm:text-lg ml-2 ${
                          tier.is_highlighted
                            ? "text-blue-100"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {tier.billing_period === "forever"
                          ? "forever"
                          : `per ${tier.billing_period}`}
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className={`mb-6 text-sm sm:text-base ${
                        tier.is_highlighted
                          ? "text-blue-100"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {tier.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0 ${
                              tier.is_highlighted
                                ? "text-green-300"
                                : "text-green-500 dark:text-green-400"
                            }`}
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
                          <span
                            className={`text-sm sm:text-base ${
                              tier.is_highlighted
                                ? "text-white"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Limitations (for Free tier) */}
                    {tier.limitations && tier.limitations.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Limitations:
                        </p>
                        <ul className="space-y-1">
                          {tier.limitations.map((limitation, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                            >
                              <span className="mr-2">•</span>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button */}
                    {tier.name.toLowerCase() === currentTier.toLowerCase() &&
                    tier.name === "premium" ? (
                      <button
                        onClick={() => setShowManagement(true)}
                        className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Manage Subscription
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(tier)}
                        disabled={
                          loading ||
                          tier.name.toLowerCase() ===
                            currentTier.toLowerCase() ||
                          (tier.name === "free" && currentTier === "admin")
                        }
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                          tier.name.toLowerCase() ===
                            currentTier.toLowerCase() ||
                          (tier.name === "free" && currentTier === "admin")
                            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                            : tier.button_variant === "primary"
                              ? "bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl"
                              : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        } ${
                          loading && selectedTier === tier.name
                            ? "opacity-50 cursor-wait"
                            : ""
                        }`}
                      >
                        {loading && selectedTier === tier.name ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                            <span className="ml-2">Processing...</span>
                          </div>
                        ) : (
                          tier.button_text
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Subscription Management Modal */}
        {showManagement && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowManagement(false)}
          >
            <div
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#3e3e3e] p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Manage Subscription
                </h2>
                <button
                  onClick={() => setShowManagement(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
              <div className="p-6 space-y-6">
                {/* Current Plan */}
                <div
                  className={`rounded-xl p-6 border ${cancelAtPeriodEnd ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Current Plan
                  </h3>
                  <p
                    className={`text-2xl font-bold ${cancelAtPeriodEnd ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"}`}
                  >
                    Premium Plan {cancelAtPeriodEnd && "(Canceling)"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    $19/month • Unlimited access to all features
                  </p>
                  {cancelAtPeriodEnd && periodEnd && (
                    <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                        ⚠️ Your subscription will end on{" "}
                        {new Date(periodEnd).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        You'll have access to Premium features until then.
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Payment History
                  </h3>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Loading history...
                      </p>
                    </div>
                  ) : paymentHistory.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-[#252526] rounded-xl">
                      <p className="text-gray-600 dark:text-gray-400">
                        No payment history yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-gray-50 dark:bg-[#252526] rounded-lg p-4 flex justify-between items-center border border-gray-200 dark:border-[#3e3e3e]"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${payment.amount.toFixed(2)}{" "}
                              {payment.currency.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(
                                payment.created_at,
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                payment.created_at,
                              ).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                payment.status === "succeeded"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {payment.status}
                            </span>
                            {payment.receipt_url && (
                              <a
                                href={payment.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                              >
                                View Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cancel/Reactivate Subscription */}
                <div className="border-t border-gray-200 dark:border-[#3e3e3e] pt-6">
                  {cancelAtPeriodEnd ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Reactivate Subscription
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Changed your mind? Reactivate your subscription to
                        continue enjoying Premium features beyond{" "}
                        {periodEnd
                          ? new Date(periodEnd).toLocaleDateString()
                          : "the current period"}
                        .
                      </p>
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading
                          ? "Reactivating..."
                          : "Reactivate Subscription"}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Cancel Subscription
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You'll retain access to Premium features until the end
                        of your current billing period.
                      </p>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Canceling..." : "Cancel Subscription"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 sm:mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-[#252526] rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Yes! You can upgrade to Premium or downgrade to Free at any
                time. Changes take effect immediately.
              </p>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Your existing architectures will remain intact. However, you
                won't be able to create new ones beyond the free tier limits
                until you upgrade again.
              </p>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a team plan available?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Team plans are coming soon! They will include shared workspaces,
                team collaboration features, and centralized billing.
              </p>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and other popular
                payment methods through our secure payment processor.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            Need help choosing? Contact our support team
          </p>
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center px-4 sm:px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

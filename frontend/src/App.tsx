import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from "react-router-dom";
import { LoginForm } from "./components/auth/LoginForm";
import { PasswordResetRequest } from "./components/auth/PasswordReset";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RegisterForm } from "./components/auth/RegisterForm";
import { Header } from "./components/layout/Header";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Builder } from "./pages/Builder";
import { Dashboard } from "./pages/Dashboard";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Profile } from "./pages/Profile";
import { ScenarioDetail } from "./pages/ScenarioDetail";
import { Scenarios } from "./pages/Scenarios";
import { Subscription } from "./pages/Subscription";
import { SubscriptionSuccess } from "./pages/SubscriptionSuccess";
import { SubscriptionCancel } from "./pages/SubscriptionCancel";
import { useAuthStore } from "./store/authStore";
function App() {
  const { fetchProfile, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const isBuilder =
    location.pathname.startsWith("/builder") || location.pathname === "/canvas";

  useEffect(() => {
    // Fetch user profile on app load if token exists but not authenticated
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken && !isAuthenticated && !isLoading) {
      fetchProfile();
    }
  }, [fetchProfile, isAuthenticated, isLoading]);

  // Show loading spinner during initial authentication check
  if (isLoading && !isAuthenticated && localStorage.getItem("auth_token")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] flex flex-col">
        {!isBuilder && <Header />}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(17, 24, 39, 0.95)",
              color: "#fff",
              backdropFilter: "blur(10px)",
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<PasswordResetRequest />} />
          <Route path="/canvas" element={<Builder />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/scenarios/:id" element={<ScenarioDetail />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/builder/:scenarioId" element={<Builder />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancel" element={<SubscriptionCancel />} />

          {/* Pro features route */}
          <Route
            path="/pro"
            element={
              <ProtectedRoute requiredRole="pro">
                <div className="min-h-screen bg-gray-50 py-8">
                  <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-4">Pro Features</h1>
                    <div className="card">
                      <p>Pro features coming soon...</p>
                      <ul className="mt-4 space-y-2">
                        <li>✓ Sandbox Mode</li>
                        <li>✓ Failure Injection</li>
                        <li>✓ Advanced Visualizations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Admin route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div className="min-h-screen bg-gray-50 py-8">
                  <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
                    <div className="card">
                      <p>Admin panel coming soon...</p>
                      <ul className="mt-4 space-y-2">
                        <li>✓ User Management</li>
                        <li>✓ Role Assignment</li>
                        <li>✓ System Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;

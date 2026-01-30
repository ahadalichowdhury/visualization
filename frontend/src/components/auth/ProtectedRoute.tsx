import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'basic' | 'pro' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, fetchProfile, isLoading } = useAuthStore();

  useEffect(() => {
    if (!user && localStorage.getItem('auth_token')) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user) {
    const roleHierarchy = { basic: 0, pro: 1, admin: 2 };
    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-[#cccccc] mb-4">403</h1>
            <p className="text-xl text-gray-600 dark:text-[#9ca3af] mb-4">Access Denied</p>
            <p className="text-gray-500">
              You need {requiredRole} access to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

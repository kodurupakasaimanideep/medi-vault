/**
 * ProtectedRoute — Route guard middleware for authenticated users.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requiredRole="admin">
 *     <AdminPanel />
 *   </ProtectedRoute>
 *
 * Security:
 *  - Redirects unauthenticated users to /login
 *  - Optionally enforces role-based access (RBAC) for future admin features
 *  - Preserves the intended destination so after login the user is sent back
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, userProfile, loading } = useAuth();
  const location = useLocation();

  // Auth state is still being resolved — don't redirect prematurely
  if (loading) return null;

  // Not authenticated → send to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control (RBAC) — only enforced when requiredRole is set
  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { Role } from '../types';

export function ProtectedRoute({ roles, loginPath }: { roles: Role[]; loginPath: string }) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return <Navigate to={loginPath} state={{ from: location }} replace />;
  if (!roles.includes(user.role)) {
    // Role separation: a CHEF hitting /admin is bounced to their own panel.
    const fallback = user.role === 'CHEF' ? '/chef' : '/admin';
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Si se define, el usuario debe tener al menos uno de estos roles (según `hasRole`). */
  allowedRoles?: string[];
  /** Ruta si el usuario está autenticado pero sin rol permitido (403). Por defecto `/forbidden`. */
  forbiddenRedirect?: string;
}

export default function ProtectedRoute({
  children,
  fallback,
  allowedRoles,
  forbiddenRedirect = '/forbidden'
}: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      setIsChecking(false);
      navigate('/login', { replace: true });
      return;
    }

    if (loading) {
      return;
    }

    if (!user) {
      setIsChecking(false);
      navigate('/login', { replace: true });
      return;
    }

    setIsChecking(false);
  }, [user, loading, navigate]);

  useEffect(() => {
    if (loading || isChecking || !user || !allowedRoles?.length) return;

    const ok = allowedRoles.some((r) => hasRole(r));
    if (!ok) {
      navigate(forbiddenRedirect, { replace: true });
    }
  }, [user, loading, isChecking, allowedRoles, hasRole, navigate, forbiddenRedirect]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  if (allowedRoles?.length) {
    const ok = allowedRoles.some((r) => hasRole(r));
    if (!ok) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Redirigiendo…</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}





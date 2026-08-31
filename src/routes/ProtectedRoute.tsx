import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { decidirAccesoRuta } from '../features/auth/dashboard-path';

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
  const { user, loading } = useAuth();
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

    const decision = decidirAccesoRuta({ token, savedUser, user, allowedRoles });
    if (decision === 'login') {
      setIsChecking(false);
      navigate('/login', { replace: true });
      return;
    }
    if (decision === 'forbidden') {
      setIsChecking(false);
      navigate(forbiddenRedirect, { replace: true });
      return;
    }

    setIsChecking(false);
  }, [user, loading, navigate, allowedRoles, forbiddenRedirect]);

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
    const decision = decidirAccesoRuta({
      token: localStorage.getItem('token'),
      savedUser: localStorage.getItem('user'),
      user,
      allowedRoles,
    });
    if (decision === 'forbidden') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Redirigiendo…</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}





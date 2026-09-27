import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser } from '../features/auth/dashboard-path';
import { User, LogOut, Shield, GraduationCap, Crown, UserCircle } from 'lucide-react';
import Button from './Button';
import { Avatar, AvatarFallback } from './Avatar';

type ViewRole = 'coordinador' | 'profesor' | 'estudiante' | 'decano' | 'admin';

const ETIQUETA_ROL: Record<string, string> = {
  admin: 'Administrador',
  decano: 'Decano',
  coordinador: 'Coordinador',
  profesor: 'Docente',
  docente: 'Docente',
  estudiante: 'Estudiante',
}

function resolveViewRole(selected?: string, tipo?: string): ViewRole {
  const initial = (selected || tipo || 'estudiante').toLowerCase();
  if (initial === 'docente' || initial === 'teacher') return 'profesor';
  if (['coordinador', 'profesor', 'estudiante', 'decano', 'admin', 'administrator'].includes(initial)) {
    return (initial === 'administrator' ? 'admin' : initial) as ViewRole;
  }
  return 'estudiante';
}

function otrosDashboards(roles: string[], rolActual: string) {
  const vistos = new Set<string>()
  return roles.flatMap((rol) => {
    const normal = rol === 'docente' ? 'profesor' : rol
    const path = getDashboardPathForUser({ roles: [normal] })
    if (normal === rolActual || vistos.has(path)) return []
    vistos.add(path)
    return [{ rol: normal, etiqueta: ETIQUETA_ROL[rol] || rol, path }]
  })
}

export default function UserMenu() {
  const { user, logout, switchUserRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentViewRole, setCurrentViewRole] = useState<ViewRole>(() =>
    resolveViewRole(user?.selected_role, user?.tipo_usuario)
  );

  const rolesCuenta = user?.roles?.length
    ? user.roles
    : user?.tipo_usuario
      ? [user.tipo_usuario]
      : []
  const destinos = otrosDashboards(rolesCuenta, currentViewRole)
  const hasMultipleRoles = destinos.length > 0

  useEffect(() => {
    setCurrentViewRole(resolveViewRole(user?.selected_role, user?.tipo_usuario));
  }, [user?.selected_role, user?.tipo_usuario]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setIsOpen(false);
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const irARol = (rol: string, path: string) => {
    switchUserRole(rol)
    setCurrentViewRole(resolveViewRole(rol))
    navigate(path)
    setIsOpen(false)
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <User className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              {/* Header con información del usuario */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className="bg-gray-100 text-gray-700 text-sm"
                      text={`${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email}
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base leading-tight">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {currentViewRole === 'admin' ? (
                        <Shield className="h-3 w-3 text-red-600" />
                      ) : currentViewRole === 'coordinador' ? (
                        <Shield className="h-3 w-3 text-red-600" />
                      ) : currentViewRole === 'decano' ? (
                        <Crown className="h-3 w-3 text-red-600" />
                      ) : currentViewRole === 'estudiante' ? (
                        <User className="h-3 w-3 text-red-600" />
                      ) : (
                        <GraduationCap className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {currentViewRole === 'admin'
                          ? 'Administrador'
                          : currentViewRole === 'coordinador'
                          ? 'Coordinador'
                          : currentViewRole === 'decano'
                          ? 'Decano'
                          : currentViewRole === 'estudiante'
                          ? 'Estudiante'
                          : 'Profesor'}
                      </span>
                      {hasMultipleRoles && (
                        <span className="text-xs text-red-500 font-medium">
                          (Activo)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opciones del menú */}
              <div className="p-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 mb-1"
                >
                  <UserCircle className="h-4 w-4 mr-3" />
                  Mi perfil
                </Button>

                {destinos.map((destino) => (
                  <Button
                    key={destino.path}
                    variant="ghost"
                    onClick={() => irARol(destino.rol, destino.path)}
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 mb-1 border border-blue-200 rounded-lg"
                  >
                    <Shield className="h-4 w-4 mr-3 text-red-600" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Cambiar a {destino.etiqueta}</span>
                      <span className="text-xs text-gray-500">Vista de {destino.etiqueta.toLowerCase()}</span>
                    </div>
                  </Button>
                ))}
                
                {/* Cerrar sesión */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de logout */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={cancelLogout}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Confirmar Cierre de Sesión
                      </h3>
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que quieres cerrar sesión?
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={cancelLogout}
                      className="px-4"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmLogout}
                      className="px-4 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
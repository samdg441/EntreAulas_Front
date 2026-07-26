import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Shield, GraduationCap, Crown } from 'lucide-react';
import Button from './Button';

export default function UserMenu() {
  const { user, logout, hasRole, switchUserRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Inicializar el rol de vista basado en el rol seleccionado o tipo_usuario
  const [currentViewRole, setCurrentViewRole] = useState<'coordinador' | 'profesor' | 'estudiante' | 'decano'>(() => {
    const initial = (user?.selected_role || user?.tipo_usuario || 'estudiante').toLowerCase();
    return (['coordinador','profesor','estudiante','decano'].includes(initial) ? initial : 'estudiante') as 'coordinador' | 'profesor' | 'estudiante' | 'decano';
  });

  // Verificar si el usuario tiene múltiples roles usando la lógica del AuthContext
  const isCoordinator = hasRole('coordinador');
  const isProfessor = hasRole('profesor');
  const isDean = hasRole('decano');
  const hasMultipleRoles = !!user?.multiple_roles || ((isCoordinator ? 1 : 0) + (isProfessor ? 1 : 0) + (isDean ? 1 : 0) > 1);
  
  // Determinar el rol actual basado en el tipo_usuario principal
  const currentRole = user?.tipo_usuario || 'estudiante';
  
  // Debug: Log para verificar la detección de roles
  console.log('🔍 UserMenu Debug:', {
    user: user,
    isCoordinator,
    isProfessor,
    hasMultipleRoles,
    userRoles: user?.roles,
    tipo_usuario: user?.tipo_usuario,
    currentViewRole,
    currentRole
  });

  // Sincronizar el rol de vista cuando el usuario cambie
  useEffect(() => {
    const next = (user?.selected_role || user?.tipo_usuario) as ('coordinador' | 'profesor' | 'estudiante' | 'decano' | undefined)
    if (next) setCurrentViewRole(next)
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

  const switchRole = () => {
    // Determinar siguiente rol al que se debe cambiar según disponibilidad real
    // Preferencia: decano > coordinador > profesor, pero siempre evitando el rol actual
    const canGoDean = isDean && currentViewRole !== 'decano'
    const canGoCoordinator = isCoordinator && currentViewRole !== 'coordinador'
    const canGoProfessor = isProfessor && currentViewRole !== 'profesor'

    if (canGoDean) {
      setCurrentViewRole('decano')
      console.log('🔄 Cambiando a decano')
      // No tocamos tipo_usuario porque el contexto solo soporta (coordinador|profesor)
      navigate('/dashboard-decano')
    } else if (canGoCoordinator) {
      setCurrentViewRole('coordinador')
      switchUserRole('coordinador')
      console.log('🔄 Cambiando a coordinador')
      navigate('/dashboard-coordinador')
    } else if (canGoProfessor) {
      setCurrentViewRole('profesor')
      switchUserRole('profesor')
      console.log('🔄 Cambiando a profesor')
      navigate('/dashboard-profesor')
    }
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
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
            >
              {/* Header con información del usuario */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base leading-tight">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {currentViewRole === 'coordinador' ? (
                        <Shield className="h-3 w-3 text-red-600" />
                      ) : currentViewRole === 'decano' ? (
                        <Crown className="h-3 w-3 text-red-600" />
                      ) : currentViewRole === 'estudiante' ? (
                        <User className="h-3 w-3 text-red-600" />
                      ) : (
                        <GraduationCap className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {currentViewRole === 'coordinador' ? 'Coordinador' : 
                         currentViewRole === 'decano' ? 'Decano' :
                         currentViewRole === 'estudiante' ? 'Estudiante' : 'Profesor'}
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
                {/* Cambio de rol si tiene múltiples roles */}
                {hasMultipleRoles && (
                  <Button
                    variant="ghost"
                    onClick={switchRole}
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 mb-1 border border-blue-200 rounded-lg"
                  >
                    {/* Icono del rol destino */}
                    {(() => {
                      const targetIsDean = isDean && currentViewRole !== 'decano'
                      const targetIsCoordinator = isCoordinator && currentViewRole !== 'coordinador' && !targetIsDean
                      return targetIsDean ? (
                        <Shield className="h-4 w-4 mr-3 text-red-600" />
                      ) : targetIsCoordinator ? (
                        <Shield className="h-4 w-4 mr-3 text-red-600" />
                      ) : (
                        <GraduationCap className="h-4 w-4 mr-3 text-red-600" />
                      )
                    })()}
                    <div className="flex flex-col items-start">
                      {(() => {
                        const targetLabel = isDean && currentViewRole !== 'decano'
                          ? 'Decano'
                          : (isCoordinator && currentViewRole !== 'coordinador')
                          ? 'Coordinador'
                          : 'Profesor'
                        const targetSub = targetLabel === 'Decano'
                          ? 'Vista de decano'
                          : targetLabel === 'Coordinador'
                          ? 'Vista de coordinador'
                          : 'Vista de docente'
                        return (
                          <>
                            <span className="font-medium">Cambiar a {targetLabel}</span>
                            <span className="text-xs text-gray-500">{targetSub}</span>
                          </>
                        )
                      })()}
                    </div>
                  </Button>
                )}
                
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
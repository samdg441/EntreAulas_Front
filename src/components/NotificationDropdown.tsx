import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, CalendarClock, X, ExternalLink } from 'lucide-react';
import Button from './Button';
import { getVentanasEvaluacion } from '../api/periodos.api';
import { notificacionesDeEvaluacion, type Notificacion } from '../lib/notificaciones';

const CLAVE_LEIDAS = 'notificaciones-leidas';

function leerLeidas(): string[] {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '[]');
    return Array.isArray(guardadas) ? guardadas : [];
  } catch {
    return [];
  }
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [leidas, setLeidas] = useState<string[]>(leerLeidas);

  useEffect(() => {
    if (!user) return;
    let activo = true;
    getVentanasEvaluacion()
      .then((ventanas) => {
        if (activo) setNotifications(notificacionesDeEvaluacion(new Date(), ventanas, user.tipo_usuario));
      })
      .catch(() => {
        if (activo) setNotifications([]);
      });
    return () => {
      activo = false;
    };
  }, [user]);

  const guardarLeidas = (ids: string[]) => {
    const unicas = Array.from(new Set(ids));
    setLeidas(unicas);
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(unicas));
  };

  const esLeida = (n: Notificacion) => leidas.includes(n.id);
  const unreadCount = notifications.filter((n) => !esLeida(n)).length;

  const markAllAsRead = () => guardarLeidas([...leidas, ...notifications.map((n) => n.id)]);

  const handleNotificationClick = (notification: Notificacion) => {
    if (!esLeida(notification)) guardarLeidas([...leidas, notification.id]);
    if (notification.accion) {
      setIsOpen(false);
      navigate(notification.accion.ruta);
    }
  };

  const fondoNotificacion = (n: Notificacion) => {
    if (esLeida(n)) return 'bg-gray-50 border-gray-200';
    return n.urgente ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 rounded-full"></span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notificaciones
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Marcar todas como leídas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6"
                      aria-label="Cerrar notificaciones"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} no leída{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${fondoNotificacion(notification)}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <CalendarClock className={`h-4 w-4 ${notification.urgente ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-medium ${esLeida(notification) ? 'text-gray-600' : 'text-gray-900'}`}>
                                {notification.titulo}
                              </h4>
                              {!esLeida(notification) && (
                                <div className="h-2 w-2 bg-red-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.mensaje}
                            </p>
                            {notification.accion && (
                              <div className="flex justify-end mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 p-1 h-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  {notification.accion.texto}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

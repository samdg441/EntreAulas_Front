import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  BookOpen,
  Users,
  Settings,
  X,
  ExternalLink
} from 'lucide-react';
import Button from './Button';

interface Notification {
  id: string;
  type: 'evaluation' | 'performance' | 'academic' | 'system';
  title: string;
  message: string;
  time: string;
  urgent: boolean;
  read: boolean;
  action?: {
    text: string;
    link: string;
  };
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generar notificaciones de ejemplo basadas en el rol del usuario
  useEffect(() => {
    if (!user) return;

    const generateNotifications = (): Notification[] => {
      const baseNotifications: Notification[] = [
        // Evaluaciones
        {
          id: 'eval-1',
          type: 'evaluation',
          title: 'Evaluación Pendiente',
          message: 'Tienes 3 evaluaciones por completar este semestre',
          time: 'Hace 2 horas',
          urgent: true,
          read: false,
          action: {
            text: 'Ver evaluaciones',
            link: '/evaluate/selection'
          }
        },
        {
          id: 'eval-2',
          type: 'evaluation',
          title: 'Nueva Evaluación Disponible',
          message: 'Evaluación disponible para Proyecto de Ingeniería',
          time: 'Hace 1 día',
          urgent: false,
          read: false,
          action: {
            text: 'Evaluar ahora',
            link: '/evaluate/selection'
          }
        },
        {
          id: 'eval-3',
          type: 'evaluation',
          title: 'Recordatorio de Evaluación',
          message: 'La evaluación de Código Limpio vence en 2 días',
          time: 'Hace 3 horas',
          urgent: true,
          read: true
        },
        {
          id: 'eval-4',
          type: 'evaluation',
          title: 'Resultados Disponibles',
          message: 'Los resultados de Algoritmos y Estructuras de Datos están listos',
          time: 'Hace 5 horas',
          urgent: false,
          read: false,
          action: {
            text: 'Ver resultados',
            link: '/reports'
          }
        }
      ];

      // Notificaciones de rendimiento
      const performanceNotifications: Notification[] = [
        {
          id: 'perf-1',
          type: 'performance',
          title: 'Mejora en Calificaciones',
          message: 'Tu calificación promedio subió 0.5 puntos este mes',
          time: 'Hace 1 día',
          urgent: false,
          read: false,
          action: {
            text: 'Ver estadísticas',
            link: '/reports'
          }
        },
        {
          id: 'perf-2',
          type: 'performance',
          title: 'Rendimiento Destacado',
          message: 'Estás 15% por encima del promedio del departamento',
          time: 'Hace 2 días',
          urgent: false,
          read: true
        }
      ];

      // Notificaciones académicas
      const academicNotifications: Notification[] = [
        {
          id: 'acad-1',
          type: 'academic',
          title: 'Nuevo Curso Asignado',
          message: 'Se asignó el curso "Desarrollo Web" a tu carga académica',
          time: 'Hace 4 horas',
          urgent: false,
          read: false
        },
        {
          id: 'acad-2',
          type: 'academic',
          title: 'Cambio de Horario',
          message: 'El horario de "Base de Datos" cambió a Martes 8:00 AM',
          time: 'Hace 6 horas',
          urgent: true,
          read: false
        },
        {
          id: 'acad-3',
          type: 'academic',
          title: 'Reunión Programada',
          message: 'Reunión de coordinación programada para mañana 2:00 PM',
          time: 'Hace 1 día',
          urgent: false,
          read: true
        }
      ];

      // Notificaciones del sistema
      const systemNotifications: Notification[] = [
        {
          id: 'sys-1',
          type: 'system',
          title: 'Mantenimiento Programado',
          message: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM',
          time: 'Hace 2 días',
          urgent: false,
          read: true
        },
        {
          id: 'sys-2',
          type: 'system',
          title: 'Nueva Funcionalidad',
          message: 'Reportes mejorados disponibles en la sección de estadísticas',
          time: 'Hace 3 días',
          urgent: false,
          read: false,
          action: {
            text: 'Explorar',
            link: '/reports'
          }
        }
      ];

      // Combinar todas las notificaciones
      return [
        ...baseNotifications,
        ...performanceNotifications,
        ...academicNotifications,
        ...systemNotifications
      ];
    };

    const allNotifications = generateNotifications();
    setNotifications(allNotifications);
    
    // Contar notificaciones no leídas
    const unread = allNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [user]);

  const getNotificationIcon = (type: string, urgent: boolean) => {
    const iconClass = `h-4 w-4 ${urgent ? 'text-red-600' : 'text-blue-600'}`;
    
    switch (type) {
      case 'evaluation':
        return <CheckCircle className={iconClass} />;
      case 'performance':
        return <TrendingUp className={iconClass} />;
      case 'academic':
        return <BookOpen className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getNotificationBg = (urgent: boolean, read: boolean) => {
    if (urgent && !read) return 'bg-red-50 border-red-200';
    if (!read) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Actualizar contador
    const unread = notifications.filter(n => n.id !== notificationId && !n.read).length;
    setUnreadCount(unread);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action) {
      // Aquí podrías usar navigate si necesitas navegación
      console.log('Navegando a:', notification.action.link);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 rounded-full"></span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden"
            >
              {/* Header */}
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

              {/* Notifications List */}
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
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${getNotificationBg(notification.urgent, notification.read)}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type, notification.urgent)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-red-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                              {notification.action && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 p-1 h-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  {notification.action.text}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

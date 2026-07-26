import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CardHeader, 
  CardContent, 
  CardDescription, 
  CardTitle 
} from '../components/Card';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Header from '../components/Header';
import { User } from '../types';
import { 
  Settings, 
  Calendar as CalendarIcon, 
  ClipboardCheck, 
  Bell, 
  Star,
  BookOpen,
  Clock,
  TrendingUp,
  Users,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  UserCog,
  AlertCircle,
  User as UserIcon,
  Award,
  Target,
  MessageSquare,
  FileText,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Building,
  GraduationCap,
  PieChart,
  Activity,
  Database,
  Server,
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { useState } from 'react';

// Importar el componente Calendar externo
import Calendar from '../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface DashboardAdminProps {
  user: User;
}

// Componente reutilizable para las cards
interface SectionCardProps {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
}

const SectionCard = ({ title, icon: Icon, children, className = '' }: SectionCardProps) => {
  return (
    <Card className={`bg-white shadow-md border border-gray-200 p-6 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-700" />
          <CardTitle className="text-xl text-gray-900">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default function DashboardAdmin({ user }: DashboardAdminProps) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Cargar user desde backend/localStorage si existe
  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      return {
        id: parsed.id,
        name: `${parsed.nombre} ${parsed.apellido}`.trim(),
        type: (parsed.tipo_usuario as any) ?? 'admin',
        email: parsed.email,
      } as User;
    } catch {
      return null;
    }
  })();
  
  const handleSystemSettings = () => {
    navigate('/admin/settings');
  };

  const handleUserManagement = () => {
    navigate('/admin/users');
  };

  const handleSystemReports = () => {
    navigate('/admin/reports');
  };

  const handleDatabaseManagement = () => {
    navigate('/admin/database');
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const currentUser = user ?? storedUser ?? { id: '', name: 'Administrador', type: 'admin', email: '' };

  // Datos específicos para administradores
  const adminData = {
    stats: {
      totalUsers: 1250,
      activeUsers: 1180,
      totalEvaluations: 2500,
      systemUptime: '99.9%',
      storageUsed: '2.3GB',
      lastBackup: '2025-01-20',
      securityAlerts: 2
    },
    systemHealth: [
      { 
        id: 1, 
        service: 'Base de Datos', 
        status: 'healthy', 
        uptime: '99.9%',
        responseTime: '45ms',
        lastCheck: '2 min'
      },
      { 
        id: 2, 
        service: 'API Backend', 
        status: 'healthy', 
        uptime: '99.8%',
        responseTime: '120ms',
        lastCheck: '1 min'
      },
      { 
        id: 3, 
        service: 'Frontend', 
        status: 'healthy', 
        uptime: '100%',
        responseTime: '85ms',
        lastCheck: '30 seg'
      },
      { 
        id: 4, 
        service: 'Autenticación', 
        status: 'warning', 
        uptime: '98.5%',
        responseTime: '200ms',
        lastCheck: '5 min'
      }
    ],
    recentActivity: [
      { 
        id: 1, 
        user: 'Dr. Juan Pérez', 
        action: 'Inició sesión', 
        time: '2 min',
        type: 'login'
      },
      { 
        id: 2, 
        user: 'Sistema', 
        action: 'Backup automático completado', 
        time: '15 min',
        type: 'system'
      },
      { 
        id: 3, 
        user: 'Ana Coordinadora', 
        action: 'Creó nueva evaluación', 
        time: '1 hora',
        type: 'evaluation'
      },
      { 
        id: 4, 
        user: 'Admin', 
        action: 'Actualizó configuración del sistema', 
        time: '2 horas',
        type: 'admin'
      }
    ],
    notifications: [
      { id: 1, text: 'Alerta de seguridad: 2 intentos de login fallidos detectados', time: '5 min', urgent: true },
      { id: 2, text: 'Backup del sistema completado exitosamente', time: '15 min', urgent: false },
      { id: 3, text: 'Nuevo usuario registrado: María Estudiante', time: '1 hora', urgent: false },
      { id: 4, text: 'Reporte de uso del sistema disponible', time: '2 horas', urgent: false },
      { id: 5, text: 'Actualización de seguridad disponible', time: '1 día', urgent: false }
    ],
    quickActions: [
      {
        icon: UserCog,
        label: 'Gestión de Usuarios',
        description: 'Administrar usuarios del sistema',
        onClick: handleUserManagement,
        variant: 'default' as const,
        className: 'bg-red-600 hover:bg-red-700 text-white'
      },
      {
        icon: Settings,
        label: 'Configuración del Sistema',
        description: 'Ajustes y configuración',
        onClick: handleSystemSettings,
        variant: 'outline' as const,
        className: 'border-gray-300 text-gray-600 hover:bg-gray-50'
      },
      {
        icon: BarChart3,
        label: 'Reportes del Sistema',
        description: 'Análisis y estadísticas',
        onClick: handleSystemReports,
        variant: 'outline' as const,
        className: 'border-red-300 text-red-600 hover:bg-red-50'
      },
      {
        icon: Database,
        label: 'Gestión de Base de Datos',
        description: 'Administrar datos',
        onClick: handleDatabaseManagement,
        variant: 'outline' as const,
        className: 'border-red-300 text-red-600 hover:bg-red-50'
      },
      {
        icon: CalendarIcon,
        label: 'Calendario',
        description: 'Fechas importantes',
        onClick: toggleCalendar,
        variant: 'outline' as const,
        className: 'border-gray-300'
      }
    ]
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Fondo fijo que cubre toda la página */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
      </div>
      
      {/* Overlay más oscuro para mejor contraste */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Usamos el componente Header */}
        <Header user={currentUser} />
        
        <main className="max-w-[1700px] mx-auto p-6 lg:p-8 space-y-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardContent className="space-y-3">
                <h2 className="text-3xl font-semibold text-gray-900">
                  {getGreeting()}, Admin {currentUser.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-gray-600">
                  Panel de administración del sistema. Gestiona usuarios, configuración y monitorea el rendimiento.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards - Específicas para administradores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Usuarios */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total de Usuarios
                  </CardTitle>
                  <Users className="h-6 w-6 text-red-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {adminData.stats.totalUsers}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    {adminData.stats.activeUsers} activos
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Evaluaciones */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total Evaluaciones
                  </CardTitle>
                  <ClipboardCheck className="h-6 w-6 text-green-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {adminData.stats.totalEvaluations}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    En el sistema
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Uptime del Sistema */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Uptime del Sistema
                  </CardTitle>
                  <Server className="h-6 w-6 text-yellow-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {adminData.stats.systemUptime}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Disponibilidad
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Alertas de Seguridad */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Alertas de Seguridad
                  </CardTitle>
                  <Shield className="h-6 w-6 text-orange-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {adminData.stats.securityAlerts}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Requieren atención
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Acciones Rápidas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white shadow-md border border-gray-200 p-6">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-gray-700" />
                      <CardTitle className="text-2xl text-gray-900">Panel de Administración</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      Herramientas de gestión y administración del sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {adminData.quickActions.map((action, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={action.onClick}
                            variant={action.variant}
                            className={`w-full h-auto py-5 flex flex-col items-center gap-3 ${action.className}`}
                          >
                            <action.icon className="h-8 w-8" />
                            <div className="text-center">
                              <div className="font-medium text-lg">
                                {action.label}
                              </div>
                              <div className="text-sm opacity-80">
                                {action.description}
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Estado del Sistema */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-white shadow-md border border-gray-200 p-6">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-gray-700" />
                      <CardTitle className="text-2xl text-gray-900">Estado del Sistema</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      Monitoreo de servicios y rendimiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {adminData.systemHealth.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-lg text-gray-900">{service.service}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-sm py-1 ${
                                  service.status === 'healthy' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : service.status === 'warning'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {service.status === 'healthy' ? 'Saludable' : 
                                 service.status === 'warning' ? 'Advertencia' : 'Error'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Uptime:</span>
                                <span className="ml-1 font-medium">{service.uptime}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Tiempo de respuesta:</span>
                                <span className="ml-1 font-medium">{service.responseTime}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Última verificación:</span>
                                <span className="ml-1 font-medium">{service.lastCheck}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Columna lateral */}
            <div className="space-y-8">
              {/* Notificaciones */}
              <SectionCard title="Notificaciones del Sistema" icon={Bell}>
                <div className="space-y-4">
                  {adminData.notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.urgent 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <p className="text-base font-medium text-gray-900">{notification.text}</p>
                      <p className="text-sm text-gray-500 mt-2">{notification.time}</p>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>

              {/* Actividad Reciente */}
              <SectionCard title="Actividad Reciente" icon={Activity}>
                <div className="space-y-4">
                  {adminData.recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            activity.type === 'login' ? 'bg-red-50 text-red-700 border-red-200' :
                            activity.type === 'system' ? 'bg-green-50 text-green-700 border-green-200' :
                            activity.type === 'evaluation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {activity.type === 'login' ? 'Login' :
                           activity.type === 'system' ? 'Sistema' :
                           activity.type === 'evaluation' ? 'Evaluación' : 'Admin'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>

              {/* Información del Administrador */}
              <SectionCard title="Información del Administrador" icon={UserIcon}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-sm text-gray-600">Administrador del Sistema</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Acceso completo al sistema</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Último backup: {adminData.stats.lastBackup}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Calendario */}
      <AnimatePresence>
        {showCalendar && <Calendar onClose={toggleCalendar} />}
      </AnimatePresence>
    </div>
  );
}

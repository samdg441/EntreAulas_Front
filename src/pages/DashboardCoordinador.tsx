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
import Header from '../components/Header';
import { User } from '../types';
import {
  Calendar as CalendarIcon,
  BookOpen,
  Users,
  Mail,
  BarChart3,
  User as UserIcon,
  Award,
  GraduationCap,
  Target,
  TrendingUp,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { fetchCoordinatorDashboardSummary, CoordinatorTeacherSummary } from '../api/teachers';

// Importar el componente Calendar externo
import Calendar from '../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface DashboardCoordinadorProps {
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

export default function DashboardCoordinador({ user }: DashboardCoordinadorProps) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState<CoordinatorTeacherSummary[]>([]);
  const [stats, setStats] = useState({
    totalProfesores: 0,
    totalCursos: 0,
    promedioEvaluaciones: 0,
    profesoresEnRiesgo: 0,
    totalEvaluaciones: 0
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 0 });

  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      return {
        id: parsed.id,
        name: `${parsed.nombre} ${parsed.apellido}`.trim(),
        type: (parsed.tipo_usuario as any) ?? 'coordinator',
        email: parsed.email,
        roles: parsed.roles || []
      } as User;
    } catch {
      return null;
    }
  })();

  const currentUser = user ?? storedUser ?? { id: '', name: 'Coordinador', type: 'coordinator', email: '', roles: [] };

  useEffect(() => {
    const id = window.setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoadingStats(true);
        const response = await fetchCoordinatorDashboardSummary({
          page,
          pageSize: pagination.pageSize,
          search: searchTerm
        });
        setStats(response.stats);
        setTeachers(response.teachers || []);
        setPagination(response.pagination || { page: 1, pageSize: 8, total: 0, totalPages: 0 });
      } catch (error) {
        console.error('Error cargando resumen del coordinador:', error);
        setTeachers([]);
      } finally {
        setLoadingStats(false);
      }
    };
    loadSummary();
  }, [page, pagination.pageSize, searchTerm]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const quickActions = useMemo(() => ([
    {
      icon: Users,
      label: 'Gestionar Profesores',
      description: 'Ver y administrar profesores',
      onClick: () => navigate('/profesores/gestionar'),
      variant: 'default' as const,
      className: 'bg-red-600 hover:bg-red-700 text-white'
    },
    {
      icon: BookOpen,
      label: 'Programar Encuestas',
      description: 'Definir período y fechas para encuestas',
      onClick: () => navigate('/surveys/schedule'),
      variant: 'outline' as const,
      className: 'border-red-300 text-red-600 hover:bg-red-50'
    },
    {
      icon: BarChart3,
      label: 'Reportes Generales',
      description: 'Ver estadísticas de la carrera',
      onClick: () => navigate('/reports'),
      variant: 'outline' as const,
      className: 'border-red-300 text-red-600 hover:bg-red-50'
    },
    {
      icon: CalendarIcon,
      label: 'Calendario',
      description: 'Fechas importantes',
      onClick: () => setShowCalendar(true),
      variant: 'outline' as const,
      className: 'border-red-300 text-red-600 hover:bg-red-50'
    }
  ]), [navigate]);


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const riesgoGlobal = stats.promedioEvaluaciones > 0 && stats.promedioEvaluaciones < 4;

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
                  {getGreeting()}, Coord. {currentUser.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-gray-600">
                  Bienvenido a tu panel de control como coordinador. Aquí puedes supervisar los profesores de tu carrera y gestionar la actividad académica.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards - datos reales de BD */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total Profesores
                  </CardTitle>
                  <Users className="h-6 w-6 text-green-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {loadingStats ? (
                      <div className="animate-pulse bg-green-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalProfesores
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Profesores activos de tu carrera
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Cursos Activos
                  </CardTitle>
                  <BookOpen className="h-6 w-6 text-purple-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {loadingStats ? (
                      <div className="animate-pulse bg-purple-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalCursos
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Cursos activos de tu carrera
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className={`shadow-md p-6 border ${riesgoGlobal ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Promedio General
                  </CardTitle>
                  {riesgoGlobal
                    ? <AlertTriangle className="h-6 w-6 text-red-600 ml-4" />
                    : <TrendingUp className="h-6 w-6 text-yellow-600 ml-4" />
                  }
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${riesgoGlobal ? 'text-red-600' : 'text-yellow-600'}`}>
                    {loadingStats ? (
                      <div className="animate-pulse bg-yellow-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.promedioEvaluaciones || 0
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    {riesgoGlobal ? 'Atención: promedio menor a 4.0' : 'Promedio general de evaluaciones'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Docentes en Riesgo
                  </CardTitle>
                  <AlertTriangle className="h-6 w-6 text-red-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {loadingStats ? (
                      <div className="animate-pulse bg-red-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.profesoresEnRiesgo
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">Promedio &lt; 4.0 (con evaluaciones)</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62 }}
                className="h-full"
              >
                <SectionCard title="Información del Coordinador" icon={UserIcon} className="h-full">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{currentUser.name}</p>
                        <p className="text-sm text-gray-600">Coordinador-Profesor</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                        <p className="text-sm text-gray-700 break-all">{currentUser.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500 shrink-0" />
                        <p className="text-sm text-gray-700">Facultad de Ingeniería</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gray-500 shrink-0" />
                        <p className="text-sm text-gray-700">Coordinador Académico</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="h-full"
              >
                <Card className="bg-white shadow-md border border-gray-200 p-6 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-gray-700" />
                      <CardTitle className="text-2xl text-gray-900">Acciones Rápidas</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      Herramientas para gestionar tu actividad como coordinador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {quickActions.map((action, index) => (
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
            </div>

          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-gray-900">Resumen de docentes</CardTitle>
                <CardDescription>
                  Lista paginada de docentes de tu carrera. Promedios menores a 4.0 se muestran resaltados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por nombre o correo..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3">Docente</th>
                        <th className="px-4 py-3">Correo</th>
                        <th className="px-4 py-3">Evaluaciones</th>
                        <th className="px-4 py-3">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingStats ? (
                        <tr>
                          <td className="px-4 py-4 text-center text-gray-500" colSpan={4}>
                            Cargando docentes...
                          </td>
                        </tr>
                      ) : teachers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-center text-gray-500" colSpan={4}>
                            No se encontraron docentes para el filtro actual.
                          </td>
                        </tr>
                      ) : (
                        teachers.map((t) => {
                          const low = t.totalEvaluaciones > 0 && t.promedio < 4;
                          return (
                            <tr key={t.profesorId} className={`border-t ${low ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-4 py-3 font-medium text-gray-900">{t.nombre}</td>
                              <td className="px-4 py-3 text-gray-600">{t.email || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{t.totalEvaluaciones}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                  low
                                    ? 'bg-red-100 text-red-700'
                                    : t.totalEvaluaciones === 0
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {t.totalEvaluaciones === 0 ? 'Sin datos' : t.promedio.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Mostrando {(teachers.length === 0 || pagination.total === 0) ? 0 : ((pagination.page - 1) * pagination.pageSize + 1)}
                    {' - '}
                    {(teachers.length === 0 || pagination.total === 0) ? 0 : ((pagination.page - 1) * pagination.pageSize + teachers.length)}
                    {' de '}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={loadingStats || pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-700">
                      Página {pagination.totalPages === 0 ? 0 : pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                      disabled={loadingStats || pagination.page >= pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Modal de Calendario */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Calendario Académico</h3>
                <Button variant="outline" onClick={() => setShowCalendar(false)}>
                  Cerrar
                </Button>
              </div>
              <Calendar onClose={() => setShowCalendar(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



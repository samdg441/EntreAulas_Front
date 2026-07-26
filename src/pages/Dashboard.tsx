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
  ClipboardCheck, 
  Star,
  BookOpen,
  Users,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  User as UserIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchStudentStats, fetchStudentEnrolledSubjects } from '../api/teachers';

// Importar el componente Calendar externo
import Calendar from '../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface DashboardProps {
  user: User;
  onStartEvaluation?: () => void;
  onViewReports?: () => void;
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

export default function Dashboard({ user, onStartEvaluation, onViewReports }: DashboardProps) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Estado para datos del backend
  const [studentStats, setStudentStats] = useState({
    evaluacionesCompletadas: 0,
    evaluacionesPendientes: 0,
    materiasMatriculadas: 0,
    promedioGeneral: 0,
    progresoGeneral: 0
  });
  const [materiasMatriculadas, setMateriasMatriculadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mapear tipo_usuario del backend (español) al tipo del frontend (inglés)
  const normalizeUserType = (tipo: string | undefined): 'student' | 'teacher' | 'coordinator' | 'decano' => {
    const t = (tipo || '').toLowerCase();
    if (t === 'estudiante') return 'student';
    if (t === 'profesor' || t === 'docente') return 'teacher';
    if (t === 'coordinador') return 'coordinator';
    if (t === 'admin') return 'decano';
    return 'student';
  };

  // Cargar user desde backend/localStorage si existe
  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      return {
        id: parsed.id,
        name: `${parsed.nombre} ${parsed.apellido}`.trim(),
        type: normalizeUserType(parsed.tipo_usuario),
        email: parsed.email,
      } as User;
    } catch {
      return null;
    }
  })();

  // Datos específicos por tipo de usuario
  const currentUser = user ?? storedUser ?? { id: '', name: 'Usuario', type: 'student', email: '' };

  // Cargar datos del backend para estudiantes
  useEffect(() => {
    const loadStudentData = async () => {
      console.log('🔍 Frontend: Loading student data for user type:', currentUser.type);
      if (currentUser.type === 'student') {
        try {
          setLoading(true);
          setError('');
          const [statsData, materiasData] = await Promise.all([
            fetchStudentStats(),
            fetchStudentEnrolledSubjects()
          ]);

          setStudentStats({
            evaluacionesCompletadas: Number(statsData?.evaluacionesCompletadas ?? 0),
            evaluacionesPendientes: Number(statsData?.evaluacionesPendientes ?? 0),
            materiasMatriculadas: Number(statsData?.materiasMatriculadas ?? 0),
            promedioGeneral: Number(statsData?.promedioGeneral ?? 0),
            progresoGeneral: Number(statsData?.progresoGeneral ?? 0)
          });
          setMateriasMatriculadas(Array.isArray(materiasData?.materiasMatriculadas) ? materiasData.materiasMatriculadas : []);
          console.log('✅ Frontend: Student data loaded');
        } catch (error: any) {
          console.warn('⚠️ Error loading student data, showing dashboard with zeros:', error?.response?.data?.error || error?.message);
          setError('');
          setStudentStats({
            evaluacionesCompletadas: 0,
            evaluacionesPendientes: 0,
            materiasMatriculadas: 0,
            promedioGeneral: 0,
            progresoGeneral: 0
          });
          setMateriasMatriculadas([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [currentUser.type]);
  
  const handleStartEvaluation = () => {
    navigate('/evaluate/selection');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleViewSurvey = () => {
    navigate('/survey');
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

  const getUserSpecificData = () => {
    console.log('🔍 Frontend: getUserSpecificData called with studentStats:', studentStats);
    switch (currentUser.type) {
      case 'student':
        return {
          stats: {
            evaluationsPending: studentStats.evaluacionesPendientes,
            evaluationsCompleted: studentStats.evaluacionesCompletadas,
            currentCourses: studentStats.materiasMatriculadas,
            averageGrade: studentStats.promedioGeneral
          },
          upcomingEvaluations: [
            { id: 1, course: 'Matemáticas I', teacher: 'Dr. Juan Pérez', deadline: '2025-01-25' },
            { id: 2, course: 'Física II', teacher: 'Dra. Ana Martín', deadline: '2025-01-28' }
          ],
          quickActions: [
            {
              icon: ClipboardCheck,
              label: 'Nueva Evaluación',
              description: 'Evaluar un docente',
              onClick: handleStartEvaluation,
              variant: 'default' as const,
              className: 'bg-red-600 hover:bg-red-700 text-white'
            },
            {
              icon: CalendarIcon,
              label: 'Ver Calendario',
              description: 'Fechas importantes',
              onClick: toggleCalendar,
              variant: 'outline' as const,
              className: 'border-gray-300'
            }
          ]
        };
      case 'teacher':
        return {
          stats: {
            averageRating: 4.7,
            totalEvaluations: 45,
            coursesTeaching: 4,
            pendingReviews: 5
          },
          quickActions: [
            {
              icon: BarChart3,
              label: 'Análisis y Reportes',
              description: 'Ver mis estadísticas',
              onClick: handleViewReports,
              variant: 'default' as const,
              className: 'bg-red-600 hover:bg-red-650 text-white'
            },
            {
              icon: ClipboardCheck,
              label: 'Ver Encuesta',
              description: 'Ver la encuesta de mi carrera',
              onClick: handleViewSurvey,
              variant: 'outline' as const,
              className: 'border-gray-300'
            }
          ]
        };
      case 'coordinator':
        return {
          stats: {
            totalTeachers: 24,
            evaluationsCompleted: 180,
            averageRating: 4.5,
            pendingApprovals: 3
          },
          upcomingEvaluations: [
            { id: 1, course: 'Departamento de Matemáticas', period: 'Ciclo 2025-1', deadline: '2025-01-25' },
            { id: 2, course: 'Departamento de Física', period: 'Ciclo 2025-1', deadline: '2025-01-28' }
          ],
          quickActions: [
            {
              icon: Users,
              label: 'Gestión de Profesores',
              description: 'Administrar docentes',
              onClick: () => console.log('Gestión de Profesores'),
              variant: 'default' as const,
              className: 'bg-green-600 hover:bg-green-700 text-white'
            },
            {
              icon: BarChart3,
              label: 'Reportes Generales',
              description: 'Ver reportes del departamento',
              onClick: handleViewReports,
              variant: 'outline' as const,
              className: 'border-gray-300'
            }
          ]
        };
      default:
        return {
          stats: {
            evaluationsPending: 2,
            evaluationsCompleted: 5,
            currentCourses: 6,
            averageGrade: 8.7
          },
          upcomingEvaluations: [
            { id: 1, course: 'Matemáticas I', teacher: 'Dr. Juan Pérez', deadline: '2025-01-25' },
            { id: 2, course: 'Física II', teacher: 'Dra. Ana Martín', deadline: '2025-01-28' }
          ],
          quickActions: [
            {
              icon: ClipboardCheck,
              label: 'Nueva Evaluación',
              description: 'Evaluar un docente',
              onClick: handleStartEvaluation,
              variant: 'default' as const,
              className: 'bg-red-600 hover:bg-red-700 text-white'
            },
            {
              icon: CalendarIcon,
              label: 'Ver Calendario',
              description: 'Fechas importantes',
              onClick: toggleCalendar,
              variant: 'outline' as const,
              className: 'border-gray-300'
            }
          ]
        };
    }
  };

  const userData = getUserSpecificData();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Evitar pantalla en blanco: mostrar carga o error
  if (loading && currentUser.type === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div className="relative z-10">
          <Header user={currentUser} />
          <main className="max-w-[1700px] mx-auto p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              <p className="mt-4 text-gray-700">Cargando tu dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && currentUser.type === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div className="relative z-10">
          <Header user={currentUser} />
          <main className="max-w-[1700px] mx-auto p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full rounded-lg bg-white p-6 shadow-lg border border-gray-200">
              <p className="text-red-600 font-medium">Error al cargar los datos</p>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <Button className="mt-4" onClick={() => { setError(''); setLoading(true); window.location.reload(); }}>
                Reintentar
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        {/* Overlay oscuro que cubre toda la página */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
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
                  {getGreeting()}, {user.type === 'teacher' ? '' : ''} {user.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-gray-600">
                  Aquí tienes un resumen de tu actividad reciente en el sistema.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contenedor para poder reordenar secciones según viewport */}
          <div className="flex flex-col gap-8">
            {/* En móvil: primero acciones rápidas; en desktop: primero estadísticas */}
            <div className="order-1 lg:order-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Card combinada de Acciones Rápidas */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="bg-white shadow-md border border-gray-200 p-6">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5 text-gray-700" />
                          <CardTitle className="text-2xl text-gray-900">Cosas por hacer:</CardTitle>
                        </div>
                        <CardDescription className="text-base">
                          Aca estan las opciones de lo que puedes realizar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Acciones Rápidas */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {userData.quickActions.map((action, index) => (
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
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Columna lateral - Información de Usuario */}
                <div className="space-y-8">
                  <SectionCard title="Información del Usuario" icon={UserIcon}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {user.type === 'student' ? 'Estudiante' :
                              user.type === 'teacher' ? 'Profesor' :
                              'Coordinador'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600">+123 456 7890</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600">Facultad de Ingeniería</p>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>

            {/* Sección de estadísticas: en móvil va debajo, en desktop arriba */}
            <div className="order-2 lg:order-1">
              {/* Stats Cards - Específicas para cada tipo de usuario */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta 1 - Diferente según el tipo de usuario */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white shadow-md border border-gray-200 p-6">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-lg font-medium text-gray-900 text-left">
                        {user.type === 'student'
                          ? 'Evaluaciones Pendientes'
                          : user.type === 'teacher'
                          ? 'Calificación Promedio'
                          : user.type === 'coordinator'
                          ? 'Total de Profesores'
                          : 'Evaluaciones Pendientes'}
                      </CardTitle>
                      {user.type === 'student' ? (
                        <ClipboardCheck className="h-6 w-6 text-red-600 ml-4" />
                      ) : user.type === 'teacher' ? (
                        <Star className="h-6 w-6 text-yellow-600 ml-4" />
                      ) : user.type === 'coordinator' ? (
                        <Users className="h-6 w-6 text-red-600 ml-4" />
                      ) : (
                        <ClipboardCheck className="h-6 w-6 text-red-600 ml-4" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-3xl font-bold ${
                          user.type === 'student'
                            ? 'text-red-600'
                            : user.type === 'teacher'
                            ? 'text-yellow-600'
                            : user.type === 'coordinator'
                            ? 'text-red-600'
                            : 'text-red-600'
                        }`}
                      >
                        {user.type === 'student'
                          ? userData.stats.evaluationsPending
                          : user.type === 'teacher'
                          ? userData.stats.averageRating
                          : user.type === 'coordinator'
                          ? userData.stats.totalTeachers
                          : userData.stats.evaluationsPending}
                        {user.type === 'teacher' && '/5.0'}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-left">
                        {user.type === 'student'
                          ? 'Deben completarse pronto'
                          : user.type === 'teacher'
                          ? 'Última evaluación'
                          : user.type === 'coordinator'
                          ? 'En el departamento'
                          : 'Deben completarse pronto'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tarjeta 2 - Evaluaciones Completadas/Total Evaluaciones */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white shadow-md border border-gray-200 p-6">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-lg font-medium text-gray-900 text-left">
                        {user.type === 'student'
                          ? 'Evaluaciones Completadas'
                          : user.type === 'teacher'
                          ? 'Total Evaluaciones'
                          : 'Evaluaciones Completadas'}
                      </CardTitle>
                      <Star className="h-6 w-6 text-green-600 ml-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {user.type === 'student'
                          ? userData.stats.evaluationsCompleted
                          : user.type === 'teacher'
                          ? userData.stats.totalEvaluations
                          : userData.stats.evaluationsCompleted}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-left">
                        {user.type === 'student'
                          ? 'Este período académico'
                          : user.type === 'teacher'
                          ? 'Evaluaciones recibidas'
                          : 'En el sistema'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tarjeta 3 - Cursos Actuales/Cursos Impartidos */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-white shadow-md border border-gray-200 p-6">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-lg font-medium text-gray-900 text-left">
                        {user.type === 'student'
                          ? 'Cursos Matriculados'
                          : user.type === 'teacher'
                          ? 'Cursos Impartidos'
                          : 'Cursos Matriculados'}
                      </CardTitle>
                      <BookOpen className="h-6 w-6 text-university-red ml-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-university-red">
                        {user.type === 'student'
                          ? userData.stats.currentCourses
                          : user.type === 'teacher'
                          ? userData.stats.coursesTeaching
                          : userData.stats.pendingApprovals}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-left">
                        {user.type === 'student'
                          ? 'Este semestre'
                          : user.type === 'teacher'
                          ? 'Este semestre'
                          : 'Por revisar'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Calendario - Usando el componente externo */}
      <AnimatePresence>
        {showCalendar && <Calendar onClose={toggleCalendar} />}
      </AnimatePresence>
    </div>
  );
}
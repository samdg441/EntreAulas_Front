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
  Calendar as CalendarIcon, 
  ClipboardCheck, 
  Star,
  BookOpen,
  Mail,
  BarChart3,
  User as UserIcon,
  Award,
  Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchTeacherStats, fetchTeacherCourses, fetchTeacherId } from '../api/teachers';

// Importar el componente Calendar externo
import Calendar from '../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface DashboardProfesorProps {
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

export default function DashboardProfesor({ user }: DashboardProfesorProps) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [teacherStats, setTeacherStats] = useState<any>(null);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  
  
  // Cargar user desde backend/localStorage si existe
  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      return {
        id: parsed.id,
        name: `${parsed.nombre} ${parsed.apellido}`.trim(),
        type: (parsed.tipo_usuario as any) ?? 'teacher',
        email: parsed.email,
      } as User;
    } catch {
      return null;
    }
  })();
  
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

  const currentUser = user ?? storedUser ?? { id: '', name: 'Profesor', type: 'teacher', email: '' };

  // Cargar estadísticas del profesor
  useEffect(() => {
    const loadTeacherData = async () => {
      if (!currentUser.id) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        setStatsError(null);
        console.log('🔍 Loading teacher data for user ID:', currentUser.id);
        
        // Primero obtener el ID del profesor
        const teacherId = await fetchTeacherId();
        console.log('🔍 Teacher ID obtained:', teacherId);
        
        // Cargar estadísticas y cursos en paralelo usando el ID del profesor
        const [stats, courses] = await Promise.allSettled([
          fetchTeacherStats(teacherId),
          fetchTeacherCourses(teacherId)
        ]);
        
        // Manejar estadísticas
        if (stats.status === 'fulfilled') {
          console.log('✅ Teacher stats loaded:', stats.value);
          setTeacherStats(stats.value);
        } else {
          console.error('❌ Error loading teacher stats:', stats.reason);
          setTeacherStats(null);
        }
        
        // Manejar cursos
        if (courses.status === 'fulfilled') {
          console.log('✅ Teacher courses loaded:', courses.value);
          setTeacherCourses(courses.value || []);
        } else {
          console.error('❌ Error loading teacher courses:', courses.reason);
          setTeacherCourses([]); // Si hay error, mostrar 0 cursos
        }
      } catch (error) {
        console.error('❌ Error loading teacher data:', error);
        setStatsError('Error al cargar los datos del profesor');
      } finally {
        setLoadingStats(false);
      }
    };

    loadTeacherData();
  }, [currentUser.id]);


  const activePeriodCode = teacherCourses.find((c: any) => !!c?.grupo?.periodo?.codigo)?.grupo?.periodo?.codigo || '2026-1';

  // Datos específicos para profesores
  const realStats = {
    averageRating: teacherStats?.calificacionPromedio || 0,
    totalEvaluations: teacherStats?.totalEvaluaciones || 0,
    coursesTeaching: teacherStats?.cursosImpartidos || teacherCourses?.length || 0,
    groupsTeaching: teacherStats?.totalGruposImpartidos || teacherCourses?.length || 0,
    evaluatedCourses: teacherStats?.evaluacionesPorCurso?.length || 0,
    pendingReviews: 0,
    currentSemester: activePeriodCode
  };

  const realEvaluations = teacherStats?.evaluacionesPorCurso?.map((curso: any) => ({
    id: curso.curso_id,
    course: curso.nombre,
    students: curso.total,
    completed: curso.total,
    answeredSurveys: curso.encuestasRespondidas ?? curso.total ?? 0,
    average: curso.promedio,
    period: `Semestre ${activePeriodCode}`,
    status: 'completed'
  })) || [];

  const selectableCourses = (() => {
    const fromStats = (teacherStats?.evaluacionesPorCurso || []).map((c: any) => ({
      id: String(c.curso_id),
      name: c.nombre || 'Curso'
    }));
    const fromAssignments = (teacherCourses || []).map((c: any) => ({
      id: String(c?.curso?.id || c?.id || ''),
      name: c?.curso?.nombre || c?.nombre || c?.name || 'Curso'
    })).filter((c: any) => c.id);

    const map = new Map<string, string>();
    [...fromStats, ...fromAssignments].forEach((c: any) => {
      if (!map.has(c.id)) map.set(c.id, c.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  })();

  const groupsByCourseId = teacherCourses.reduce((acc: Record<string, number>, item: any) => {
    const id = item?.curso?.id;
    if (!id) return acc;
    const key = String(id);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const profesorData = {
    stats: realStats,
    recentEvaluations: realEvaluations,
    quickActions: [
        {
          icon: BarChart3,
          label: 'Mis Estadísticas',
          description: 'Ver análisis detallado',
          onClick: handleViewReports,
          variant: 'default' as const,
          className: 'bg-red-600 hover:bg-red-700 text-white'
        },
        {
          icon: ClipboardCheck,
          label: 'Ver Encuesta',
          description: 'Ver la encuesta de mi carrera',
          onClick: handleViewSurvey,
          variant: 'outline' as const,
          className: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
        },
        {
          icon: CalendarIcon,
          label: 'Calendario',
          description: 'Fechas importantes',
          onClick: toggleCalendar,
          variant: 'outline' as const,
          className: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
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
                  {getGreeting()}, Prof. {currentUser.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-gray-600">
                  Bienvenido a tu panel de control docente. Aquí puedes gestionar tus evaluaciones y ver tu rendimiento.
                </p>
                {/* Se eliminó el mensaje de datos de ejemplo */}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards - Específicas para profesores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Calificación Promedio */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-yellow-100 p-6 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Calificación Promedio
                  </CardTitle>
                  <Star className="h-6 w-6 text-yellow-600 ml-4" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="text-3xl font-bold text-gray-400">
                      Cargando...
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-yellow-600 tracking-tight">
                      {profesorData.stats.averageRating > 0 ? `${profesorData.stats.averageRating}/5.0` : '0.0/5.0'}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    {loadingStats ? 'Cargando datos...' : 'Calificación promedio'}
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
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-green-100 p-6 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total Evaluaciones
                  </CardTitle>
                  <ClipboardCheck className="h-6 w-6 text-green-600 ml-4" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="text-3xl font-bold text-gray-400">
                      Cargando...
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-green-600 tracking-tight">
                      {profesorData.stats.totalEvaluations || 0}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    {loadingStats ? 'Cargando datos...' : 'Evaluaciones recibidas'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cursos y Grupos Impartidos */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-red-100 p-6 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Carga Académica
                  </CardTitle>
                  <BookOpen className="h-6 w-6 text-red-600 ml-4" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="text-3xl font-bold text-gray-400">
                      Cargando...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-red-600 tracking-tight">
                        {profesorData.stats.coursesTeaching} cursos
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-gray-800">{profesorData.stats.groupsTeaching} grupos</span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    {loadingStats ? 'Cargando datos...' : 'Asignaciones activas del docente'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card eliminada: Cursos Evaluados (redundante) */}

          </div>

          {/* Fila superior: acciones + perfil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6 h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-gray-700" />
                    <CardTitle className="text-2xl text-gray-900">Acciones Rápidas</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Herramientas para gestionar tu actividad docente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profesorData.quickActions.map((action, index) => (
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

            <div className="h-full">
              <SectionCard title="Información del Profesor" icon={UserIcon} className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-sm text-gray-600">Profesor</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Facultad de Ingeniería</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Semestre {profesorData.stats.currentSemester}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Fila inferior: evaluaciones a ancho completo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-700" />
                    <CardTitle className="text-2xl text-gray-900">Evaluaciones Recientes</CardTitle>
                  </div>
                  {/* Filtro por curso */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="course-filter" className="text-sm text-gray-600 whitespace-nowrap">
                      Filtrar por curso:
                    </label>
                    <select
                      id="course-filter"
                      value={selectedCourseFilter}
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[200px]"
                    >
                      <option value="all">Todos los cursos</option>
                      {selectableCourses.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <CardDescription className="text-base mt-2">
                  Estado de tus evaluaciones por curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50">
                  <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Total general</p>
                  <p className="text-2xl font-bold text-green-700">{profesorData.stats.totalEvaluations} evaluaciones</p>
                  <p className="text-sm text-green-700/90">Consolidado de todos tus cursos en el período {activePeriodCode}</p>
                </div>
                {/* Resumen del curso seleccionado */}
                {selectedCourseFilter !== 'all' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {(() => {
                      const cursoStats = (teacherStats?.evaluacionesPorCurso || []).find((c: any) => (c.curso_id?.toString() === selectedCourseFilter));
                      const promedio = cursoStats?.promedio ?? 0;
                      const total = cursoStats?.total ?? 0;
                      const respondidas = cursoStats?.encuestasRespondidas ?? total;
                      const gruposDelCurso = groupsByCourseId[selectedCourseFilter] || 0;
                      const nombre = cursoStats?.nombre ?? 'Curso seleccionado';
                      return (
                        <>
                          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-500">Curso</p>
                            <p className="text-lg font-semibold text-gray-900">{nombre}</p>
                            <p className="text-xs text-gray-500 mt-1">{gruposDelCurso} grupo(s) asignado(s)</p>
                          </div>
                          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-500">Promedio</p>
                            <p className="text-lg font-semibold text-yellow-600">{promedio}/5.0</p>
                          </div>
                          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-500">Encuestas respondidas</p>
                            <p className="text-lg font-semibold text-green-600">{respondidas}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                <div className="space-y-4">
                  {loadingStats ? (
                    <div className="text-center py-8 text-gray-500">
                      Cargando evaluaciones...
                    </div>
                  ) : statsError ? (
                    <div className="text-center py-8 text-red-500">
                      Error al cargar las evaluaciones
                    </div>
                  ) : profesorData.recentEvaluations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay evaluaciones disponibles
                    </div>
                  ) : (
                    (() => {
                      const filteredEvaluations = profesorData.recentEvaluations
                        .filter((evaluation: any) => selectedCourseFilter === 'all' || evaluation.id?.toString() === selectedCourseFilter);
                      
                      if (filteredEvaluations.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            No hay evaluaciones para el curso seleccionado
                          </div>
                        );
                      }
                      
                      return filteredEvaluations.map((evaluation: any, index: number) => (
                        <motion.div
                          key={evaluation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-lg text-gray-900">{evaluation.course}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-sm py-1 ${
                                  evaluation.status === 'completed' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {evaluation.status === 'completed' ? 'Completada' : 'En Progreso'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Estudiantes:</span>
                                <span className="ml-1 font-medium">{evaluation.students}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Encuestas:</span>
                                <span className="ml-1 font-medium">{evaluation.answeredSurveys ?? evaluation.completed}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Promedio:</span>
                                <span className="ml-1 font-medium">{evaluation.average}/5.0</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ));
                    })()
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Modal de Calendario */}
      <AnimatePresence>
        {showCalendar && <Calendar onClose={toggleCalendar} />}
      </AnimatePresence>
    </div>
  );
}
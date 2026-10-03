import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CardHeader, 
  CardContent, 
  CardTitle 
} from '../../components/Card';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { User } from '../../types';
import { 
  Calendar as CalendarIcon, 
  BookOpen,
  Users,
  BarChart3,
  Award,
  Target,
  GraduationCap,
  TrendingUp,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProfessorSubjects, fetchDetailedFacultyProfessors, fetchAllCareerResults } from '../../api/teachers';

// Importar el componente Calendar externo
import Calendar from '../../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../../assets/fondo.webp', import.meta.url).href;

interface DashboardDecanoProps {
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

export default function DashboardDecano({ user }: DashboardDecanoProps) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [careers, setCareers] = useState<any[]>([]);
  const [professorsByCareer, setProfessorsByCareer] = useState<{[key: string]: any[]}>({});
  const [loadingCareers, setLoadingCareers] = useState(true);
  
  // Cargar user desde backend/localStorage si existe
  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      return {
        id: parsed.id,
        name: `${parsed.nombre} ${parsed.apellido}`.trim(),
        type: (parsed.tipo_usuario as any) ?? 'decano',
        email: parsed.email,
        roles: parsed.roles || []
      } as User;
    } catch {
      return null;
    }
  })();

  const currentUser = user ?? storedUser ?? { id: '', name: 'Decano', type: 'decano', email: '', roles: [] };

  const checkDecanoRole = () => (currentUser.roles || []).includes('decano');

  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [promedioGeneral, setPromedioGeneral] = useState<number | null>(null);
  const [intentoCarga, setIntentoCarga] = useState(0);

  // Cargar datos de la facultad
  useEffect(() => {
    let activo = true;

    const cargarProfesores = async () => {
      try {
        return await fetchProfessorSubjects();
      } catch {
        return await fetchDetailedFacultyProfessors();
      }
    };

    const loadFacultyData = async () => {
      setLoadingCareers(true);
      setErrorCarga(null);
      const [profesores, resultados] = await Promise.allSettled([cargarProfesores(), fetchAllCareerResults()]);
      if (!activo) return;

      if (profesores.status === 'fulfilled') {
        setCareers(profesores.value?.carreras || []);
        setProfessorsByCareer(profesores.value?.profesores_por_carrera || {});
      } else {
        setCareers([]);
        setProfessorsByCareer({});
        setErrorCarga('No pudimos cargar las carreras y profesores de la facultad.');
      }

      const promedio =
        resultados.status === 'fulfilled' ? Number(resultados.value?.estadisticas_generales?.promedio_general) : Number.NaN;
      setPromedioGeneral(Number.isFinite(promedio) && promedio > 0 ? promedio : null);
      setLoadingCareers(false);
    };

    loadFacultyData();
    return () => {
      activo = false;
    };
  }, [intentoCarga]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const decanoData = {
    stats: {
      totalCarreras: careers.length,
      totalProfesores: Object.values(professorsByCareer).flat().length,
      promedioEvaluaciones: promedioGeneral
    },
    quickActions: [
      {
        icon: Building2,
        label: 'Ver Todos los Profesores',
        description: 'Explorar profesores por carrera',
        onClick: () => navigate('/professors'),
        variant: 'outline' as const,
        className: 'border-red-300 text-red-600 hover:bg-red-50'
      },
      {
        icon: BarChart3,
        label: 'Reportes Generales',
        description: 'Ver estadísticas de la facultad',
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
      },
      {
        icon: BookOpen,
        label: 'Materias por Carrera',
        description: 'Ver materias de cada carrera',
        onClick: () => navigate('/career-subjects'),
        variant: 'outline' as const,
        className: 'border-red-300 text-red-600 hover:bg-red-50'
      },
      {
        icon: GraduationCap,
        label: 'Resultados por Carrera',
        description: 'Gestionar resultados académicos',
        onClick: () => navigate('/career-results'),
        variant: 'outline' as const,
        className: 'border-red-300 text-red-600 hover:bg-red-50'
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
                  {getGreeting()}, Decano {currentUser.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-gray-600">
                  Bienvenido al panel de control de la Facultad de Ingenierías. Aquí puedes gestionar todas las carreras y supervisar el rendimiento académico.
                </p>
                {!checkDecanoRole() && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Nota:</strong> Tu usuario no tiene el rol de 'decano' asignado. 
                          Algunas funcionalidades pueden estar limitadas. 
                          Contacta al administrador para asignar el rol correcto.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Roles actuales: {currentUser.roles?.join(', ') || 'Ninguno'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {errorCarga && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#991B1B]">{errorCarga} Revisa tu conexión e inténtalo de nuevo.</p>
              <Button variant="outline" className="sm:ml-auto" onClick={() => setIntentoCarga((n) => n + 1)}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Stats Cards - Específicas para decanos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total de Carreras */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total de Carreras
                  </CardTitle>
                  <Building2 className="h-6 w-6 text-blue-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {loadingCareers ? '...' : decanoData.stats.totalCarreras}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Carreras en la facultad
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total de Profesores */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Total de Profesores
                  </CardTitle>
                  <Users className="h-6 w-6 text-green-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {loadingCareers ? '...' : decanoData.stats.totalProfesores}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Profesores en la facultad
                  </p>
                  {!loadingCareers && !errorCarga && decanoData.stats.totalProfesores === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aún no hay profesores asignados.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Promedio de Evaluaciones */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 text-left">
                    Promedio General
                  </CardTitle>
                  <Award className="h-6 w-6 text-yellow-600 ml-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {loadingCareers && '...'}
                    {!loadingCareers && decanoData.stats.promedioEvaluaciones !== null && `${decanoData.stats.promedioEvaluaciones.toFixed(1)}/5.0`}
                    {!loadingCareers && decanoData.stats.promedioEvaluaciones === null && (
                      <span className="text-xl text-gray-400">Sin datos</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-left">
                    Calificación promedio
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
                      <Target className="h-5 w-5 text-gray-700" />
                      <CardTitle className="text-2xl text-gray-900">Acciones Rápidas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {decanoData.quickActions.map((action, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={action.onClick}
                            variant={action.variant}
                            className={`w-full p-4 h-auto flex flex-col items-start gap-2 ${action.className}`}
                          >
                            <div className="flex items-center gap-3">
                              <action.icon className="h-5 w-5" />
                              <span className="font-medium">{action.label}</span>
                            </div>
                            <span className="text-sm opacity-90">{action.description}</span>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </div>

            {/* Columna lateral */}
            <div className="space-y-8">
              {/* Top Carreras */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <SectionCard title="Carreras Destacadas" icon={GraduationCap}>
                  <div className="space-y-3">
                    {careers.length > 0 ? (
                      careers
                        .map((career: any) => ({
                          ...career,
                          professorCount: professorsByCareer[career.id.toString()]?.length || 0
                        }))
                        .sort((a: any, b: any) => b.professorCount - a.professorCount)
                        .slice(0, 3)
                        .map((career: any, index: number) => (
                          <div
                            key={career.id}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer"
                            onClick={() => navigate('/professors')}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{career.nombre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-600">{career.professorCount} profesores</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Cargando datos de carreras...
                      </div>
                    )}
                  </div>
                </SectionCard>
              </motion.div>

              
            </div>
          </div>
        </main>
      </div>

      {/* Modal del Calendario */}
      <AnimatePresence>
        {showCalendar && (
          <Calendar onClose={() => setShowCalendar(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

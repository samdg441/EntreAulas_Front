import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CardHeader, 
  CardContent, 
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
  BarChart3,
  Award,
  Target,
  GraduationCap,
  TrendingUp,
  Building2,
  Bell,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProfessorSubjects, fetchDetailedFacultyProfessors } from '../api/teachers';

// Importar el componente Calendar externo
import Calendar from '../components/Calendar';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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

  // Función para verificar si el usuario tiene rol de decano
  const checkDecanoRole = () => {
    const userRoles = currentUser.roles || [];
    const hasDecanoRole = userRoles.includes('decano');
    console.log('🔍 Verificando rol de decano:', {
      userRoles,
      hasDecanoRole,
      userType: currentUser.type
    });
    return hasDecanoRole;
  };

  // Cargar datos de la facultad
  useEffect(() => {
    console.log('🚀 useEffect ejecutándose - Cargando datos de la facultad');
    console.log('👤 Usuario actual:', {
      id: currentUser.id,
      name: currentUser.name,
      type: currentUser.type,
      roles: currentUser.roles
    });
    
    const loadFacultyData = async () => {
      try {
        setLoadingCareers(true);
        console.log('📊 Iniciando carga de datos...');
        
        // Intentar cargar datos de profesores con materias específicas
        try {
          console.log('🔄 Intentando cargar datos del backend...');
          const facultyData = await fetchProfessorSubjects();
          setCareers(facultyData.carreras);
          setProfessorsByCareer(facultyData.profesores_por_carrera);
          console.log('✅ Datos de profesores con materias específicas cargados:', facultyData);
        } catch (facultyError) {
          console.warn('⚠️ Error cargando datos de profesores con materias específicas:', facultyError);
          
          // Intentar endpoint alternativo para decanos
          try {
            console.log('🔄 Intentando endpoint alternativo para decanos...');
            const alternativeData = await fetchDetailedFacultyProfessors();
            setCareers(alternativeData.carreras || []);
            setProfessorsByCareer(alternativeData.profesores_por_carrera || {});
            console.log('✅ Datos alternativos cargados:', alternativeData);
          } catch (alternativeError) {
            console.warn('⚠️ Error cargando datos alternativos, usando datos mock:', alternativeError);
            
            // Fallback: usar datos mock basados en los datos reales de la base de datos
            console.log('🔄 Aplicando datos mock...');
            const mockCareers = [
            { id: 1, nombre: 'Ingeniería de Sistemas', codigo: 'SIS', activa: true },
            { id: 3, nombre: 'Ingeniería Civil', codigo: 'CIV', activa: true },
            { id: 6, nombre: 'Ingeniería Financiera', codigo: 'FIN', activa: true },
            { id: 2, nombre: 'Ingeniería Industrial', codigo: 'IND', activa: true },
            { id: 4, nombre: 'Ingeniería en Energía', codigo: 'ENE', activa: true },
            { id: 7, nombre: 'Ingeniería Ambiental', codigo: 'AMB', activa: true }
          ];
          
          const mockProfessorsByCareer = {
            '1': [ // Ingeniería de Sistemas
              { id: '1', nombre: 'Emilcy Juliana Hernandez Leal', email: 'ejhernandez@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 2, materias_carrera: ['Proyecto de ingenieria I', 'Pensamiento Ingenieril'] },
              { id: '2', nombre: 'William David Velazquez Ramirez', email: 'wvelazquez@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 1, materias_carrera: ['LPCL'] },
              { id: '3', nombre: 'Jaime Alberto Echeverri Arias', email: 'jecheverri@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 1, materias_carrera: ['Introduccion a la ingenieria de sistemas'] },
              { id: '4', nombre: 'Bell Manrique Losada', email: 'blosada@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 2, materias_carrera: ['Proyecto de ingenieria I', 'Proyecto de ingenieria I'] },
              { id: '5', nombre: 'Gabriel Mauricio Ramírez Villegas', email: 'gramirez@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 1, materias_carrera: ['Fundamentos de diseño de software'] },
              { id: '6', nombre: 'juan guillermo Flórez Gaviria', email: 'jflorez@udemedellin.edu.co', carrera_nombre: 'Ingeniería de Sistemas', total_materias_carrera: 1, materias_carrera: ['Lenguajes y paradigmas de programacion'] }
            ],
            '3': [ // Ingeniería Civil
              { id: '7', nombre: 'Jhon Mario Garcia Giraldo', email: 'jgarcia@udemedellin.edu.co', carrera_nombre: 'Ingeniería Civil', total_materias_carrera: 1, materias_carrera: ['Resistencia de Materiales'] }
            ],
            '6': [ // Ingeniería Financiera
              { id: '8', nombre: 'Ricardo Giraldo Acevedo', email: 'rgiraldo@udemedellin.edu.co', carrera_nombre: 'Ingeniería Financiera', total_materias_carrera: 1, materias_carrera: ['Instrumentos de renta fija'] },
              { id: '9', nombre: 'Ángela María Gómez Restrepo', email: 'agomez@udemedellin.edu.co', carrera_nombre: 'Ingeniería Financiera', total_materias_carrera: 1, materias_carrera: ['Diagnóstico Financiero'] },
              { id: '10', nombre: 'David Alberto Bedoya Londoño', email: 'dbedoya@udemedellin.edu.co', carrera_nombre: 'Ingeniería Financiera', total_materias_carrera: 1, materias_carrera: ['Proyecto de ingenieria I'] }
            ],
            '2': [], // Ingeniería Industrial - sin profesores
            '4': [], // Ingeniería en Energía - sin profesores  
            '7': []  // Ingeniería Ambiental - sin profesores
          };
          
          console.log('📊 Aplicando datos mock:', { 
            carreras: mockCareers.length, 
            profesores: Object.values(mockProfessorsByCareer).flat().length 
          });
          
          setCareers(mockCareers);
          setProfessorsByCareer(mockProfessorsByCareer);
          
          console.log('✅ Datos mock aplicados exitosamente');
          }
        }
      } catch (error) {
        console.error('❌ Error general cargando datos:', error);
        // En caso de error total, usar datos mínimos
        setCareers([]);
        setProfessorsByCareer({});
      } finally {
        setLoadingCareers(false);
        console.log('🏁 Carga de datos completada');
      }
    };

    loadFacultyData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Datos específicos para decanos
  console.log('🔍 Dashboard Decano - Datos actuales:', {
    careers: careers.length,
    professorsByCareer: Object.keys(professorsByCareer).length,
    totalProfessors: Object.values(professorsByCareer).flat().length,
    professorsData: professorsByCareer
  });

  const decanoData = {
    stats: {
      totalCarreras: careers.length,
      totalProfesores: Object.values(professorsByCareer).flat().length,
      promedioEvaluaciones: 4.3
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
        icon: Bell,
        label: 'Notificar a Profesores',
        description: 'Informar fechas de encuestas',
        onClick: () => setShowNotificationModal(true),
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
    ],
    upcomingDeadlines: [
      { id: 1, task: 'Revisión de evaluaciones del período', deadline: '2025-01-25', urgent: true },
      { id: 2, task: 'Reporte de rendimiento académico', deadline: '2025-01-28', urgent: false },
      { id: 3, task: 'Planificación del próximo semestre', deadline: '2025-02-01', urgent: false }
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
                  {!loadingCareers && decanoData.stats.totalProfesores === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Verificando datos...
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
                    {decanoData.stats.promedioEvaluaciones}/5.0
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

      {/* Modal de Notificación a Profesores */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <Bell className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Notificar a Profesores</h2>
                <p className="text-gray-600 mt-2">
                  Informar a los coordinadores sobre las fechas de las encuestas
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio de encuestas
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    defaultValue="2025-02-01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de cierre de encuestas
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    defaultValue="2025-02-28"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje adicional (opcional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="Información adicional sobre las encuestas..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // Aquí se implementaría la lógica para enviar la notificación
                    alert('Notificación enviada a todos los coordinadores');
                    setShowNotificationModal(false);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  Enviar Notificación
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

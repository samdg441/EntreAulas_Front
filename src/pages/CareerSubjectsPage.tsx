import { motion } from 'framer-motion';
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
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Building2,
  Users,
  BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchCareerSubjects } from '../api/teachers';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface CareerSubjectsPageProps {
  user?: User | null;
}

export default function CareerSubjectsPage({ user }: CareerSubjectsPageProps) {
  const navigate = useNavigate();
  const [careerSubjects, setCareerSubjects] = useState<{[key: string]: any[]}>({});
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar user desde backend/localStorage si existe
  const storedUser = ((): User | null => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = user ?? storedUser ?? { id: '', name: 'Decano', type: 'decano', email: '', roles: [] };

  // Cargar materias de las carreras
  useEffect(() => {
    const loadCareerSubjects = async () => {
      try {
        setLoading(true);
        const subjectsData = await fetchCareerSubjects();
        setCareerSubjects(subjectsData.materias_por_carrera);
        setCareers(subjectsData.carreras);
        console.log('✅ Materias de carreras cargadas:', subjectsData);
      } catch (error) {
        console.error('❌ Error cargando materias de carreras:', error);
        setCareerSubjects({});
        setCareers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCareerSubjects();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
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
        {/* Header */}
        <Header user={currentUser} />

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-white bg-opacity-95 rounded-lg shadow-md p-4"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard-decano')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-university-red-light rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-university-red" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Materias por Carrera</h1>
              <p className="text-gray-600">{getGreeting()}, {currentUser.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-medium text-gray-900 text-left">
                  Total de Carreras
                </CardTitle>
                <Building2 className="h-6 w-6 text-university-red ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-university-red">
                  {careers.length}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Carreras en la facultad
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-medium text-gray-900 text-left">
                  Total de Materias
                </CardTitle>
                <BookOpen className="h-6 w-6 text-green-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {Object.values(careerSubjects).flat().length}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Materias disponibles
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
                  Promedio por Carrera
                </CardTitle>
                <BarChart3 className="h-6 w-6 text-yellow-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {careers.length > 0 ? Math.round(Object.values(careerSubjects).flat().length / careers.length) : 0}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Materias por carrera
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
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-medium text-gray-900 text-left">
                  Carreras Activas
                </CardTitle>
                <GraduationCap className="h-6 w-6 text-purple-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {careers.filter(c => careerSubjects[c.id.toString()]?.length > 0).length}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Con materias asignadas
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Carreras y Materias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-gray-700" />
                <CardTitle className="text-2xl text-gray-900">Catálogo de Materias por Carrera</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                  <p>Cargando materias...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {careers.map((career) => (
                    <div key={career.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{career.nombre}</h3>
                            <p className="text-sm text-gray-600">
                              {careerSubjects[career.id.toString()]?.length || 0} materias disponibles
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {careerSubjects[career.id.toString()]?.length || 0} materias
                        </Badge>
                      </div>
                      
                      {careerSubjects[career.id.toString()] && careerSubjects[career.id.toString()].length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {careerSubjects[career.id.toString()].map((materia: any) => (
                            <div key={materia.id} className="p-4 bg-gray-50 rounded-lg border hover:border-red-300 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">{materia.nombre}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {materia.creditos} créditos
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{materia.codigo}</p>
                              {materia.descripcion && (
                                <p className="text-xs text-gray-500">{materia.descripcion}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Sin materias registradas</h4>
                          <p className="text-gray-600">Esta carrera no tiene materias asignadas actualmente.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      </div>
    </div>
  );
}

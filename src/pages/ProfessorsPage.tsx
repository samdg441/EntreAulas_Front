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
  UserIcon,
  ArrowLeft,
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  Mail,
  ChevronRight,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProfessorSubjects } from '../api/teachers';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface ProfessorsPageProps {
  user?: User | null;
}

export default function ProfessorsPage({ user }: ProfessorsPageProps) {
  const navigate = useNavigate();
  const [professorsByCareer, setProfessorsByCareer] = useState<{[key: string]: any[]}>({});
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Cargar profesores con sus materias específicas
  useEffect(() => {
    const loadProfessors = async () => {
      try {
        setLoading(true);
        const professorsData = await fetchProfessorSubjects();
        setCareers(professorsData.carreras);
        setProfessorsByCareer(professorsData.profesores_por_carrera);
        console.log('✅ Profesores con materias específicas cargados:', professorsData);
      } catch (error) {
        console.error('❌ Error cargando profesores:', error);
        setProfessorsByCareer({});
        setCareers([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfessors();
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

  // Filtrar profesores por término de búsqueda
  const filteredProfessors = selectedCareer 
    ? (professorsByCareer[selectedCareer] || []).filter((professor: any) =>
        professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professor.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professor.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Obtener todos los profesores para estadísticas
  const allProfessors = Object.values(professorsByCareer).flat();

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
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profesores de la Facultad</h1>
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
                  Total de Profesores
                </CardTitle>
                <Users className="h-6 w-6 text-red-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {allProfessors.length}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Profesores activos
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
                  Total de Carreras
                </CardTitle>
                <Building2 className="h-6 w-6 text-green-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {careers.length}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Carreras con profesores
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
                  Materias Asignadas
                </CardTitle>
                <BookOpen className="h-6 w-6 text-yellow-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {allProfessors.reduce((total, prof) => total + (prof.total_materias_asignadas || 0), 0)}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Total de asignaciones
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
                  Promedio por Profesor
                </CardTitle>
                <GraduationCap className="h-6 w-6 text-purple-600 ml-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {allProfessors.length > 0 ? Math.round(allProfessors.reduce((total, prof) => total + (prof.total_materias_asignadas || 0), 0) / allProfessors.length * 10) / 10 : 0}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-left">
                  Materias por profesor
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Carreras */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-xl text-gray-900">Carreras</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant={selectedCareer === null ? "default" : "outline"}
                    onClick={() => setSelectedCareer(null)}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ver Todos los Profesores
                  </Button>
                  
                  {careers.map((career) => (
                    <Button
                      key={career.id}
                      variant={selectedCareer === career.id.toString() ? "default" : "outline"}
                      onClick={() => setSelectedCareer(career.id.toString())}
                      className="w-full justify-start"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {career.nombre}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {professorsByCareer[career.id.toString()]?.length || 0}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Profesores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-700" />
                    <CardTitle className="text-xl text-gray-900">
                      {selectedCareer 
                        ? `Profesores de ${careers.find(c => c.id.toString() === selectedCareer)?.nombre}`
                        : 'Todos los Profesores'
                      }
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar profesores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                    <p>Cargando profesores...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCareer ? (
                      // Mostrar profesores de carrera específica
                      filteredProfessors.length > 0 ? (
                        filteredProfessors.map((professor: any) => (
                          <div key={professor.id} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {professor.nombre} {professor.apellido}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {professor.total_materias_asignadas || 0} materias
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{professor.email}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {professor.codigo_profesor || 'Sin código'}
                                  </Badge>
                                </div>
                                {professor.materias_asignadas && professor.materias_asignadas.length > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-2">Materias que imparte:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {professor.materias_asignadas.map((materia: any) => (
                                        <span key={materia.id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          {materia.nombre}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No se encontraron profesores</h4>
                          <p className="text-gray-600">
                            {searchTerm 
                              ? 'No hay profesores que coincidan con tu búsqueda.'
                              : 'Esta carrera no tiene profesores asignados.'
                            }
                          </p>
                        </div>
                      )
                    ) : (
                      // Mostrar todos los profesores organizados por carrera
                      careers.map((career) => (
                        <div key={career.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{career.nombre}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {professorsByCareer[career.id.toString()]?.length || 0} profesores
                            </Badge>
                          </div>
                          
                          {professorsByCareer[career.id.toString()] && professorsByCareer[career.id.toString()].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {professorsByCareer[career.id.toString()].map((professor: any) => (
                                <div key={professor.id} className="p-3 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <UserIcon className="h-4 w-4 text-gray-600" />
                                    <span className="font-medium text-gray-900 text-sm">
                                      {professor.nombre} {professor.apellido}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1">{professor.email}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {professor.codigo_profesor || 'Sin código'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {professor.total_materias_asignadas || 0} materias
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-500">No hay profesores asignados a esta carrera</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      </div>
    </div>
  );
}

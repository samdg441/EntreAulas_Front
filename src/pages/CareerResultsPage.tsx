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
  ArrowLeft,
  GraduationCap,
  BarChart3,
  Building2,
  Users,
  TrendingUp,
  Download,
  FileText,
  Target,
  ChevronRight,
  Calendar,
  Star,
  BookOpen
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchCareerSubjects, fetchAllCareerResults, fetchCareerResults } from '../api/teachers';
import { exportElementToPDF, exportElementToPNG, exportObjectsToExcel } from '../utils/export';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface CareerResultsPageProps {
  user?: User | null;
}

export default function CareerResultsPage({ user }: CareerResultsPageProps) {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'all' | 'specific' | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  
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

  // Cargar carreras
  useEffect(() => {
    const loadCareers = async () => {
      try {
        setLoading(true);
        const subjectsData = await fetchCareerSubjects();
        setCareers(subjectsData.carreras);
        console.log('✅ Carreras cargadas:', subjectsData.carreras);
      } catch (error) {
        console.error('❌ Error cargando carreras:', error);
        setCareers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCareers();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const handleGenerateAllResults = async () => {
    try {
      console.log('Generando resultados para todas las carreras...');
      const results = await fetchAllCareerResults();
      console.log('✅ Resultados globales obtenidos:', results);
      // Por ahora navegar a una página de resultados globales
      navigate('/reports');
    } catch (error) {
      console.error('❌ Error generando resultados globales:', error);
      // Por ahora navegar a la página de reportes existente
      navigate('/reports');
    }
  };

  const handleSelectSpecificCareer = () => {
    setSelectedOption('specific');
  };

  const handleCareerSelection = async (careerId: string) => {
    try {
      console.log('Obteniendo resultados de carrera:', careerId);
      const results = await fetchCareerResults(careerId);
      console.log('✅ Resultados de carrera obtenidos:', results);
      // Por ahora navegar a la página de reportes con filtro de carrera
      navigate(`/reports?career=${careerId}`);
    } catch (error) {
      console.error('❌ Error obteniendo resultados de carrera:', error);
      // Por ahora navegar a la página de reportes existente
      navigate('/reports');
    }
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
        <main ref={reportRef} className="container mx-auto px-4 py-8">
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
                <GraduationCap className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resultados por Carrera</h1>
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
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Carreras</CardTitle>
                  <Building2 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{careers.length}</div>
                  <p className="text-xs text-gray-500">En la facultad</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profesores Activos</CardTitle>
                  <Users className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">24</div>
                  <p className="text-xs text-gray-500">En todas las carreras</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">156</div>
                  <p className="text-xs text-gray-500">Este período</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                  <Star className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">4.2/5.0</div>
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <TrendingUp className="h-3 w-3" />
                    +2.3% vs período anterior
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Opciones principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Generar resultados para todas las carreras */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Generar resultados para todas las carreras</CardTitle>
                      <CardDescription>
                        Informe global de la Facultad de Ingeniería
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Obtén un reporte completo con estadísticas, gráficos y análisis de todas las carreras de la facultad.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                      <span>Estadísticas generales</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>Tendencias históricas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>Reporte exportable</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateAllResults}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generar Informe Global
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Seleccionar carrera específica */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Seleccionar carrera específica</CardTitle>
                      <CardDescription>
                        Ver resultados detallados por carrera
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Selecciona una carrera específica para ver sus resultados académicos detallados.
                  </p>
                  
                  {selectedOption === 'specific' ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Seleccionar carrera:
                      </label>
                      <select 
                        value={selectedCareer || ''} 
                        onChange={(e) => setSelectedCareer(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                      >
                        <option value="">Selecciona una carrera...</option>
                        {careers.map((career) => (
                          <option key={career.id} value={career.id}>
                            {career.nombre}
                          </option>
                        ))}
                      </select>
                      
                      {selectedCareer && (
                        <Button 
                          onClick={() => handleCareerSelection(selectedCareer)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Ver Resultados de {careers.find(c => c.id === selectedCareer)?.nombre}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleSelectSpecificCareer}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Seleccionar Carrera
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Lista de carreras disponibles */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Carreras Disponibles
                </CardTitle>
                <CardDescription>
                  Lista de todas las carreras de la Facultad de Ingeniería
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-gray-600">Cargando carreras...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {careers.map((career) => (
                      <div 
                        key={career.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOption('specific');
                          setSelectedCareer(career.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{career.nombre}</h3>
                            <p className="text-sm text-gray-600">Carrera de Ingeniería</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {career.total_materias || 0} materias
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Activa
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Opciones de exportación */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Opciones de Exportación
                </CardTitle>
                <CardDescription>
                  Descarga reportes detallados en diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="outline" className="w-full" onClick={async () => {
                    if (reportRef.current) {
                      await exportElementToPDF(reportRef.current, 'resultados-carreras.pdf')
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Reporte PDF
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const sheets = [
                      { name: 'Carreras', rows: careers.map((c) => ({ id: c.id, nombre: c.nombre, materias: c.total_materias || 0 })) }
                    ]
                    exportObjectsToExcel(sheets, 'resultados-carreras.xlsx')
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Datos Excel
                  </Button>
                  <Button variant="outline" className="w-full" onClick={async () => {
                    if (reportRef.current) {
                      await exportElementToPNG(reportRef.current, 'graficos-carreras.png')
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Gráficos PNG
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

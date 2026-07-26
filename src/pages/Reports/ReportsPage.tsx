import { useState, useEffect, useRef } from 'react';
import { fetchTeacherHistoricalStats, fetchTeacherId, fetchTeacherPeriodStats, fetchTeacherPeriodCategoryStats, fetchCoordinatorReportsOverview } from '../../api/teachers';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CardHeader, 
  CardContent, 
  CardDescription, 
  CardTitle 
} from '../../components/Card';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Header from '../../components/Header';
import { User } from '../../types';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  Users, 
  Star,
  BarChart3,
  Calendar,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Importar la imagen de fondo
const fondo = new URL('../../assets/fondo.webp', import.meta.url).href;
import { exportElementToPDF, exportElementToPNG, exportObjectsToExcel, exportCoordinatorReportExcel } from '../../utils/export';
import AISummaryCard from '../../components/AISummaryCard';

interface ReportsPageProps {
  user: User;
}

export default function ReportsPage({ user }: ReportsPageProps) {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-1');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [teacherId, setTeacherId] = useState<string>('');
  const [teacherStats, setTeacherStats] = useState<any>(null); // histórico o base si no hay histórico
  const [baseTeacherStats, setBaseTeacherStats] = useState<any>(null); // SIEMPRE: stats globales del profesor
  const [coordinatorOverview, setCoordinatorOverview] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Cargar estadísticas del profesor (cards = base stats; gráficas: histórico con fallback)
  useEffect(() => {
    const loadTeacherStats = async () => {
      if (!user?.id) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        setStatsError(null);
        if (user.type === 'coordinator') {
          const coordinatorData = await fetchCoordinatorReportsOverview(selectedPeriod);
          setCoordinatorOverview(coordinatorData);
          setTeacherStats(null);
          setBaseTeacherStats(null);
          setTeacherId('');
        } else {
          // Obtener el ID real del profesor desde el backend
          const tId = await fetchTeacherId();
          setTeacherId(tId);

          // Cargar en paralelo: histórico y stats base
          const [historical, baseStats] = await Promise.all([
            fetchTeacherHistoricalStats(tId, selectedPeriod),
            fetchTeacherPeriodStats(selectedPeriod)
          ]);

          setBaseTeacherStats(baseStats);
          setCoordinatorOverview(null);

          // Gráficas: usar histórico si hay datos, si no usar base
          if (!historical || (historical.totalEvaluaciones ?? 0) === 0) {
            setTeacherStats(baseStats);
          } else {
            setTeacherStats(historical);
          }
        }
      } catch (error) {
        console.error('❌ Error loading teacher stats for reports:', error);
        setStatsError('Error al cargar las estadísticas');
      } finally {
        setLoadingStats(false);
      }
    };

    loadTeacherStats();
  }, [user?.id, selectedPeriod]);

  // Cargar datos históricos para la gráfica de tendencia
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (user.type === 'coordinator' || !teacherId) return;

      try {
        const periods = ['2024-1', '2024-2', '2025-1', '2025-2', '2026-1', '2026-2'];
        const historicalPromises = periods.map(async (period) => {
          try {
            const stats = await fetchTeacherHistoricalStats(teacherId, period);
            return {
              period,
              rating: stats.calificacionPromedio || 0,
              totalEvaluations: stats.totalEvaluaciones || 0
            };
          } catch (error) {
            console.warn(`No data for period ${period}:`, error);
            return {
              period,
              rating: 0,
              totalEvaluations: 0
            };
          }
        });

        const results = await Promise.all(historicalPromises);
        setHistoricalData(results);
        console.log('✅ Historical data loaded:', results);
      } catch (error) {
        console.error('❌ Error loading historical data:', error);
      }
    };

    loadHistoricalData();
  }, [teacherId, user.type]);

  // Función para manejar cambio de período
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  // Datos reales para barras por categoría: usar SIEMPRE stats base
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  // Cargar promedios por categoría del período (y curso si aplica)
  useEffect(() => {
    const loadCategory = async () => {
      if (user.type === 'coordinator') {
        setCategoryStats(coordinatorOverview?.categoryStats || []);
        return;
      }
      try {
        const data = await fetchTeacherPeriodCategoryStats(selectedPeriod, selectedCourse !== 'all' ? selectedCourse : undefined);
        setCategoryStats(Array.isArray(data) ? data : []);
      } catch {
        setCategoryStats([]);
      }
    };
    loadCategory();
  }, [selectedPeriod, selectedCourse, user.type, coordinatorOverview]);

  const realCategoryData = categoryStats.length > 0
    ? categoryStats.map((c: any) => ({ category: c.nombre, rating: c.promedio }))
    : [];

  // Coordinador: mantener la misma vista que docente, pero con promedio global por categoría.
  const categoryData = realCategoryData;
  const trendData = user.type === 'coordinator'
    ? (coordinatorOverview?.trend || [])
    : historicalData;

  // Radar usando solo datos reales por categoría
  const realRadarData = categoryStats.length > 0
    ? categoryStats
        .slice(0, 6) // Limitar a 6 categorías para mejor visualización
        .map((c: any) => ({
          subject: c.nombre || `Cat.${c.categoriaId}`,
          A: Number(c.promedio) || 0,
          fullMark: 5
        }))
        .filter((d: any) => d.A > 0) // Solo categorías con datos
    : [];

  const radarData = realRadarData;

  // Distribución calculada desde cursos del período (ponderada por total de encuestas)
  const distributionData = (() => {
    if (user.type === 'coordinator') {
      return (coordinatorOverview?.distribution || []) as any[];
    }
    const distributionBuckets = [
      { name: '5 Estrellas', value: 0, color: '#10B981' },
      { name: '4 Estrellas', value: 0, color: '#3B82F6' },
      { name: '3 Estrellas', value: 0, color: '#F59E0B' },
      { name: '2 Estrellas', value: 0, color: '#EF4444' },
      { name: '1 Estrella', value: 0, color: '#6B7280' }
    ]
    ;(baseTeacherStats?.evaluacionesPorCurso || []).forEach((curso: any) => {
      const total = Number(curso?.total || 0)
      const promedio = Number(curso?.promedio || 0)
      if (total <= 0) return
      const bucket = Math.max(1, Math.min(5, Math.round(promedio)))
      const index = 5 - bucket
      distributionBuckets[index].value += total
    })
    return distributionBuckets.filter((b) => b.value > 0)
  })()
  
  // El backend ahora acepta el formato YYYY-X directamente
  const periodoId = selectedPeriod; // Ya está en formato YYYY-X
  
  // Debug: Log para verificar valores
  useEffect(() => {
    if (user.type === 'teacher') {
      console.log('🔍 [ReportsPage] Teacher ID state:', { teacherId, userId: user.id, periodoId, loadingStats })
    }
  }, [teacherId, user.id, periodoId, loadingStats, user.type])

  // Cards basadas en datos reales del período
  const previousPeriod = (() => {
    const [yearStr, semStr] = selectedPeriod.split('-')
    const year = Number(yearStr)
    const sem = Number(semStr)
    if (sem === 2) return `${year}-1`
    return `${year - 1}-2`
  })()
  const currentTrend = trendData.find((t: any) => t.period === selectedPeriod)?.rating || 0
  const prevTrend = trendData.find((t: any) => t.period === previousPeriod)?.rating || 0
  const improvement = prevTrend > 0 ? Number((((currentTrend - prevTrend) / prevTrend) * 100).toFixed(1)) : 0

  const summaryStats = {
    totalEvaluations: user.type === 'coordinator'
      ? (coordinatorOverview?.summary?.totalEvaluaciones || 0)
      : (baseTeacherStats?.totalEvaluaciones || 0),
    averageRating: user.type === 'coordinator'
      ? (coordinatorOverview?.summary?.calificacionPromedio || 0)
      : (baseTeacherStats?.calificacionPromedio || 0),
    responseRate: Number(
      user.type === 'coordinator'
        ? (coordinatorOverview?.summary?.tasaRespuesta || 0)
        : (baseTeacherStats?.tasaRespuesta || 0)
    ),
    improvement
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
        {/* Overlay oscuro que cubre toda la página */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Usamos el componente Header */}
        <Header user={user} />
        
        <main ref={reportRef} className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
          {/* Header interno con botón de volver y filtros */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-gray-200 p-4 lg:p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {user.type === 'coordinator' ? 'Dashboard de Reportes' : 'Mis Evaluaciones'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {user.type === 'coordinator' 
                      ? 'Análisis y estadísticas departamentales' 
                      : `Resultados de tus evaluaciones docentes - Período ${selectedPeriod}`
                    }
                  </p>
                  {/* Se eliminó el mensaje de datos de ejemplo para una experiencia más limpia */}
                </div>
              </div>
              
               <div className="flex items-center gap-3">
                 <select 
                   value={selectedPeriod} 
                   onChange={(e) => handlePeriodChange(e.target.value)}
                   className="w-32 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                 >
                   <option value="2026-1">2026-1</option>
                   <option value="2026-2">2026-2</option>
                   <option value="2025-2">2025-2</option>
                   <option value="2025-1">2025-1</option>
                   <option value="2024-2">2024-2</option>
                   <option value="2024-1">2024-1</option>
                   <option value="2023-2">2023-2</option>
                   <option value="2023-1">2023-1</option>
                 </select>
                 
                 {user.type === 'teacher' && (
                   <select 
                     value={selectedCourse} 
                     onChange={(e) => setSelectedCourse(e.target.value)}
                     className="w-56 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                   >
                     <option value="all">Todas las materias</option>
                     {(baseTeacherStats?.evaluacionesPorCurso || []).map((curso: any) => (
                       <option key={curso.curso_id} value={curso.curso_id}>
                         {(curso.codigo || 'CURSO')} - {curso.nombre}
                       </option>
                     ))}
                   </select>
                 )}
                 
                {/* Selector de curso disponible también para profesores */}
                {teacherStats?.evaluacionesPorCurso && (
                  <select 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-48 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                  >
                    <option value="all">Todos los cursos</option>
                    {teacherStats.evaluacionesPorCurso.length > 0 ? (
                      teacherStats.evaluacionesPorCurso.map((curso: any) => (
                        <option key={curso.curso_id} value={curso.curso_id}>
                          {curso.nombre}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay cursos disponibles</option>
                    )}
                  </select>
                )}
                 
                 <Button variant="outline" size="sm" onClick={async () => {
                   if (reportRef.current) {
                     await exportElementToPDF(reportRef.current, `reporte-${selectedPeriod}.pdf`)
                   }
                 }}>
                   <Download className="h-4 w-4 mr-2" />
                   Exportar
                 </Button>
               </div>
            </div>

          </motion.header>

           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
             >
               <Card className="bg-white shadow-md border border-gray-200 h-full">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <BarChart3 className="h-5 w-5 text-red-600" />
                     Total Evaluaciones
                   </CardTitle>
                   <CardDescription>Este período académico</CardDescription>
                 </CardHeader>
                 <CardContent>
                  <div className="text-4xl font-bold text-red-600 mb-2">{summaryStats.totalEvaluations}</div>
                   <p className="text-sm text-gray-600">Evaluaciones completadas</p>
                 </CardContent>
               </Card>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
             >
               <Card className="bg-white shadow-md border border-gray-200 h-full">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Star className="h-5 w-5 text-yellow-500" />
                     Calificación Promedio
                   </CardTitle>
                   <CardDescription>Promedio general de todas las evaluaciones</CardDescription>
                 </CardHeader>
                 <CardContent>
                  <div className="text-4xl font-bold text-yellow-600 mb-2">{summaryStats.averageRating}/5.0</div>
                   <div className="flex items-center gap-1 text-sm text-green-600">
                     <TrendingUp className="h-4 w-4" />
                    {summaryStats.improvement >= 0 ? '+' : ''}{summaryStats.improvement}% vs período anterior
                   </div>
                 </CardContent>
               </Card>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <Card className="bg-white shadow-md border border-gray-200 h-full">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-blue-600" />
                     Tasa de Respuesta
                   </CardTitle>
                   <CardDescription>De estudiantes elegibles</CardDescription>
                 </CardHeader>
                 <CardContent>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{summaryStats.responseRate}%</div>
                   <p className="text-sm text-gray-600">Estudiantes que respondieron</p>
                 </CardContent>
               </Card>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
             >
               <Card className="bg-white shadow-md border border-gray-200 h-full">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Calendar className="h-5 w-5 text-green-600" />
                     {user.type === 'coordinator' ? 'Docentes Evaluados' : 'Cursos Evaluados'}
                   </CardTitle>
                   <CardDescription>
                     {user.type === 'coordinator' ? 'En el departamento' : 'Cursos evaluados'}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   {loadingStats ? (
                     <div className="text-4xl font-bold text-gray-400 mb-2">Cargando...</div>
                   ) : statsError ? (
                     <div className="text-3xl font-bold text-red-600 mb-2">Error</div>
                   ) : (
                     <div className="text-4xl font-bold text-green-600 mb-2">
                       {user.type === 'coordinator'
                         ? (coordinatorOverview?.summary?.docentesEvaluados || 0)
                         : (teacherStats?.totalCursos || 0)}
                     </div>
                   )}
                   <p className="text-sm text-gray-600">
                     {loadingStats ? 'Cargando datos...' : (user.type === 'coordinator' ? 'Docentes evaluados en el período' : 'Materias impartidas')}
                   </p>
                 </CardContent>
               </Card>
             </motion.div>
           </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Ratings Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 h-full">
                <CardHeader>
                  <CardTitle>Calificaciones por Categoría</CardTitle>
                  <CardDescription>
                    Promedio de calificaciones en cada dimensión evaluada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-[350px] text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                        <p>Cargando datos...</p>
                      </div>
                    </div>
                  ) : categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={categoryData}
                        margin={{ top: 10, right: 20, left: 20, bottom: 35 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={105}
                          tickMargin={10}
                          fontSize={11}
                        />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Bar dataKey="rating" fill="#E30613" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No hay datos disponibles</p>
                        <p className="text-sm text-gray-400">No se encontraron calificaciones por categoría en este período</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 h-full">
                <CardHeader>
                  <CardTitle>Tendencia Histórica</CardTitle>
                  <CardDescription>
                    Evolución de las calificaciones a lo largo del tiempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-[350px] text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                        <p>Cargando datos...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="#E30613" 
                          strokeWidth={3}
                          dot={{ fill: '#E30613', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 h-full">
                <CardHeader>
                  <CardTitle>Perfil de Competencias</CardTitle>
                  <CardDescription>
                    Vista radial de las principales dimensiones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                        <p>Cargando datos...</p>
                      </div>
                    </div>
                  ) : radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 5]} />
                        <Radar
                          name="Calificación"
                          dataKey="A"
                          stroke="#E30613"
                          fill="#E30613"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No hay datos disponibles</p>
                        <p className="text-sm text-gray-400">Datos de competencias no encontrados</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 h-full">
                <CardHeader>
                  <CardTitle>Distribución de Calificaciones</CardTitle>
                  <CardDescription>
                    Porcentaje de evaluaciones por nivel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                        <p>Cargando datos...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="value"
                          label={false}
                          labelLine={false}
                        >
                          {distributionData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={48}
                          formatter={(value: any, entry: any) => {
                            const total = distributionData.reduce((sum: number, item: any) => sum + (item.value || 0), 0)
                            const current = Number(entry?.payload?.value || 0)
                            const pct = total > 0 ? Math.round((current / total) * 100) : 0
                            return `${value}: ${pct}%`
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* IA: Resumen de respuestas abiertas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {(() => {
              const currentPeriod = periodoId || selectedPeriod
              const currentProfesorId = teacherId || user.id
              
              console.log('🔍 [ReportsPage] Renderizando AISummaryCard:', {
                userType: user.type,
                teacherId,
                currentProfesorId,
                periodoId: currentPeriod,
                userId: user.id,
                selectedPeriod
              })
              
              // Para teachers: siempre mostrar con endpoint by-professor
              if (user.type === 'teacher') {
                return (
                  <AISummaryCard
                    endpoint="by-professor"
                    params={{
                      profesor_id: currentProfesorId,
                      periodo_id: currentPeriod
                    }}
                    title="Resumen IA (Mis cursos)"
                    description="Generado con Google Gemini y extracción local de temas"
                  />
                )
              }
              
              // Para coordinadores: usar by-career (solo su carrera)
              if (user.type === 'coordinator') {
                return (
                  <AISummaryCard
                    endpoint="by-career"
                    params={{
                      periodo_id: currentPeriod
                    }}
                    title="Resumen IA (Mi Carrera)"
                    description="Generado con Google Gemini y extracción local de temas - Todas las evaluaciones de tu carrera"
                  />
                )
              }
              
              // Para decanos: usar by-faculty (toda la facultad)
              if (user.type === 'decano') {
                return (
                  <AISummaryCard
                    endpoint="by-faculty"
                    params={{
                      periodo_id: currentPeriod
                    }}
                    title="Resumen IA (Facultad de Ingeniería)"
                    description="Generado con Google Gemini y extracción local de temas - Todas las evaluaciones de la facultad"
                  />
                )
              }
              
              // Fallback: para cualquier otro tipo, intentar usar by-professor con user.id
              console.warn('⚠️ [ReportsPage] Tipo de usuario no reconocido:', user.type, '- Usando fallback')
              return (
                <AISummaryCard
                  endpoint="by-professor"
                  params={{
                    profesor_id: user.id,
                    periodo_id: currentPeriod
                  }}
                  title="Resumen IA"
                  description="Generado con Google Gemini y extracción local de temas"
                />
              )
            })()}
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
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
                      await exportElementToPDF(reportRef.current, `reporte-${selectedPeriod}.pdf`)
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Reporte PDF
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    if (user.type === 'coordinator') {
                      const rows = coordinatorOverview?.reportRows || []
                      exportCoordinatorReportExcel(rows, `reporte-coordinador-${selectedPeriod}.xlsx`)
                      return
                    }
                    const sheets = [
                      { name: 'Resumen', rows: [summaryStats] },
                      { name: 'Categorias', rows: categoryData },
                      { name: 'Tendencia', rows: trendData },
                      { name: 'Distribucion', rows: distributionData }
                    ]
                    exportObjectsToExcel(sheets, `reporte-${selectedPeriod}.xlsx`)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Datos Excel
                  </Button>
                  <Button variant="outline" className="w-full" onClick={async () => {
                    if (reportRef.current) {
                      await exportElementToPNG(reportRef.current, `graficos-${selectedPeriod}.png`)
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
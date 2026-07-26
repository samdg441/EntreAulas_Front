import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Download, 
  TrendingUp, 
  Users, 
  Star,
  BarChart3,
  Calendar,
  FileText,
  User as UserIcon,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AISummaryCard from '../components/AISummaryCard';
import html2canvas from 'html2canvas';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;
import { exportElementToPDF, exportElementToPNG, exportObjectsToExcel } from '../utils/export';

interface SurveyResultsProps {
  user: User;
}

export default function SurveyResults({ user }: SurveyResultsProps) {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('2025-2');
  
  // Parámetros de la URL
  const courseId = searchParams.get('courseId');
  const professorId = searchParams.get('professorId');
  const groupId = searchParams.get('groupId');
  
  // Estado para los datos
  const [surveyData, setSurveyData] = useState<any>(null);
  const normalizeGroup = (g: any) =>
    g
      ? {
          id: g.id,
          number: g.numero_grupo ?? g.number ?? g.numero ?? g.id,
          schedule: g.horario ?? g.schedule ?? '',
          classroom: g.aula ?? g.classroom ?? ''
        }
      : null;

  const [professorInfo, setProfessorInfo] = useState<any>(location.state?.professor || null);
  const [courseInfo, setCourseInfo] = useState<any>(location.state?.course || null);
  const [groupInfo, setGroupInfo] = useState<any>(normalizeGroup(location.state?.group) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la encuesta
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!courseId || !professorId || !groupId) {
        setError('Faltan parámetros requeridos');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // TODO: Implementar llamadas a la API para obtener:
        // - Datos de la encuesta del profesor/curso/grupo
        // - Información del profesor
        // - Información del curso
        // - Información del grupo
        
        // Datos mock solo para gráficas mientras no hay endpoint de resultados
        const mockData = {
          totalEvaluations: 45,
          averageRating: 4.3,
          responseRate: 87,
          improvement: 5.2,
          categoryData: [
            { category: 'Claridad Expositiva', rating: 4.2, total: 45 },
            { category: 'Conocimiento del Tema', rating: 4.7, total: 45 },
            { category: 'Responsabilidad', rating: 4.5, total: 45 },
            { category: 'Interacción con Estudiantes', rating: 3.8, total: 45 },
            { category: 'Metodología de Enseñanza', rating: 4.1, total: 45 },
            { category: 'Sistema de Evaluación', rating: 4.3, total: 45 },
            { category: 'Trato Personal', rating: 4.6, total: 45 },
            { category: 'Motivación al Aprendizaje', rating: 3.9, total: 45 },
            { category: 'Disponibilidad', rating: 4.0, total: 45 },
            { category: 'Recomendación General', rating: 4.4, total: 45 }
          ],
          trendData: [
            { period: '2023-1', rating: 4.0 },
            { period: '2023-2', rating: 4.1 },
            { period: '2024-1', rating: 4.2 },
            { period: '2024-2', rating: 4.3 },
            { period: '2025-1', rating: 4.2 },
            { period: '2025-2', rating: 4.3 }
          ],
          distributionData: [
            { name: '5 Estrellas', value: 16, color: '#10B981' },
            { name: '4 Estrellas', value: 13, color: '#3B82F6' },
            { name: '3 Estrellas', value: 9, color: '#F59E0B' },
            { name: '2 Estrellas', value: 5, color: '#EF4444' },
            { name: '1 Estrella', value: 2, color: '#6B7280' }
          ],
          radarData: [
            { subject: 'Claridad', A: 4.2, fullMark: 5 },
            { subject: 'Conocimiento', A: 4.7, fullMark: 5 },
            { subject: 'Metodología', A: 4.1, fullMark: 5 },
            { subject: 'Evaluación', A: 4.3, fullMark: 5 },
            { subject: 'Trato', A: 4.6, fullMark: 5 },
            { subject: 'Motivación', A: 3.9, fullMark: 5 }
          ],
          openResponses: [
            'El ritmo de la clase es muy rápido y a veces cuesta seguir.',
            'Me gustan los ejemplos prácticos, ayudan a entender mejor.',
            'Falta un poco de claridad en las explicaciones de algunos temas.',
            'Sería bueno tener más tiempo para resolver dudas al final de clase.',
            'El profesor domina el tema, pero podría mejorar la distribución del tiempo.',
            'Los materiales son buenos, pero a veces llegan tarde.',
            'El sistema de evaluación no refleja del todo el aprendizaje.',
            'Se agradece la disponibilidad del profesor para atender fuera de clase.',
            'Más ejercicios guiados ayudarían a consolidar los contenidos.',
            'Buen trato, pero el ritmo podría ser más pausado.'
          ]
        };

        setSurveyData(mockData);
        // Mantener la info enviada desde la navegación; si no vino, usar placeholders mínimos
        if (!professorInfo) {
          setProfessorInfo({ name: 'Profesor', email: '', department: '' });
        }
        if (!courseInfo) {
          setCourseInfo({ name: 'Curso', code: courseId, credits: null, description: '' });
        }
        if (!groupInfo) {
          setGroupInfo({ number: groupId, schedule: '', classroom: '' });
        }
        
      } catch (error) {
        console.error('❌ Error loading survey data:', error);
        setError('Error al cargar los datos de la encuesta');
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [courseId, professorId, groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div 
          className="fixed inset-0 z-0"
          style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10">
          <Header user={user} />
          <main className="max-w-7xl mx-auto p-4 lg:p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-white text-lg">Cargando resultados de la encuesta...</p>
          </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div 
          className="fixed inset-0 z-0"
          style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10">
          <Header user={user} />
          <main className="max-w-7xl mx-auto p-4 lg:p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <Button onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
            </Button>
          </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Funciones de exportación
  const exportToExcel = () => {
    if (!surveyData) return;

    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Resumen general
    const summaryData = [
      ['Información General'],
      ['Profesor', professorInfo?.name || 'N/A'],
      ['Curso', `${courseInfo?.name || 'N/A'} (${courseInfo?.code || 'N/A'})`],
      ['Grupo', `Grupo ${groupInfo?.number || 'N/A'}`],
      ['Período', selectedPeriod],
      [''],
      ['Estadísticas'],
      ['Total Evaluaciones', surveyData.totalEvaluations],
      ['Calificación Promedio', `${surveyData.averageRating}/5.0`],
      ['Tasa de Respuesta', `${surveyData.responseRate}%`],
      ['Estudiantes Evaluadores', surveyData.totalEvaluations],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja 2: Calificaciones por categoría
    const categoryHeaders = [['Categoría', 'Calificación', 'Total Evaluaciones']];
    const categoryRows = surveyData.categoryData.map((cat: any) => [
      cat.category,
      cat.rating,
      cat.total
    ]);
    const categoryData = [...categoryHeaders, ...categoryRows];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Calificaciones por Categoría');

    // Hoja 3: Tendencia histórica
    const trendHeaders = [['Período', 'Calificación']];
    const trendRows = surveyData.trendData.map((t: any) => [t.period, t.rating]);
    const trendData = [...trendHeaders, ...trendRows];
    const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(workbook, trendSheet, 'Tendencia Histórica');

    // Hoja 4: Distribución de calificaciones
    const distHeaders = [['Nivel', 'Cantidad', 'Porcentaje']];
    const totalDist = surveyData.distributionData.reduce((sum: number, d: any) => sum + d.value, 0);
    const distRows = surveyData.distributionData.map((d: any) => [
      d.name,
      d.value,
      `${((d.value / totalDist) * 100).toFixed(1)}%`
    ]);
    const distData = [...distHeaders, ...distRows];
    const distSheet = XLSX.utils.aoa_to_sheet(distData);
    XLSX.utils.book_append_sheet(workbook, distSheet, 'Distribución');

    // Guardar archivo
    const fileName = `Resultados_Encuesta_${courseInfo?.code || 'curso'}_${selectedPeriod}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    if (!surveyData) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setTextColor(227, 6, 19); // Color rojo de la universidad
    doc.text('Resultados de Encuesta', 105, yPos, { align: 'center' });
    yPos += 10;

    // Información general
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Profesor: ${professorInfo?.name || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Curso: ${courseInfo?.name || 'N/A'} (${courseInfo?.code || 'N/A'})`, 20, yPos);
    yPos += 7;
    doc.text(`Grupo: ${groupInfo?.number || 'N/A'} - Período: ${selectedPeriod}`, 20, yPos);
    yPos += 15;

    // Estadísticas principales
    doc.setFontSize(14);
    doc.text('Estadísticas Principales', 20, yPos);
    yPos += 10;

    const statsData = [
      ['Total Evaluaciones', surveyData.totalEvaluations],
      ['Calificación Promedio', `${surveyData.averageRating}/5.0`],
      ['Tasa de Respuesta', `${surveyData.responseRate}%`],
      ['Estudiantes Evaluadores', surveyData.totalEvaluations],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Calificaciones por categoría
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Calificaciones por Categoría', 20, yPos);
    yPos += 10;

    const categoryTableData = surveyData.categoryData.map((cat: any) => [
      cat.category,
      `${cat.rating}/5.0`,
      cat.total.toString()
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['Categoría', 'Calificación', 'Total']],
      body: categoryTableData,
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
    });

    // Guardar archivo
    const fileName = `Resultados_Encuesta_${courseInfo?.code || 'curso'}_${selectedPeriod}.pdf`;
    doc.save(fileName);
  };

  const exportChartsToPNG = async () => {
    const charts = document.querySelectorAll('.recharts-wrapper');
    if (charts.length === 0) {
      alert('No se encontraron gráficos para exportar');
      return;
    }

    try {
      // Exportar cada gráfico
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i] as HTMLElement;
        const canvas = await html2canvas(chart, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Grafico_${i + 1}_${courseInfo?.code || 'curso'}_${selectedPeriod}.png`;
        link.href = imgData;
        link.click();
      }
    } catch (error) {
      console.error('Error exportando gráficos:', error);
      alert('Error al exportar los gráficos');
    }
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
          {/* Header interno con botón de volver y información del contexto */}
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
                    Resultados de Encuesta
                  </h1>
                  <p className="text-sm text-gray-600">
                    Evaluación docente - Período {selectedPeriod}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-32 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                >
                  <option value="2025-2">2025-2</option>
                  <option value="2025-1">2025-1</option>
                  <option value="2024-2">2024-2</option>
                  <option value="2024-1">2024-1</option>
                  <option value="2023-2">2023-2</option>
                  <option value="2023-1">2023-1</option>
                </select>
                
                <Button variant="outline" size="sm" onClick={async () => {
                  if (reportRef.current) {
                    await exportElementToPDF(reportRef.current, `encuesta-${selectedPeriod}.pdf`)
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
            </Button>
          </div>
            </div>

            {/* Información del contexto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <UserIcon className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Profesor</p>
                  <p className="text-sm text-red-700">{professorInfo?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Curso</p>
                  <p className="text-sm text-green-700">{courseInfo?.name} ({courseInfo?.code})</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Grupo</p>
                  <p className="text-sm text-purple-700">Grupo {groupInfo?.number}</p>
                </div>
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
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{surveyData?.totalEvaluations}</div>
                  <p className="text-xs text-gray-500">Este período académico</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{surveyData?.averageRating}/5.0</div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    +{surveyData?.improvement}% vs período anterior
                  </div>
                </CardContent>
            </Card>
          </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
                  <Users className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{surveyData?.responseRate}%</div>
                  <p className="text-xs text-gray-500">De estudiantes elegibles</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estudiantes Evaluadores</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{surveyData?.totalEvaluations}</div>
                  <p className="text-xs text-gray-500">En este grupo</p>
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
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle>Calificaciones por Categoría</CardTitle>
                  <CardDescription>
                    Promedio de calificaciones en cada dimensión evaluada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={surveyData?.categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="rating" fill="#E30613" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle>Tendencia Histórica</CardTitle>
                  <CardDescription>
                    Evolución de las calificaciones a lo largo del tiempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={surveyData?.trendData}>
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle>Perfil de Competencias</CardTitle>
                  <CardDescription>
                    Vista radial de las principales dimensiones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={surveyData?.radarData}>
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle>Distribución de Calificaciones</CardTitle>
                  <CardDescription>
                    Porcentaje de evaluaciones por nivel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={surveyData?.distributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(((percent as number) || 0) * 100).toFixed(0)}%`}
                      >
                        {surveyData?.distributionData?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                  <CardTitle>Estadísticas Rápidas</CardTitle>
                  <CardDescription>
                    Métricas clave del período
                  </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mejor Calificación</span>
                      <Badge className="bg-green-100 text-green-800">
                        {surveyData?.averageRating ? `${surveyData.averageRating.toFixed(1)}/5.0` : 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Evaluaciones</span>
                      <Badge variant="outline">{surveyData?.totalEvaluations || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tasa de Respuesta</span>
                      <Badge variant="outline" className="text-orange-600">{surveyData?.responseRate || 0}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Período</span>
                      <Badge className="bg-red-100 text-red-800">{selectedPeriod}</Badge>
                      </div>
                    </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium mb-3">Información del Grupo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Horario:</span>
                        <span className="font-medium">{groupInfo?.schedule}</span>
                          </div>
                      <div className="flex justify-between">
                        <span>Aula:</span>
                        <span className="font-medium">{groupInfo?.classroom}</span>
                        </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </motion.div>
          </div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
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
                      await exportElementToPDF(reportRef.current, `encuesta-${selectedPeriod}.pdf`)
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Reporte PDF
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    if (!surveyData) return;
                    const sheets = [
                      { name: 'Resumen', rows: [{
                        totalEvaluations: surveyData.totalEvaluations,
                        averageRating: surveyData.averageRating,
                        responseRate: surveyData.responseRate,
                        period: selectedPeriod
                      }] },
                      { name: 'Categorias', rows: surveyData.categoryData || [] },
                      { name: 'Tendencia', rows: surveyData.trendData || [] },
                      { name: 'Distribucion', rows: surveyData.distributionData || [] }
                    ]
                    exportObjectsToExcel(sheets, `encuesta-${selectedPeriod}.xlsx`)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Datos Excel
                  </Button>
                  <Button variant="outline" className="w-full" onClick={async () => {
                    if (reportRef.current) {
                      await exportElementToPNG(reportRef.current, `graficos-encuesta-${selectedPeriod}.png`)
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
        {/* Card de IA: reutilizable en cualquier página */}
        <main className="max-w-7xl mx-auto p-4 lg:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <AISummaryCard
              texts={surveyData?.openResponses || []}
              title="Resumen automático de respuestas abiertas (IA)"
              description="Generado con Hugging Face y extracción local de temas"
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

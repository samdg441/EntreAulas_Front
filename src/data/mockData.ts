/**
 * Datos de ejemplo para previsualización de gráficas
 * Estos datos se muestran cuando no hay datos reales en la base de datos
 */

// Datos de ejemplo para gráfico de tendencias
export const mockTrendData = [
  { period: '2023-1', rating: 4.2, evaluations: 15 },
  { period: '2023-2', rating: 4.4, evaluations: 18 },
  { period: '2024-1', rating: 4.3, evaluations: 22 },
  { period: '2024-2', rating: 4.6, evaluations: 25 },
  { period: '2025-1', rating: 4.5, evaluations: 28 },
  { period: '2025-2', rating: 4.8, evaluations: 32 }
];

// Datos de ejemplo para distribución de calificaciones
export const mockDistributionData = [
  { name: 'Excelente (5.0)', value: 35, count: 35, color: '#10B981' },
  { name: 'Muy Bueno (4.0-4.9)', value: 45, count: 45, color: '#3B82F6' },
  { name: 'Bueno (3.0-3.9)', value: 20, count: 20, color: '#F59E0B' }
];

// Datos de ejemplo para calificaciones por categoría
export const mockCategoryData = [
  { category: 'Comunicación', rating: 4.7, color: '#E30613' },
  { category: 'Conocimiento', rating: 4.5, color: '#F97316' },
  { category: 'Metodología', rating: 4.6, color: '#EAB308' },
  { category: 'Evaluación', rating: 4.4, color: '#22C55E' },
  { category: 'Disponibilidad', rating: 4.8, color: '#06B6D4' }
];

// Datos de ejemplo para perfil de competencias (radar)
export const mockCompetencyData = [
  { subject: 'Comunicación', A: 4.7, fullMark: 5 },
  { subject: 'Conocimiento', A: 4.5, fullMark: 5 },
  { subject: 'Metodología', A: 4.6, fullMark: 5 },
  { subject: 'Evaluación', A: 4.4, fullMark: 5 },
  { subject: 'Disponibilidad', A: 4.8, fullMark: 5 }
];

// Datos de ejemplo para estadísticas rápidas
export const mockQuickStats = {
  totalEvaluations: 100,
  averageRating: 4.6,
  bestRating: 5.0,
  evaluatedCourses: 8,
  currentPeriod: '2025-2',
  responseRate: 85,
  improvement: 12.5
};

// Datos de ejemplo para evaluaciones por curso
export const mockCourseEvaluations = [
  {
    id: 1,
    course: 'Matemáticas I',
    students: 25,
    completed: 23,
    average: 4.5,
    period: 'Semestre 2025-2',
    status: 'completed'
  },
  {
    id: 2,
    course: 'Física II',
    students: 20,
    completed: 18,
    average: 4.7,
    period: 'Semestre 2025-2',
    status: 'completed'
  },
  {
    id: 3,
    course: 'Cálculo III',
    students: 15,
    completed: 15,
    average: 4.3,
    period: 'Semestre 2025-2',
    status: 'completed'
  },
  {
    id: 4,
    course: 'Álgebra Lineal',
    students: 30,
    completed: 28,
    average: 4.8,
    period: 'Semestre 2025-2',
    status: 'completed'
  }
];

// Datos de ejemplo para fechas importantes
export const mockUpcomingDeadlines = [
  { 
    id: 1, 
    course: 'Matemáticas I', 
    task: 'Revisar evaluaciones pendientes', 
    deadline: '2025-01-25', 
    urgent: true 
  },
  { 
    id: 2, 
    course: 'Física II', 
    task: 'Cierre de período de evaluación', 
    deadline: '2025-01-28', 
    urgent: false 
  },
  { 
    id: 3, 
    course: 'Cálculo III', 
    task: 'Envío de reportes', 
    deadline: '2025-02-01', 
    urgent: false 
  }
];

// Función para verificar si hay datos reales
export const hasRealData = (data: any): boolean => {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  return false;
};

// Función para obtener datos de ejemplo con indicador
export const getMockDataWithIndicator = (realData: any, mockData: any) => {
  const hasData = hasRealData(realData);
  return {
    data: hasData ? realData : mockData,
    isMock: !hasData,
    message: hasData ? 'Datos reales' : 'Datos de ejemplo para previsualización'
  };
};









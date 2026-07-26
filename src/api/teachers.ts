import { apiClient } from './client'
import { Teacher } from '../types'
import { EvaluationRequest, EvaluationResponse } from '../types/evaluationTypes'

export interface TeachersResponse {
  teachers: Teacher[]
}

// Función para obtener profesores con sus cursos
export async function fetchTeachersWithCourses(): Promise<Teacher[]> {
  try {
    const response = await apiClient.get<Teacher[]>('/api/teachers')
    return response.data
  } catch (error) {
    console.error('Error fetching teachers:', error)
    throw new Error('Error al cargar los profesores')
  }
}

// Función para obtener grupos de un curso específico
export async function fetchCourseGroups(profesorId: string, courseId: string): Promise<any[]> {
  try {
    console.log('🌐 Making API call to:', `/teachers/${profesorId}/courses/${courseId}/groups`);
    const response = await apiClient.get(`/api/teachers/${profesorId}/courses/${courseId}/groups`)
    console.log('🌐 API Response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching course groups:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al cargar los grupos del curso')
  }
}

export async function fetchTeacherStats(profesorId: string): Promise<any> {
  try {
    console.log('🌐 Making API call to:', `/teachers/teacher-stats/${profesorId}`);
    const response = await apiClient.get(`/api/teachers/teacher-stats/${profesorId}`)
    console.log('🌐 Teacher Stats API Response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching teacher stats:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al cargar las estadísticas del profesor')
  }
}

// Nuevo: estadísticas por período (para cards y tablas sin histórico)
export async function fetchTeacherPeriodStats(period: string): Promise<any> {
  try {
    const url = `/api/teachers/period-stats?period=${encodeURIComponent(period)}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching teacher period stats:', error)
    throw new Error('Error al cargar estadísticas del período')
  }
}

// Nuevo: promedios por categoría del período (opcionalmente por curso)
export async function fetchTeacherPeriodCategoryStats(period: string, courseId?: string | number): Promise<Array<{ categoriaId: number; nombre: string; promedio: number }>> {
  try {
    const params = new URLSearchParams()
    if (period) params.set('period', String(period))
    if (courseId != null) params.set('courseId', String(courseId))
    const url = `/api/teachers/period-category-stats?${params.toString()}`
    const response = await apiClient.get(url)
    return response.data || []
  } catch (error) {
    console.error('❌ Error fetching teacher period category stats:', error)
    return []
  }
}

export async function fetchTeacherHistoricalStats(profesorId: string, period?: string): Promise<any> {
  try {
    const url = period 
      ? `/api/teachers/${profesorId}/stats/historical?period=${period}`
      : `/api/teachers/${profesorId}/stats/historical`;
    console.log('🌐 Making API call to:', url);
    const response = await apiClient.get(url)
    console.log('🌐 Teacher Historical Stats API Response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching teacher historical stats:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al cargar las estadísticas históricas del profesor')
  }
}

export async function submitEvaluation(evaluationData: EvaluationRequest): Promise<EvaluationResponse> {
  try {
    console.log('🌐 Submitting evaluation:', evaluationData);
    const response = await apiClient.post('/api/teachers/evaluations', evaluationData)
    console.log('🌐 Evaluation submission response:', response.data);
    return response.data
  } catch (error: any) {
    console.error('❌ Error submitting evaluation:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    // Re-lanzar el error para que el componente pueda manejarlo
    throw error;
  }
}

export async function fetchEvaluationQuestions(courseId: string): Promise<any> {
  try {
    console.log('🌐 Fetching evaluation questions for courseId:', courseId);
    const response = await apiClient.get(`/api/teachers/evaluation-questions/${courseId}`)
    console.log('🌐 Evaluation questions response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching evaluation questions:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener las preguntas de evaluación')
  }
}

export async function fetchStudentInfo(): Promise<any> {
  try {
    console.log('🌐 Fetching student info');
    const response = await apiClient.get('/api/teachers/student-info')
    console.log('🌐 Student info response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching student info:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener la información del estudiante')
  }
}

// Función para obtener materias específicas de cada profesor
export async function fetchProfessorSubjects(): Promise<any> {
  try {
    console.log('🌐 fetchProfessorSubjects: Obteniendo materias específicas de profesores')
    const response = await apiClient.get('/api/teachers/professor-subjects')
    console.log('🌐 Professor subjects response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching professor subjects:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener las materias específicas de los profesores')
  }
}

// Función para obtener materias de cada carrera
export async function fetchCareerSubjects(): Promise<any> {
  try {
    console.log('🌐 fetchCareerSubjects: Obteniendo materias de cada carrera')
    const response = await apiClient.get('/api/teachers/career-subjects')
    console.log('🌐 Career subjects response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching career subjects:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener las materias de las carreras')
  }
}

// Función para obtener profesores detallados de toda la facultad (con materias)
export async function fetchDetailedFacultyProfessors(): Promise<any> {
  try {
    console.log('🌐 fetchDetailedFacultyProfessors: Obteniendo profesores detallados de toda la facultad')
    const response = await apiClient.get('/api/teachers/detailed-faculty')
    console.log('🌐 Detailed faculty professors response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching detailed faculty professors:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener los profesores detallados de la facultad')
  }
}

// Función para obtener profesores de toda la facultad organizados por carrera (solo para decanos)
export async function fetchFacultyProfessors(): Promise<any> {
  try {
    console.log('🌐 fetchFacultyProfessors: Obteniendo profesores de toda la facultad')
    const response = await apiClient.get('/api/teachers/faculty')
    console.log('🌐 Faculty professors response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching faculty professors:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener los profesores de la facultad')
  }
}

// Función para obtener profesores por carrera (para coordinadores)
export async function fetchProfessorsByCareer(careerId: string): Promise<any[]> {
  try {
    console.log('🌐 fetchProfessorsByCareer: Iniciando llamada a /api/teachers/by-career/' + careerId)
    const response = await apiClient.get(`/api/teachers/by-career/${careerId}`)
    console.log('🌐 fetchProfessorsByCareer: Respuesta recibida:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ fetchProfessorsByCareer: Error:', error)
    throw new Error('Error al cargar los profesores de la carrera')
  }
}

export async function fetchCourseRating(professorId: string, courseId: string): Promise<any> {
  try {
    console.log(`🌐 fetchCourseRating: Obteniendo calificación para profesor ${professorId} en curso ${courseId}`)
    const response = await apiClient.get(`/api/teachers/course-rating/${professorId}/${courseId}`)
    console.log('🌐 fetchCourseRating: Respuesta recibida:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ fetchCourseRating: Error:', error)
    throw new Error('Error al cargar la calificación del curso')
  }
}

// Función para obtener carreras disponibles (para coordinadores)
export async function fetchCareers(): Promise<any[]> {
  try {
    const response = await apiClient.get('/api/teachers/careers')
    return response.data
  } catch (error) {
    console.error('Error fetching careers:', error)
    throw new Error('Error al cargar las carreras')
  }
}

// Función para obtener cursos de un profesor específico
export async function fetchTeacherCourses(teacherId: string): Promise<any[]> {
  try {
    console.log('🌐 Fetching teacher courses for ID:', teacherId);
    const response = await apiClient.get(`/api/teachers/teacher-courses/${teacherId}`);
    console.log('✅ Teacher courses loaded:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching teacher courses:', error);
    throw new Error('Error al obtener los cursos del profesor');
  }
}

// Función para obtener estadísticas del coordinador (solo de su carrera)
export async function fetchCoordinatorStats(): Promise<{
  totalProfesores: number;
  totalCursos: number;
  totalCarreras: number;
}> {
  try {
    console.log('🌐 Fetching coordinator stats...');
    
    // Obtener la carrera del coordinador desde localStorage
    const raw = localStorage.getItem('user');
    if (!raw) {
      throw new Error('No se encontró información del usuario');
    }
    
    const user = JSON.parse(raw);
    console.log('🔍 Usuario completo desde localStorage:', user);
    console.log('🔍 user.coordinador:', user?.coordinador);
    console.log('🔍 user.carrera_id:', user?.carrera_id);
    console.log('🔍 user.profesor:', user?.profesor);
    
    let carreraId = String(user?.coordinador?.carrera_id ?? user?.carrera_id ?? user?.profesor?.carrera_id ?? '');
    
    // TEMPORAL: Forzar carrera_id para coordinadores conocidos
    if (user?.email === 'ejhernandez@udemedellin.edu.co') {
      carreraId = '1'; // Emilcy - Sistemas
      console.log('🔧 TEMPORAL: Forzando carrera_id = 1 para Emilcy (Sistemas)');
    } else if (user?.email === 'magonzalez@udemedellin.edu.co') {
      carreraId = '5'; // Mauricio - Telecomunicaciones
      console.log('🔧 TEMPORAL: Forzando carrera_id = 5 para Mauricio (Telecomunicaciones)');
    } else if (user?.email === 'david.coordinador@udemedellin.edu.co' || user?.nombre?.toLowerCase().includes('david')) {
      carreraId = '6'; // David - Ingeniería Financiera
      console.log('🔧 TEMPORAL: Forzando carrera_id = 6 para David (Ingeniería Financiera)');
    }
    
    console.log('🔍 Carrera del coordinador final:', carreraId);
    
    if (!carreraId) {
      // Si no tiene carrera asignada, retornar valores por defecto
      console.warn('⚠️ Coordinador sin carrera asignada');
      return {
        totalProfesores: 0,
        totalCursos: 0,
        totalCarreras: 0
      };
    }
    
    // Obtener profesores de la carrera específica del coordinador
    console.log('🔍 Llamando a fetchProfessorsByCareer con carreraId:', carreraId);
    const profesores = await fetchProfessorsByCareer(carreraId);
    console.log('🔍 Profesores obtenidos:', profesores);
    console.log('🔍 Cantidad de profesores:', profesores?.length || 0);
    
    // Obtener TODOS los cursos de la carrera (no solo los que tienen profesores)
    console.log('🔍 Obteniendo todos los cursos de la carrera:', carreraId);
    const response = await apiClient.get(`/api/courses/by-career/${carreraId}`);
    const todosLosCursos = response.data;
    const cursosError = null; // No hay error handling específico para este endpoint
    
    let totalCursos = 0;
    if (cursosError) {
      console.warn('⚠️ Error obteniendo todos los cursos, usando solo cursos con profesores:', cursosError);
      // Fallback: contar solo cursos con profesores
      const cursosUnicos = new Set();
      profesores.forEach((profesor: any) => {
        if (profesor.cursos && Array.isArray(profesor.cursos)) {
          profesor.cursos.forEach((course: any) => {
            cursosUnicos.add(course.id);
          });
        }
      });
      totalCursos = cursosUnicos.size;
    } else {
      totalCursos = todosLosCursos?.length || 0;
      console.log('✅ Total de cursos de la carrera:', totalCursos);
    }
    
    const stats = {
      totalProfesores: profesores.length,
      totalCursos: totalCursos,
      totalCarreras: 1 // Siempre será 1 (la carrera del coordinador)
    };
    
    console.log('✅ Coordinator stats for carrera', carreraId, ':', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching coordinator stats:', error);
    throw new Error('Error al obtener estadísticas del coordinador');
  }
}

export interface CoordinatorTeacherSummary {
  profesorId: number;
  nombre: string;
  email: string;
  totalEvaluaciones: number;
  promedio: number;
}

export interface CoordinatorDashboardSummaryResponse {
  stats: {
    totalProfesores: number;
    totalCursos: number;
    promedioEvaluaciones: number;
    profesoresEnRiesgo: number;
    totalEvaluaciones: number;
  };
  teachers: CoordinatorTeacherSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CoordinatorReportsOverviewResponse {
  summary: {
    totalEvaluaciones: number;
    calificacionPromedio: number;
    tasaRespuesta: number;
    docentesEvaluados: number;
    cursosEvaluados: number;
    estudiantesRespondieron: number;
  };
  categoryStats: Array<{
    categoriaId: string | number;
    nombre: string;
    promedio: number;
  }>;
  teacherAverages: Array<{
    profesorId: string;
    nombre: string;
    promedio: number;
    totalEvaluaciones: number;
  }>;
  courseAverages: Array<{
    cursoId: number;
    nombre: string;
    promedio: number;
    totalEvaluaciones: number;
  }>;
  reportRows: Array<Record<string, string | number | null>>;
  trend: Array<{
    period: string;
    rating: number;
    totalEvaluations: number;
  }>;
  distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export async function fetchCoordinatorDashboardSummary(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<CoordinatorDashboardSummaryResponse> {
  try {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.search && params.search.trim()) query.set('search', params.search.trim())

    const url = `/api/coordinador/dashboard-summary${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching coordinator dashboard summary:', error)
    throw new Error('Error al cargar el resumen del coordinador')
  }
}

export async function fetchCoordinatorReportsOverview(period: string): Promise<CoordinatorReportsOverviewResponse> {
  try {
    const query = new URLSearchParams()
    if (period) query.set('period', String(period))
    const url = `/api/coordinador/reports-overview${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching coordinator reports overview:', error)
    throw new Error('Error al cargar los reportes del coordinador')
  }
}

export async function fetchCoordinatorProfessorStats(profesorId: string | number, period: string): Promise<any> {
  try {
    const query = new URLSearchParams()
    if (period) query.set('period', String(period))
    const url = `/api/coordinador/profesor-stats/${profesorId}${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching coordinator professor stats:', error)
    throw new Error('Error al cargar estadísticas del docente')
  }
}

// Función para obtener información del profesor actual
export async function fetchTeacherInfo(): Promise<any> {
  try {
    console.log('🌐 Fetching teacher info');
    const response = await apiClient.get('/api/teachers/teacher-info')
    console.log('🌐 Teacher info response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching teacher info:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener la información del profesor')
  }
}

// Función para obtener el ID del profesor desde el usuario autenticado
export async function fetchTeacherId(): Promise<string> {
  try {
    console.log('🌐 Fetching teacher ID from authenticated user');
    const response = await apiClient.get('/api/teachers/teacher-id')
    console.log('🌐 Teacher ID response:', response.data);
    return response.data.teacherId
  } catch (error) {
    console.error('❌ Error fetching teacher ID:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener el ID del profesor')
  }
}

// Función para obtener la encuesta por carrera
export async function fetchSurveyByCareer(careerId: string): Promise<any> {
  try {
    console.log('🌐 Fetching survey for career:', careerId);
    const response = await apiClient.get(`/api/teachers/survey-by-career/${careerId}`)
    console.log('🌐 Survey by career response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Error fetching survey by career:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener la encuesta de la carrera')
  }
}

// Función de debug para verificar información del usuario
export async function debugUserInfo(): Promise<any> {
  try {
    console.log('🌐 Debug: Fetching user info');
    const response = await apiClient.get('/api/teachers/debug-user')
    console.log('🌐 Debug user info response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Debug: Error fetching user info:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener información de debug del usuario')
  }
}

// Función de debug para verificar asignaciones de profesores
export async function debugAssignments(careerId: string): Promise<any> {
  try {
    console.log('🌐 Debug: Fetching assignments for career:', careerId);
    const response = await apiClient.get(`/api/teachers/debug-assignments/${careerId}`)
    console.log('🌐 Debug assignments response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Debug: Error fetching assignments:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener información de debug de asignaciones')
  }
}

// Función de debug para verificar grupos de un curso
export async function debugGroups(profesorId: string, courseId: string): Promise<any> {
  try {
    console.log('🌐 Debug: Fetching groups for profesor:', profesorId, 'course:', courseId);
    const response = await apiClient.get(`/api/teachers/debug-groups/${profesorId}/${courseId}`)
    console.log('🌐 Debug groups response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Debug: Error fetching groups:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    throw new Error('Error al obtener información de debug de grupos')
  }
}

// Función de debug para verificar autenticación
export async function debugAuth(): Promise<any> {
  try {
    console.log('🌐 Debug Auth: Testing authentication');
    const response = await apiClient.get('/api/teachers/debug-auth')
    console.log('🌐 Debug Auth response:', response.data);
    return response.data
  } catch (error) {
    console.error('❌ Debug Auth: Error:', error)
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    });
    return {
      error: true,
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    }
  }
}

// Función para obtener resultados de todas las carreras
export async function fetchAllCareerResults(): Promise<any> {
  try {
    const response = await apiClient.get('/api/teachers/career-results/all')
    return response.data
  } catch (error) {
    console.error('Error fetching all career results:', error)
    throw new Error('Error al cargar los resultados de todas las carreras')
  }
}

// Función para obtener resultados de una carrera específica
export async function fetchCareerResults(careerId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/teachers/career-results/${careerId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching career results:', error)
    throw new Error('Error al cargar los resultados de la carrera')
  }
}

// Función para obtener estadísticas del estudiante
export async function fetchStudentStats(): Promise<{
  evaluacionesCompletadas: number;
  evaluacionesPendientes: number;
  materiasMatriculadas: number;
  promedioGeneral: number;
  progresoGeneral: number;
}> {
  try {
    console.log('🌐 Fetching student stats...');
    const response = await apiClient.get('/api/teachers/student-stats')
    console.log('🌐 Student stats response:', response.data);
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching student stats:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    throw new Error('Error al obtener las estadísticas del estudiante')
  }
}

// Función para obtener materias matriculadas del estudiante
export async function fetchStudentEnrolledSubjects(): Promise<{
  materiasMatriculadas: Array<{
    id: string;
    fechaInscripcion: string;
    grupo: {
      id: number;
      numeroGrupo: number;
      horario: string;
      aula: string;
      curso: {
        id: number;
        nombre: string;
        codigo: string;
        creditos: number;
      };
      profesor: {
        id: string;
        nombre: string;
      };
      periodo: {
        id: number;
        nombre: string;
        codigo: string;
      };
    };
  }>;
  total: number;
}> {
  try {
    console.log('🌐 Fetching student enrolled subjects...');
    const response = await apiClient.get('/api/teachers/student-enrolled-subjects')
    console.log('🌐 Student enrolled subjects response:', response.data);
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching student enrolled subjects:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    throw new Error('Error al obtener las materias matriculadas')
  }
}


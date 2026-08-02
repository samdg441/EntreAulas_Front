import { apiClient } from './client'

export interface CoordinatorTeacherSummary {
  profesorId: number
  nombre: string
  email: string
  totalEvaluaciones: number
  promedio: number
}

export interface CoordinatorDashboardSummaryResponse {
  stats: {
    totalProfesores: number
    totalCursos: number
    promedioEvaluaciones: number
    profesoresEnRiesgo: number
    totalEvaluaciones: number
  }
  teachers: CoordinatorTeacherSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CoordinatorReportsOverviewResponse {
  summary: {
    totalEvaluaciones: number
    calificacionPromedio: number
    tasaRespuesta: number
    docentesEvaluados: number
    cursosEvaluados: number
    estudiantesRespondieron: number
  }
  categoryStats: Array<{
    categoriaId: string | number
    nombre: string
    promedio: number
  }>
  teacherAverages: Array<{
    profesorId: string
    nombre: string
    promedio: number
    totalEvaluaciones: number
  }>
  courseAverages: Array<{
    cursoId: number
    nombre: string
    promedio: number
    totalEvaluaciones: number
  }>
  reportRows: Array<Record<string, string | number | null>>
  trend: Array<{
    period: string
    rating: number
    totalEvaluations: number
  }>
  distribution: Array<{
    name: string
    value: number
    color: string
  }>
}

/** Cursos/grupos del coordinador con profesor asignado. */
export async function fetchCursosConProfesor() {
  const res = await apiClient.get('/api/coordinador/cursos-con-profesor')
  return res.data
}

export async function fetchCoordinatorDashboardSummary(params?: {
  page?: number
  pageSize?: number
  search?: string
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

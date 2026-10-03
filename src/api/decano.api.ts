import { apiClient } from './client'
import type { CoordinatorReportsOverviewResponse } from './coordinador.api'

/** Reporte del decano: el mismo formato del coordinador, para una carrera o toda la facultad. */
export async function fetchDecanoReportsOverview(
  period: string,
  careerId?: string,
  courseId?: string,
  grupoId?: string
): Promise<CoordinatorReportsOverviewResponse> {
  const query = new URLSearchParams()
  if (period) query.set('period', period)
  if (careerId && careerId !== 'all') query.set('careerId', careerId)
  if (courseId && courseId !== 'all') query.set('courseId', courseId)
  if (grupoId && grupoId !== 'all') query.set('grupoId', grupoId)
  const response = await apiClient.get(`/api/decano/reports-overview?${query.toString()}`)
  return response.data
}

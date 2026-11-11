import { apiClient } from './client'

export type AccionAuditoria = 'programar_encuesta' | 'generar_qr' | 'consultar_reportes' | 'consultar_docente'

export interface EventoAuditoria {
  id: number
  actorId: string
  actorNombre: string
  actorRol: string
  accion: AccionAuditoria | string
  entidad: string
  entidadId: string | null
  detalle: string
  creadoEn: string
}

export interface RespuestaAuditoria {
  disponible: boolean
  aviso?: string
  eventos: EventoAuditoria[]
  resumen: { total: number; porAccion: Record<string, number>; ultimoEvento: string | null }
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface FiltrosAuditoria {
  page?: number
  pageSize?: number
  accion?: AccionAuditoria | 'todas'
  desde?: string
  hasta?: string
  search?: string
}

export const ACCIONES: AccionAuditoria[] = ['programar_encuesta', 'generar_qr', 'consultar_reportes', 'consultar_docente']

/** GET /api/coordinador/auditoria: eventos de la carrera del coordinador. */
export async function fetchAuditoria(filtros: FiltrosAuditoria = {}): Promise<RespuestaAuditoria> {
  const query = new URLSearchParams()
  if (filtros.page) query.set('page', String(filtros.page))
  if (filtros.pageSize) query.set('pageSize', String(filtros.pageSize))
  if (filtros.accion && filtros.accion !== 'todas') query.set('accion', filtros.accion)
  if (filtros.desde) query.set('desde', filtros.desde)
  if (filtros.hasta) query.set('hasta', filtros.hasta)
  if (filtros.search?.trim()) query.set('search', filtros.search.trim())
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await apiClient.get<RespuestaAuditoria>(`/api/coordinador/auditoria${suffix}`)
  return response.data
}

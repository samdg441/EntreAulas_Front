import { decidirAccesoRuta } from '../../features/auth/dashboard-path'

export type ResultadoResumen = {
  summary?: string
  topics?: string[]
  textsCount?: number
  ratingsCount?: number
  analysisSource?: 'open_text' | 'quantitative_fallback'
}

export function decidirMontajeReportes(authUser: unknown): 'login' | 'reportes' {
  return authUser ? 'reportes' : 'login'
}

export function destinoTras401(status: number): 'login' | 'seguir' {
  return status === 401 ? 'login' : 'seguir'
}

export function endpointPorRol(
  type: string
): 'by-professor' | 'by-career' | 'by-faculty' {
  if (type === 'teacher') return 'by-professor'
  if (type === 'coordinator') return 'by-career'
  if (type === 'decano') return 'by-faculty'
  return 'by-professor'
}

export function hayResumenParaPintar(result: ResultadoResumen | null): boolean {
  if (!result) return false
  return (
    (result.textsCount ?? 0) > 0 || result.analysisSource === 'quantitative_fallback'
  )
}

export function esAvisoSinRespuestas(result: ResultadoResumen | null): boolean {
  if (!result) return false
  return result.textsCount === 0 && result.analysisSource !== 'quantitative_fallback'
}

export function mensajeErrorResumen(error: {
  response?: { data?: { error?: string; details?: string }; status?: number }
  message?: string
} | null): string {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message ||
    'No se pudo generar el resumen automáticamente'
  )
}

export function decidirVistaResumen(params: {
  haySesion: boolean
  status?: number
  result?: ResultadoResumen | null
}): 'login' | 'error' | 'aviso-sin-respuestas' | 'pintar' {
  if (!params.haySesion || params.status === 401) return 'login'
  if (params.status && params.status >= 400) return 'error'
  if (esAvisoSinRespuestas(params.result ?? null)) return 'aviso-sin-respuestas'
  if (hayResumenParaPintar(params.result ?? null)) return 'pintar'
  return 'error'
}

export function accesoReportes(params: {
  token: string | null
  savedUser: string | null
  user: { tipo_usuario?: string; roles?: string[] } | null
}) {
  return decidirAccesoRuta(params)
}

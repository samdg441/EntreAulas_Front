import {
  decidirVistaResumen,
  esAvisoSinRespuestas,
  hayResumenParaPintar,
  type ResultadoResumen,
} from './resumen-ia'

export type ResultadoAlerta = ResultadoResumen & {
  acosoDetectado?: boolean
  mensajeAcoso?: string
  acosoProfesores?: Array<{
    profesorId: string
    nombre: string
    menciones: number
    ejemplos: string[]
  }>
}

export function muestraBannerAcoso(result: ResultadoAlerta | null): boolean {
  if (!result || !hayResumenParaPintar(result)) return false
  return Boolean(result.acosoDetectado && result.mensajeAcoso)
}

export function muestraListaDocentesAcoso(result: ResultadoAlerta | null): boolean {
  if (!result || !hayResumenParaPintar(result)) return false
  return Boolean(result.acosoProfesores && result.acosoProfesores.length > 0)
}

export function tituloAlertaAcoso() {
  return 'ALERTA DE ACOSO DETECTADO'
}

export function decidirVistaAlerta(params: {
  haySesion: boolean
  status?: number
  result?: ResultadoAlerta | null
}): 'login' | 'error' | 'aviso-sin-respuestas' | 'resumen' | 'alerta' {
  const base = decidirVistaResumen(params)
  if (base !== 'pintar') return base
  if (muestraBannerAcoso(params.result ?? null) || muestraListaDocentesAcoso(params.result ?? null)) {
    return 'alerta'
  }
  return 'resumen'
}

export { esAvisoSinRespuestas, hayResumenParaPintar }

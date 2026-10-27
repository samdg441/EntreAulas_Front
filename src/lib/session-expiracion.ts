/** Menos de una hora restante: hay que ofrecer extender o cerrar la sesión. */
export const UMBRAL_AVISO_SESION_MS = 60 * 60 * 1000

export type EstadoSesion = 'sin-sesion' | 'activa' | 'por-vencer' | 'expirada'

function decodificarSegmento(segmento: string): unknown {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/')
  const resto = base64.length % 4
  const conPadding = resto ? base64 + '='.repeat(4 - resto) : base64
  return JSON.parse(atob(conPadding))
}

/** `exp` del JWT en segundos Unix. No verifica la firma: el backend sigue siendo quien valida. */
export function expiracionDelToken(token: string | null | undefined): number | null {
  if (!token) return null
  const segmento = token.split('.')[1]
  if (!segmento) return null
  try {
    const payload = decodificarSegmento(segmento) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function estadoSesion(
  exp: number | null,
  ahoraMs: number,
  descartadaEn: number | null
): EstadoSesion {
  if (exp == null) return 'sin-sesion'
  const restante = exp * 1000 - ahoraMs
  if (restante <= 0) return 'expirada'
  if (descartadaEn === exp) return 'activa'
  if (restante < UMBRAL_AVISO_SESION_MS) return 'por-vencer'
  return 'activa'
}

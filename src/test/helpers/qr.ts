const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function tokenDesdeUrl(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const token = params.get('token')?.trim()
  return token || null
}

export function mensajeTokenQr(token: string | null): string | null {
  if (!token) return 'No se encontró token en el QR.'
  return null
}

export function decidirEntradaQr(params: {
  token: string | null
  sesion: boolean
  qrValido: boolean
  autoEnrollOk: boolean
}): 'error-local' | 'login' | 'error-api' | 'formulario' {
  if (!params.token) return 'error-local'
  if (!params.sesion) return 'login'
  if (!params.qrValido || !params.autoEnrollOk) return 'error-api'
  return 'formulario'
}

export function validarCorreoQr(body: { to?: string; subject?: string; grupoIds?: number[] }): {
  ok: boolean
  error?: string
} {
  const email = String(body.to || '').trim()
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Correo de destino inválido.' }
  }
  if (!String(body.subject || '').trim()) {
    return { ok: false, error: 'El asunto es requerido.' }
  }
  if (!body.grupoIds?.length) {
    return { ok: false, error: 'Se requiere grupoIds (array de IDs de grupo).' }
  }
  return { ok: true }
}

export function validarFechasQr(startDate?: string, endDate?: string): { ok: boolean; error?: string } {
  if (!startDate || !endDate) return { ok: true }
  if (startDate > endDate) {
    return { ok: false, error: 'La fecha de inicio no puede ser posterior a la de fin.' }
  }
  return { ok: true }
}

export function decidirGeneracionQr(params: {
  grupoIds: number[]
  startDate?: string
  endDate?: string
}): { ok: boolean; error?: string } {
  const fechas = validarFechasQr(params.startDate, params.endDate)
  if (!fechas.ok) return fechas
  if (!params.grupoIds.length) {
    return { ok: false, error: 'Se requiere grupoIds (array de IDs de grupo).' }
  }
  return { ok: true }
}

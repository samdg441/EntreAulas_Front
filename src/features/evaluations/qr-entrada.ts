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

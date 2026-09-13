const EMAIL_REGEX = /^[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{1,63}$/

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
  const ids = params.grupoIds.filter((n) => Number.isInteger(n) && n > 0)
  if (!ids.length) {
    return { ok: false, error: 'Se requiere grupoIds (array de IDs de grupo).' }
  }
  return { ok: true }
}

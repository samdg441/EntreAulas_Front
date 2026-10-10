import { describe, expect, it } from 'vitest'
import { decidirGeneracionQr, validarCorreoQr } from '../../features/evaluations/qr-validacion'

/**
 * RQ18 — Entradas maliciosas en el envío de QR por correo.
 * Un correo con saltos de línea permite inyectar cabeceras (Bcc:) en el mensaje.
 */
describe('RQ18 — Seguridad: validación del correo y los grupos', () => {
  const base = { to: 'ana@udemedellin.edu.co', subject: 'Evaluación', grupoIds: [12] }

  it.each([
    ['inyección de cabecera con salto de línea', 'ana@udem.edu.co\nBcc: todos@evil.co'],
    ['inyección con retorno de carro', 'ana@udem.edu.co\r\nCc: x@evil.co'],
    ['varios destinatarios con coma', 'ana@udem.edu.co,luis@evil.co'],
    ['varios destinatarios con espacio', 'ana@udem.edu.co luis@evil.co'],
    ['sin dominio', 'ana@'],
    ['sin TLD', 'ana@udem'],
    ['parte local de 65 caracteres', `${'a'.repeat(65)}@udem.edu.co`],
  ])('rechaza %s', (_caso, to) => {
    expect(validarCorreoQr({ ...base, to })).toEqual({ ok: false, error: 'Correo de destino inválido.' })
  })

  it('acepta el límite exacto de 64 caracteres en la parte local', () => {
    expect(validarCorreoQr({ ...base, to: `${'a'.repeat(64)}@udem.edu.co` }).ok).toBe(true)
  })

  it('un asunto solo con espacios no pasa', () => {
    expect(validarCorreoQr({ ...base, subject: '   ' }).error).toBe('El asunto es requerido.')
  })

  it.each([
    ['negativos', [-1, -12]],
    ['cero', [0]],
    ['decimales', [1.5]],
    ['NaN e infinito', [Number.NaN, Number.POSITIVE_INFINITY]],
    ['texto con SQL disfrazado de número', ['1 OR 1=1' as unknown as number]],
  ])('grupoIds manipulados (%s) no generan QR', (_caso, grupoIds) => {
    expect(decidirGeneracionQr({ grupoIds })).toEqual({
      ok: false,
      error: 'Se requiere grupoIds (array de IDs de grupo).',
    })
  })

  it('mezclar ids válidos con basura no bloquea los válidos', () => {
    expect(decidirGeneracionQr({ grupoIds: [12, -1, Number.NaN] }).ok).toBe(true)
  })
})

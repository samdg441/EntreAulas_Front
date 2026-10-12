import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta } from '../../features/auth/dashboard-path'
import { validarCorreoQr } from '../../features/evaluations/qr-validacion'

const sesion = '{"id":"u-ana"}'

describe('RQ6 y RQ16 — Seguridad en el front', () => {
  it.each([
    { caso: 'sin token', token: null, user: { tipo_usuario: 'admin' }, esperado: 'login' },
    { caso: 'estudiante en admin', token: 'jwt', user: { tipo_usuario: 'estudiante' }, esperado: 'forbidden' },
    { caso: 'admin', token: 'jwt', user: { tipo_usuario: 'admin' }, esperado: 'ok' },
  ])('RQ6: $caso → $esperado', ({ token, user, esperado }) => {
    expect(decidirAccesoRuta({ token, savedUser: sesion, user, allowedRoles: ['admin'] })).toBe(esperado)
  })

  it.each(['ana@udemedellin.edu.co\nBcc: todos@evil.co', 'ana@udemedellin.edu.co\r\nCc: x@evil.co', 'no-es-correo'])(
    'RQ16: %j no sale como destinatario',
    (to) => {
      expect(validarCorreoQr({ to, subject: 'Evaluación', grupoIds: [63] })).toMatchObject({
        ok: false,
        error: 'Correo de destino inválido.',
      })
    }
  )
})

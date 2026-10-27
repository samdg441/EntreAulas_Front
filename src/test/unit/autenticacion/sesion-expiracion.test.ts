import { describe, expect, it } from 'vitest'
import { estadoSesion, expiracionDelToken, UMBRAL_AVISO_SESION_MS } from '../../../lib/session-expiracion'

function tokenConExp(exp: number) {
  const cuerpo = btoa(JSON.stringify({ exp }))
  return `encabezado.${cuerpo}.firma`
}

describe('ciclo de vida de la sesión en el cliente', () => {
  const ahora = 1_700_000_000_000

  it('lee exp del JWT sin verificar la firma', () => {
    expect(expiracionDelToken(tokenConExp(1_700_003_600))).toBe(1_700_003_600)
    expect(expiracionDelToken(null)).toBeNull()
    expect(expiracionDelToken('no-es-jwt')).toBeNull()
  })

  it('avisa solo cuando falta menos de una hora y el aviso no se cerró', () => {
    const en50Min = Math.floor((ahora + 50 * 60 * 1000) / 1000)
    const en2Horas = Math.floor((ahora + 2 * 60 * 60 * 1000) / 1000)

    expect(estadoSesion(en50Min, ahora, null)).toBe('por-vencer')
    expect(estadoSesion(en2Horas, ahora, null)).toBe('activa')
    expect(estadoSesion(en50Min, ahora, en50Min)).toBe('activa')
    expect(estadoSesion(Math.floor((ahora - 1000) / 1000), ahora, null)).toBe('expirada')
    expect(UMBRAL_AVISO_SESION_MS).toBe(60 * 60 * 1000)
  })
})

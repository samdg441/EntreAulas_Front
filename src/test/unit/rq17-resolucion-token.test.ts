import { describe, expect, it } from 'vitest'
import { decidirEntradaQr, mensajeTokenQr, tokenDesdeUrl } from '../helpers/qr'
import qrFixture from '../fixtures/rq18-qr.json'

class RQ17ResolucionToken {
  C1_urlSinToken() {
    expect(tokenDesdeUrl('')).toBeNull()
    expect(mensajeTokenQr(null)).toBe(qrFixture.sinToken.mensajeError)
  }

  C2_sinSesion() {
    expect(
      decidirEntradaQr({ token: qrFixture.tokenValido.token, sesion: false, qrValido: true, autoEnrollOk: true })
    ).toBe('login')
  }

  C3_getError() {
    expect(
      decidirEntradaQr({ token: 'abc', sesion: true, qrValido: false, autoEnrollOk: false })
    ).toBe('error-api')
  }

  C4_ok() {
    expect(tokenDesdeUrl(qrFixture.tokenValido.url.replace('/qr-evaluacion', ''))).toBe(
      qrFixture.tokenValido.token
    )
    expect(
      decidirEntradaQr({ token: 'abc', sesion: true, qrValido: true, autoEnrollOk: true })
    ).toBe('formulario')
  }
}

const pruebas = new RQ17ResolucionToken()

describe('RQ17 — Resolución de token QR (frontend)', () => {
  it('C1: URL sin token', () => pruebas.C1_urlSinToken())
  it('C2: sin sesión → login', () => pruebas.C2_sinSesion())
  it('C3: GET error', () => pruebas.C3_getError())
  it('C4: token válido', () => pruebas.C4_ok())
})

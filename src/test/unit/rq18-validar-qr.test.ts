import { describe, expect, it } from 'vitest'
import { decidirEntradaQr, mensajeTokenQr, tokenDesdeUrl } from '../../features/evaluations/qr-entrada'
import qrFixture from '../fixtures/rq18-qr.json'

class RQ18ValidarQr {
  C1_sinToken() {
    expect(tokenDesdeUrl(qrFixture.sinToken.url.replace('/qr-evaluacion', ''))).toBeNull()
    expect(mensajeTokenQr(null)).toBe(qrFixture.sinToken.mensajeError)
  }

  C2_sinSesion() {
    expect(decidirEntradaQr({ token: 'abc', sesion: false, qrValido: true, autoEnrollOk: true })).toBe(
      'login'
    )
  }

  C3_apiError() {
    expect(decidirEntradaQr({ token: 'vencido', sesion: true, qrValido: false, autoEnrollOk: false })).toBe(
      'error-api'
    )
  }

  C4_ok() {
    expect(tokenDesdeUrl('?token=abc123')).toBe('abc123')
    expect(decidirEntradaQr({ token: 'abc123', sesion: true, qrValido: true, autoEnrollOk: true })).toBe(
      'formulario'
    )
  }
}

const pruebas = new RQ18ValidarQr()

describe('RQ18 — Validar QR (frontend)', () => {
  it('C1: sin token', () => pruebas.C1_sinToken())
  it('C2: sin sesión', () => pruebas.C2_sinSesion())
  it('C3: API error', () => pruebas.C3_apiError())
  it('C4: QR válido', () => pruebas.C4_ok())
})

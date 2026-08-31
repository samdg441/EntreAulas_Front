import { describe, expect, it } from 'vitest'
import { decidirEntradaQr } from '../helpers/qr'

class RQ14AutoInscripcion {
  C1_sinSesion() {
    expect(decidirEntradaQr({ token: 'abc', sesion: false, qrValido: true, autoEnrollOk: true })).toBe(
      'login'
    )
  }

  C2_autoEnrollFalla() {
    expect(decidirEntradaQr({ token: 'abc', sesion: true, qrValido: true, autoEnrollOk: false })).toBe(
      'error-api'
    )
  }

  C3_ok() {
    expect(decidirEntradaQr({ token: 'abc', sesion: true, qrValido: true, autoEnrollOk: true })).toBe(
      'formulario'
    )
  }

  C4_qrInvalido() {
    expect(decidirEntradaQr({ token: 'abc', sesion: true, qrValido: false, autoEnrollOk: false })).toBe(
      'error-api'
    )
  }
}

const pruebas = new RQ14AutoInscripcion()

describe('RQ14 — Auto-inscripción (frontend)', () => {
  it('C1: sin sesión → login', () => pruebas.C1_sinSesion())
  it('C2: auto-enroll falla → error', () => pruebas.C2_autoEnrollFalla())
  it('C3: auto-enroll OK → formulario', () => pruebas.C3_ok())
  it('C4: QR inválido → error', () => pruebas.C4_qrInvalido())
})

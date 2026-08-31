import { describe, expect, it } from 'vitest'
import { validarCorreoQr } from '../helpers/qr'

class RQ16CorreoQr {
  C1_sinDestinatario() {
    expect(validarCorreoQr({ subject: 'QR', grupoIds: [1] }).ok).toBe(false)
  }

  C2_correoInvalido() {
    expect(validarCorreoQr({ to: 'hola', subject: 'QR', grupoIds: [1] }).error).toMatch(/Correo/)
  }

  C3_ok() {
    expect(validarCorreoQr({ to: 'a@b.com', subject: 'QR', grupoIds: [1] }).ok).toBe(true)
  }
}

const pruebas = new RQ16CorreoQr()

describe('RQ16 — Distribución por correo (frontend)', () => {
  it('C1: sin destinatario', () => pruebas.C1_sinDestinatario())
  it('C2: correo inválido', () => pruebas.C2_correoInvalido())
  it('C3: datos correctos', () => pruebas.C3_ok())
})

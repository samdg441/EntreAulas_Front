import { describe, expect, it } from 'vitest'
import { decidirGeneracionQr, validarFechasQr } from '../helpers/qr'

class RQ15GenerarQr {
  C1_fechasInvertidas() {
    const r = validarFechasQr('2026-06-01', '2026-03-01')
    expect(r.ok).toBe(false)
  }

  C2_sinGrupos() {
    const r = decidirGeneracionQr({ grupoIds: [] })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/grupoIds/)
  }

  C3_fechasValidas() {
    expect(validarFechasQr('2026-03-01', '2026-06-01').ok).toBe(true)
  }

  C4_genera() {
    expect(decidirGeneracionQr({ grupoIds: [1], startDate: '2026-03-01', endDate: '2026-06-01' }).ok).toBe(
      true
    )
  }

  C5_idsNegativos() {
    expect(decidirGeneracionQr({ grupoIds: [-1, 0] }).ok).toBe(false)
  }
}

const pruebas = new RQ15GenerarQr()

describe('RQ15 — Generación masiva de QR (frontend)', () => {
  it('C1: fechas invertidas', () => pruebas.C1_fechasInvertidas())
  it('C2: sin grupos', () => pruebas.C2_sinGrupos())
  it('C3: fechas válidas', () => pruebas.C3_fechasValidas())
  it('C4: genera con grupos', () => pruebas.C4_genera())
  it('C5: IDs negativos o cero no se aceptan', () => pruebas.C5_idsNegativos())
})

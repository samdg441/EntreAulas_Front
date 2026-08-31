import { describe, expect, it } from 'vitest'
import { esPeriodoValido, rangoFechasPeriodo, resumenMetricasProfesor } from '../helpers/metricas'

class RQ23EstadisticasHistoricas {
  C3_promedio() {
    const r = resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 5 }])
    expect(r.calificacionPromedio).toBe(4.5)
    expect(r.totalEvaluaciones).toBe(2)
  }

  C4_vacio() {
    expect(resumenMetricasProfesor([])).toEqual({ calificacionPromedio: 0, totalEvaluaciones: 0 })
  }

  C6_rangoPeriodo() {
    expect(rangoFechasPeriodo('2026-1')).toEqual({ start: '2026-01-01', end: '2026-06-30' })
    expect(rangoFechasPeriodo('2026-2')).toEqual({ start: '2026-07-01', end: '2026-12-31' })
  }

  C7_periodoInvalido() {
    expect(esPeriodoValido('2026-1')).toBe(true)
    expect(esPeriodoValido('2026')).toBe(false)
    expect(esPeriodoValido('2026-9')).toBe(false)
    expect(esPeriodoValido('abc')).toBe(false)
  }

  C8_notasInvalidas() {
    const r = resumenMetricasProfesor([
      { calificacion_promedio: 4 },
      { calificacion_promedio: -2 },
      { calificacion_promedio: 99 },
    ])
    expect(r.calificacionPromedio).toBe(4)
    expect(r.totalEvaluaciones).toBe(1)
  }
}

const pruebas = new RQ23EstadisticasHistoricas()

describe('RQ23 — Estadísticas históricas (frontend)', () => {
  it('C3: promedio del período', () => pruebas.C3_promedio())
  it('C4: sin datos → ceros', () => pruebas.C4_vacio())
  it('C6: rangos 2026-1 y 2026-2', () => pruebas.C6_rangoPeriodo())
  it('C7: período mal formado no es válido', () => pruebas.C7_periodoInvalido())
  it('C8: notas fuera de 1–5 no entran', () => pruebas.C8_notasInvalidas())
})

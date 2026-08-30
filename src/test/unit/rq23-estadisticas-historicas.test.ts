import { describe, expect, it } from 'vitest'
import { rangoFechasPeriodo, resumenMetricasProfesor } from '../helpers/metricas'

class RQ23EstadisticasHistoricas {
  C3_promedio() {
    const r = resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 5 }])
    expect(r.calificacionPromedio).toBe(4.5)
    expect(r.totalEvaluaciones).toBe(2)
  }

  C6_rangoPeriodo() {
    expect(rangoFechasPeriodo('2026-1')).toEqual({ start: '2026-01-01', end: '2026-06-30' })
  }

  FALLA_C6_rangoIncorrecto() {
    expect(rangoFechasPeriodo('2026-1')).toEqual({ start: '2026-07-01', end: '2026-12-31' })
  }
}

const pruebas = new RQ23EstadisticasHistoricas()

describe('RQ23 — Estadísticas históricas (frontend)', () => {
  it('C3: promedio del período', () => pruebas.C3_promedio())
  it('C6: rango de 2026-1', () => pruebas.C6_rangoPeriodo())
  it('FALLA C6: 2026-1 — se espera (mal) el segundo semestre', () => pruebas.FALLA_C6_rangoIncorrecto())
})

import { describe, expect, it } from 'vitest'
import { resumenMetricasProfesor } from '../helpers/metricas'

class RQ22MetricasEvaluacion {
  C1_sinEvaluaciones() {
    expect(resumenMetricasProfesor([])).toEqual({ calificacionPromedio: 0, totalEvaluaciones: 0 })
  }

  C3_ok() {
    expect(resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 5 }])).toEqual({
      calificacionPromedio: 4.5,
      totalEvaluaciones: 2,
    })
  }

  FALLA_C3_promedioIncorrecto() {
    expect(resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 5 }])).toEqual({
      calificacionPromedio: 99,
      totalEvaluaciones: 2,
    })
  }
}

const pruebas = new RQ22MetricasEvaluacion()

describe('RQ22 — Calcular métricas (frontend)', () => {
  it('C1: sin evaluaciones → 0', () => pruebas.C1_sinEvaluaciones())
  it('C3: calcula promedio', () => pruebas.C3_ok())
  it('FALLA C3: promedio 4 y 5 — se espera (mal) 99', () => pruebas.FALLA_C3_promedioIncorrecto())
})

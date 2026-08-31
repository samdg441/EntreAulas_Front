import { describe, expect, it } from 'vitest'
import { calificacionEnEscala, calcularPromedio, resumenMetricasProfesor } from '../helpers/metricas'

class RQ22MetricasEvaluacion {
  C1_sinEvaluaciones() {
    expect(resumenMetricasProfesor([])).toEqual({ calificacionPromedio: 0, totalEvaluaciones: 0 })
  }

  C3_ok() {
    expect(resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 5 }])).toEqual({
      calificacionPromedio: 4.5,
      totalEvaluaciones: 2,
    })
    expect(calcularPromedio([1, 5])).toBe(3)
  }

  C4_valoresInvalidosNoEntran() {
    expect(calificacionEnEscala(-2)).toBeNull()
    expect(calificacionEnEscala(0)).toBeNull()
    expect(calificacionEnEscala(99)).toBeNull()
    expect(resumenMetricasProfesor([{ calificacion_promedio: 99 }, { calificacion_promedio: -1 }])).toEqual({
      calificacionPromedio: 0,
      totalEvaluaciones: 0,
    })
    expect(resumenMetricasProfesor([{ calificacion_promedio: 4 }, { calificacion_promedio: 99 }])).toEqual({
      calificacionPromedio: 4,
      totalEvaluaciones: 1,
    })
  }
}

const pruebas = new RQ22MetricasEvaluacion()

describe('RQ22 — Calcular métricas (frontend)', () => {
  it('C1: sin evaluaciones → 0', () => pruebas.C1_sinEvaluaciones())
  it('C3: promedio con valores comunes 1–5', () => pruebas.C3_ok())
  it('C4: negativos, 0 y 99 no entran', () => pruebas.C4_valoresInvalidosNoEntran())
})

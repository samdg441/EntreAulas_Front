import { describe, expect, it } from 'vitest'
import {
  calcularPromedio,
  calificacionEnEscala,
  promedioVisible,
  resumenMetricasProfesor,
} from '../../../lib/calificaciones'

/**
 * RQ22 en la pantalla — el número que se pinta en la tarjeta del docente.
 * La escala es 1 a 5. Lo que queda fuera se muestra como cero, no como 99.
 */
describe('RQ22 — métricas de evaluación en pantalla', () => {
  it('el 1 y el 5 se aceptan; el 0 y el 99 no', () => {
    // Arrange
    const notas = [1, 5, 0, 99, '4']

    // Act
    const traducidas = notas.map(calificacionEnEscala)

    // Assert
    expect(traducidas).toEqual([1, 5, null, null, 4])
  })

  it('el promedio deja fuera las notas inválidas', () => {
    // Arrange
    const notas = [5, null, 3, undefined]

    // Act
    const promedio = calcularPromedio(notas)

    // Assert
    expect(promedio).toBe(4)
  })

  it('sin notas el promedio es cero', () => {
    // Arrange
    const notas: number[] = []

    // Act
    const promedio = calcularPromedio(notas)

    // Assert
    expect(promedio).toBe(0)
  })

  it('el resumen cuenta solo las evaluaciones que sí están en la escala', () => {
    // Arrange
    const evaluaciones = [
      { calificacion_promedio: 4 },
      { calificacion_promedio: 2 },
      { calificacion_promedio: 99 },
    ]

    // Act
    const resumen = resumenMetricasProfesor(evaluaciones)

    // Assert
    expect(resumen.totalEvaluaciones).toBe(2)
    expect(resumen.calificacionPromedio).toBe(3)
  })

  it('un valor que no se puede mostrar se pinta como cero', () => {
    // Arrange
    const raro = 'no-es-nota'
    const nota = 4.5

    // Act
    const oculto = promedioVisible(raro)
    const visible = promedioVisible(nota)

    // Assert
    expect(oculto).toBe(0)
    expect(visible).toBe(4.5)
  })
})

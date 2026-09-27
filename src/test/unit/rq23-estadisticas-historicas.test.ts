import { describe, expect, it } from 'vitest'
import { esPeriodoValido, rangoFechasPeriodo } from '../../lib/calificaciones'

/**
 * RQ23 en la pantalla — el filtro de periodo.
 * 2026-1 es de enero a junio. 2026-2 es de julio a diciembre.
 * Un texto que no cumple ese molde no arma fechas.
 */
describe('RQ23 — estadísticas históricas en pantalla', () => {
  it('acepta los dos semestres y rechaza un tercero', () => {
    // Arrange
    const primero = '2026-1'
    const segundo = ' 2026-2 '
    const tercero = '2026-3'

    // Act
    const ok1 = esPeriodoValido(primero)
    const ok2 = esPeriodoValido(segundo)
    const ok3 = esPeriodoValido(tercero)

    // Assert
    expect(ok1).toBe(true)
    expect(ok2).toBe(true)
    expect(ok3).toBe(false)
  })

  it('un texto vacío o con letras no es un periodo', () => {
    // Arrange
    const vacio = ''
    const letras = 'todo'

    // Act
    const noVacio = esPeriodoValido(vacio)
    const noLetras = esPeriodoValido(letras)

    // Assert
    expect(noVacio).toBe(false)
    expect(noLetras).toBe(false)
  })

  it('el primer semestre va del 1 de enero al 30 de junio', () => {
    // Arrange
    const period = '2026-1'

    // Act
    const rango = rangoFechasPeriodo(period)

    // Assert
    expect(rango).toEqual({ start: '2026-01-01', end: '2026-06-30' })
  })

  it('el segundo semestre va del 1 de julio al 31 de diciembre', () => {
    // Arrange
    const period = '2026-2'

    // Act
    const rango = rangoFechasPeriodo(period)

    // Assert
    expect(rango).toEqual({ start: '2026-07-01', end: '2026-12-31' })
  })

  it('un periodo mal escrito no inventa fechas', () => {
    // Arrange
    const period = '2026-9'

    // Act
    const rango = rangoFechasPeriodo(period)

    // Assert
    expect(rango).toBeNull()
  })
})

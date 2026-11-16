import { describe, expect, it } from 'vitest'
import { codigoPeriodoActual } from '../../../lib/periodo-academico'

describe('periodo académico según la fecha', () => {
  it('noviembre de 2026 es el segundo semestre', () => {
    // Arrange
    const hoy = new Date(2026, 10, 11)

    // Act
    const codigo = codigoPeriodoActual(hoy)

    // Assert
    expect(codigo).toBe('2026-2')
  })

  it('de enero a junio usa el primer semestre del mismo año', () => {
    // Arrange
    const enero = new Date(2026, 0, 1)
    const junio = new Date(2026, 5, 30)

    // Act
    const inicio = codigoPeriodoActual(enero)
    const cierre = codigoPeriodoActual(junio)

    // Assert
    expect(inicio).toBe('2026-1')
    expect(cierre).toBe('2026-1')
  })

  it('julio abre el segundo semestre', () => {
    // Arrange
    const julio = new Date(2026, 6, 1)

    // Act
    const codigo = codigoPeriodoActual(julio)

    // Assert
    expect(codigo).toBe('2026-2')
  })
})

import { describe, expect, it } from 'vitest'
import { filtrarDocentes, statsVaciasCoordinador } from '../../../features/dashboard-coordinator/docentes'

/**
 * RQ24 en la pantalla — el coordinador escribe un nombre y la lista se reduce.
 * Los números grandes (promedio, riesgo) los calcula el servidor.
 * Aquí se prueba lo que hace la pantalla con la lista que ya recibió.
 */
describe('RQ24 — resumen del coordinador en pantalla', () => {
  const docentes = [
    { nombre: 'Ana Pérez', email: 'ana@t.com', promedio: 4.5 },
    { nombre: 'Luis Gómez', email: 'luis@t.com', promedio: 3 },
  ]

  it('una búsqueda vacía deja la lista completa', () => {
    // Arrange
    const texto = '   '

    // Act
    const visibles = filtrarDocentes(docentes, texto)

    // Assert
    expect(visibles).toHaveLength(2)
    expect(visibles).toEqual(docentes)
  })

  it('busca por nombre sin importar mayúsculas', () => {
    // Arrange
    const texto = 'ANA'

    // Act
    const visibles = filtrarDocentes(docentes, texto)

    // Assert
    expect(visibles).toHaveLength(1)
    expect(visibles[0].nombre).toBe('Ana Pérez')
  })

  it('también busca por el correo', () => {
    // Arrange
    const texto = 'luis@'

    // Act
    const visibles = filtrarDocentes(docentes, texto)

    // Assert
    expect(visibles[0].email).toBe('luis@t.com')
    expect(visibles[0].promedio).toBe(3)
  })

  it('un texto que no coincide deja la lista vacía', () => {
    // Arrange
    const texto = 'zzz'

    // Act
    const visibles = filtrarDocentes(docentes, texto)

    // Assert
    expect(visibles).toEqual([])
  })

  it('mientras cargan los datos, las tarjetas empiezan en cero', () => {
    // Arrange
    const esperado = {
      totalProfesores: 0,
      totalCursos: 0,
      promedioEvaluaciones: 0,
      profesoresEnRiesgo: 0,
      totalEvaluaciones: 0,
    }

    // Act
    const stats = statsVaciasCoordinador()

    // Assert
    expect(stats).toEqual(esperado)
  })
})

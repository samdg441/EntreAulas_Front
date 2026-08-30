import { describe, expect, it } from 'vitest'
import { filtrarDocentes, statsVaciasCoordinador } from '../helpers/metricas'

class RQ24ResumenCoordinador {
  C1_errorApi() {
    expect(statsVaciasCoordinador().totalProfesores).toBe(0)
  }

  C2_okStats() {
    const docentes = [
      { nombre: 'Ana Pérez', email: 'ana@test.com', promedio: 4.2 },
      { nombre: 'Luis Gómez', email: 'luis@test.com', promedio: 3.1 },
    ]
    expect(filtrarDocentes(docentes, 'ana').map((d) => d.nombre)).toEqual(['Ana Pérez'])
    expect(filtrarDocentes(docentes, '').length).toBe(2)
  }

  FALLA_C2_searchNoFiltra() {
    const docentes = [
      { nombre: 'Ana Pérez', email: 'ana@test.com', promedio: 4.2 },
      { nombre: 'Luis Gómez', email: 'luis@test.com', promedio: 3.1 },
    ]
    expect(filtrarDocentes(docentes, 'ana')).toHaveLength(2)
  }
}

const pruebas = new RQ24ResumenCoordinador()

describe('RQ24 — Resumen coordinador (frontend)', () => {
  it('C1: error → stats en cero', () => pruebas.C1_errorApi())
  it('C2: lista y filtro de docentes', () => pruebas.C2_okStats())
  it('FALLA C2: search ana — se espera (mal) 2 docentes', () => pruebas.FALLA_C2_searchNoFiltra())
})

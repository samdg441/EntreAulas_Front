import { describe, expect, it } from 'vitest'
import { calificacionEnEscala } from '../../lib/calificaciones'
import { filtrarDocentes, statsVaciasCoordinador } from '../../features/dashboard-coordinator/docentes'
import { DOCENTES_EJEMPLO, NOTAS_INVALIDAS, SEARCH } from '../fixtures/casos-datos'

class RQ24ResumenCoordinador {
  C1_errorApi() {
    expect(statsVaciasCoordinador().totalProfesores).toBe(0)
    expect(statsVaciasCoordinador().promedioEvaluaciones).toBe(0)
  }

  C2_okStats() {
    expect(filtrarDocentes(DOCENTES_EJEMPLO, SEARCH.coincidencia).map((d) => d.nombre)).toEqual(['Ana Pérez'])
    expect(filtrarDocentes(DOCENTES_EJEMPLO, SEARCH.vacio).length).toBe(2)
  }

  C3_searchSinCoincidencias() {
    expect(filtrarDocentes(DOCENTES_EJEMPLO, SEARCH.sinCoincidencia)).toEqual([])
  }

  C4_promediosInvalidos() {
    for (const nota of NOTAS_INVALIDAS) {
      expect(calificacionEnEscala(nota)).toBeNull()
    }
    expect(calificacionEnEscala(4.2)).toBe(4.2)
  }
}

const pruebas = new RQ24ResumenCoordinador()

describe('RQ24 — Resumen coordinador (frontend)', () => {
  it('C1: error → stats en cero', () => pruebas.C1_errorApi())
  it('C2: lista y filtro de docentes', () => pruebas.C2_okStats())
  it('C3: search sin coincidencias → lista vacía', () => pruebas.C3_searchSinCoincidencias())
  it('C4: 0, negativos y 99 no son nota válida', () => pruebas.C4_promediosInvalidos())
})

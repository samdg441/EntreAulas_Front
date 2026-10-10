import { afterAll, describe, expect, it, vi } from 'vitest'
import { calcularPromedio, rangoFechasPeriodo } from '../../lib/calificaciones'
import { filtrarDocentes } from '../../features/dashboard-coordinator/docentes'
import { armarModeloExcelCoordinador, exportCoordinatorReportExcel } from '../../utils/reporte-exportacion'
import { guardarReporte, medir, type Medicion } from '../helpers/medicion'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))

/**
 * Presupuestos de tiempo en el navegador para los volúmenes reales del coordinador.
 * Son amplios a propósito: detectan un cambio de complejidad (p. ej. O(n) → O(n²)),
 * no diferencias de milisegundos entre equipos. RQ18 y RQ19 no se miden aquí:
 * validan un solo formulario o una ruta y no dependen del volumen de datos.
 */
const mediciones: Medicion[] = []

function docentesFalsos(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    nombre: `Docente ${i} ${i % 7 === 0 ? 'Ana' : 'Luis'}`,
    email: `docente${i}@udemedellin.edu.co`,
    promedio: 1 + (i % 5),
  }))
}

function filasReporte(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    DOCENTE: `Docente ${i % 400}`,
    ASIGNATURA: `Asignatura ${i % 120}`,
    GRUPO: `G${i % 9}`,
    ESTUDIANTES: 30,
    ESTUDIANTES_EVALUADORES: 25,
    SABER_ESPECIFICO: 4.1,
    METODOLOGIA: 3.9,
    EVALUACION: 4.2,
    RELACION_CON_LOS_ESTUDIANTES: 4.6,
    PROMEDIO: 4.2,
  }))
}

describe('RQ22–RQ25 — Rendimiento en el front', () => {
  afterAll(() => {
    guardarReporte('front-rq22-rq25', mediciones)
  })

  it('RQ22: promediar 100.000 calificaciones tarda menos de 30 ms', () => {
    const notas = Array.from({ length: 100_000 }, (_, i) => (i % 6) + (i % 11 === 0 ? 99 : 0))
    const m = medir({ escenario: 'calcularPromedio 100k', requisito: 'RQ22', presupuestoMs: 30 }, () => calcularPromedio(notas))
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ23: resolver 10.000 periodos tarda menos de 20 ms', () => {
    const periodos = Array.from({ length: 10_000 }, (_, i) => `${2000 + (i % 30)}-${(i % 3) + 1}`)
    const m = medir({ escenario: 'rangoFechasPeriodo 10k', requisito: 'RQ23', presupuestoMs: 20 }, () =>
      periodos.map(rangoFechasPeriodo)
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ24: buscar entre 10.000 docentes tarda menos de 15 ms', () => {
    const docentes = docentesFalsos(10_000)
    const m = medir({ escenario: 'filtrarDocentes 10k', requisito: 'RQ24', presupuestoMs: 15 }, () =>
      filtrarDocentes(docentes, 'ana')
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ24: la búsqueda escala lineal (10x docentes ≈ 10x tiempo, nunca 100x)', () => {
    const pocos = docentesFalsos(1_000)
    const muchos = docentesFalsos(10_000)
    const chico = medir({ escenario: 'filtrarDocentes 1k', requisito: 'RQ24', presupuestoMs: 5, repeticiones: 50 }, () =>
      filtrarDocentes(pocos, 'ana')
    )
    const grande = medir({ escenario: 'filtrarDocentes 10k (escala)', requisito: 'RQ24', presupuestoMs: 15, repeticiones: 50 }, () =>
      filtrarDocentes(muchos, 'ana')
    )
    mediciones.push(chico, grande)
    expect(grande.medianaMs / Math.max(chico.medianaMs, 0.01)).toBeLessThan(30)
  })

  it('RQ25: armar el modelo de 5.000 filas tarda menos de 150 ms', () => {
    const filas = filasReporte(5_000)
    const m = medir({ escenario: 'armarModeloExcelCoordinador 5k', requisito: 'RQ25', presupuestoMs: 150, repeticiones: 15 }, () =>
      armarModeloExcelCoordinador(filas)
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
    expect(armarModeloExcelCoordinador(filas).dataRows).toHaveLength(5_000)
  })

  it('RQ25: generar el .xlsx completo (3 hojas) de 5.000 filas tarda menos de 2,5 s', () => {
    const filas = filasReporte(5_000)
    const m = medir(
      { escenario: 'exportCoordinatorReportExcel 5k', requisito: 'RQ25', presupuestoMs: 2_500, repeticiones: 5, calentamiento: 1 },
      () => exportCoordinatorReportExcel(filas, 'r.xlsx')
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })
})

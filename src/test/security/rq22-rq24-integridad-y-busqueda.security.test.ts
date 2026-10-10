import { afterEach, describe, expect, it } from 'vitest'
import { calcularPromedio, esPeriodoValido, promedioVisible, rangoFechasPeriodo } from '../../lib/calificaciones'
import { filtrarDocentes } from '../../features/dashboard-coordinator/docentes'
import { fetchCoordinatorDashboardSummary } from '../../api/coordinador.api'
import { montarApiFalsa } from '../helpers/api-falsa'

describe('RQ22 — Seguridad: integridad de las calificaciones', () => {
  it('valores manipulados no inflan ni hunden el promedio', () => {
    const manipuladas = [5, 4, 1000, -5, Number.POSITIVE_INFINITY, Number.NaN, '5abc' as unknown as number]
    expect(calcularPromedio(manipuladas)).toBe(4.5)
  })

  it.each([[99], [-1], ['<img src=x onerror=alert(1)>'], [null], [{}]])('en pantalla %s se ve como 0', (valor) => {
    expect(promedioVisible(valor)).toBe(0)
  })
})

describe('RQ23 — Seguridad: el periodo solo admite AAAA-1 o AAAA-2', () => {
  it.each(["2026-1' OR '1'='1", '2026-1;DROP TABLE', '../2026-1', '2026-3', '26-1', ''])('rechaza %j', (periodo) => {
    expect(esPeriodoValido(periodo)).toBe(false)
    expect(rangoFechasPeriodo(periodo)).toBeNull()
  })
})

describe('RQ24 — Seguridad: búsqueda de docentes', () => {
  const docentes = [
    { nombre: 'Ana Pérez', email: 'ana@t.com', promedio: 4.5 },
    { nombre: 'Luis (Lucho) Gómez', email: 'luis@t.com', promedio: 3 },
  ]
  let api: ReturnType<typeof montarApiFalsa>
  afterEach(() => api?.restaurar())

  it.each(['.*', '[', '\\', '^$', 'a+'])('el texto %j se busca literal, sin romper ni comodines', (q) => {
    expect(() => filtrarDocentes(docentes, q)).not.toThrow()
    expect(filtrarDocentes(docentes, q)).toEqual([])
  })

  it('un paréntesis real sí encuentra al docente que lo tiene', () => {
    expect(filtrarDocentes(docentes, '(lucho)')).toHaveLength(1)
  })

  it('un payload XSS no coincide con nadie ni altera la lista', () => {
    expect(filtrarDocentes(docentes, '<script>alert(1)</script>')).toEqual([])
    expect(docentes).toHaveLength(2)
  })

  it('una búsqueda no puede inyectar parámetros extra en la URL', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { teachers: [] } }))

    await fetchCoordinatorDashboardSummary({ search: 'ana&pageSize=100000&role=admin' })

    expect(api.peticiones[0].query).toEqual({ search: 'ana&pageSize=100000&role=admin' })
  })
})

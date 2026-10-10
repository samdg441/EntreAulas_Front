import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCoordinatorDashboardSummary,
  fetchCoordinatorProfessorStats,
  fetchCoordinatorReportsOverview,
} from '../../api/coordinador.api'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * RQ22 métricas, RQ23 histórico por periodo, RQ24 resumen del coordinador y
 * RQ25 datos del reporte: contrato de los endpoints /api/coordinador/*.
 */
describe('RQ22–RQ25 — API del coordinador', () => {
  let api: ReturnType<typeof montarApiFalsa>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => api?.restaurar())

  describe('RQ24 — dashboard-summary', () => {
    it('manda página, tamaño y búsqueda recortada', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { teachers: [{ nombre: 'Ana Pérez' }], total: 1 } }))

      const data = await fetchCoordinatorDashboardSummary({ page: 2, pageSize: 8, search: '  ana  ' })

      expect(api.peticiones[0]).toMatchObject({
        metodo: 'GET',
        url: '/api/coordinador/dashboard-summary',
        query: { page: '2', pageSize: '8', search: 'ana' },
      })
      expect(data.teachers).toHaveLength(1)
    })

    it('Regresión RQ24: una búsqueda en blanco no viaja como filtro', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { teachers: [], total: 0 } }))

      await fetchCoordinatorDashboardSummary({ search: '   ' })

      expect(api.peticiones[0].query).toEqual({})
    })

    it('un 500 se traduce a un mensaje entendible', async () => {
      api = montarApiFalsa(() => ({ status: 500, data: { error: 'relation "x" does not exist' } }))

      await expect(fetchCoordinatorDashboardSummary()).rejects.toThrow('Error al cargar el resumen del coordinador')
    })
  })

  describe('RQ23/RQ25 — reports-overview', () => {
    it('envía el periodo y omite los filtros "all"', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { summary: {} } }))

      await fetchCoordinatorReportsOverview('2026-1', 'all', 'all')

      expect(api.peticiones[0]).toMatchObject({ url: '/api/coordinador/reports-overview', query: { period: '2026-1' } })
    })

    it('con curso y grupo concretos los manda tal cual', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: {} }))

      await fetchCoordinatorReportsOverview('2026-2', '12', '63')

      expect(api.peticiones[0].query).toEqual({ period: '2026-2', courseId: '12', grupoId: '63' })
    })

    it('Regresión RQ23: un timeout no deja la pantalla con datos de otro periodo', async () => {
      api = montarApiFalsa(() => ({ error: 'timeout' }))

      await expect(fetchCoordinatorReportsOverview('2026-1')).rejects.toThrow('Error al cargar los reportes del coordinador')
    })
  })

  describe('RQ22 — profesor-stats', () => {
    it('pide las métricas del docente en el periodo', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { calificacionPromedio: 4.5 } }))

      const data = await fetchCoordinatorProfessorStats(13, '2026-1')

      expect(api.peticiones[0]).toMatchObject({ url: '/api/coordinador/profesor-stats/13', query: { period: '2026-1' } })
      expect(data.calificacionPromedio).toBe(4.5)
    })

    it('un 403 de otra carrera se reporta como error, no como 0', async () => {
      api = montarApiFalsa(() => ({ status: 403, data: { error: 'Docente de otra carrera' } }))

      await expect(fetchCoordinatorProfessorStats(99, '2026-1')).rejects.toThrow('Error al cargar estadísticas del docente')
    })
  })
})

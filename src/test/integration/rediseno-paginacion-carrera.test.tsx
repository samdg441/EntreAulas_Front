/**
 * DEF-REDI-05 — Cambiar de página justo después de cargar no debe volver a la página 1.
 * El debounce de la búsqueda ejecutaba setPage(1) incluso sin haber escrito nada.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

const fetchResumen = vi.fn()
const fetchAuditoria = vi.fn()
vi.mock('../../api/coordinador.api', () => ({ fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchResumen(...a) }))
vi.mock('../../api/periodos.api', () => ({ getVentanasEvaluacion: async () => [] }))
vi.mock('../../api/auditoria.api', async () => {
  const real = await vi.importActual<typeof import('../../api/auditoria.api')>('../../api/auditoria.api')
  return { ...real, fetchAuditoria: (...a: unknown[]) => fetchAuditoria(...a) }
})

import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'
import AuditoriaPage from '../../features/dashboard-coordinator/AuditoriaPage'

const usuario = { id: 'u', name: 'David C', type: 'coordinator', email: 'd@udemedellin.edu.co' } as never
const docente = (id: number) => ({ profesorId: id, nombre: `Docente ${id}`, email: `d${id}@x.co`, totalEvaluaciones: 3, promedio: 4.2 })
const evento = (id: number) => ({ id, actorId: 'u', actorNombre: 'David', actorRol: 'coordinador', accion: 'generar_qr', entidad: 'qr', entidadId: null, detalle: `Evento ${id}`, creadoEn: '2026-10-01T10:00:00.000Z' })

describe('Paginación: cambiar de página antes de 350 ms no se deshace', () => {
  beforeEach(() => {
    simularMatchMedia(false)
    window.localStorage.clear()
    fetchResumen.mockImplementation(async ({ page }: { page: number }) => ({
      stats: { totalProfesores: 16, totalCursos: 1, promedioEvaluaciones: 4.2, profesoresEnRiesgo: 0, totalEvaluaciones: 9 },
      teachers: [docente(page)],
      pagination: { page, pageSize: 8, total: 16, totalPages: 2 },
    }))
    fetchAuditoria.mockImplementation(async ({ page }: { page: number }) => ({
      disponible: true,
      eventos: [evento(page)],
      resumen: { total: 20, porAccion: {}, ultimoEvento: null },
      pagination: { page, pageSize: 10, total: 20, totalPages: 2 },
    }))
  })

  it('dashboard: tras pulsar "Siguiente" enseguida, la tabla se queda en la página 2', async () => {
    const usuarioUi = userEvent.setup()
    renderConPreferencias(<DashboardCoordinador user={usuario} />)
    await usuarioUi.click(await screen.findByRole('button', { name: /Siguiente/ }))

    await new Promise((r) => setTimeout(r, 600)) // más que el debounce de 350 ms

    await waitFor(() => expect(fetchResumen).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
  })

  it('auditoría: tras pulsar "Siguiente" enseguida, la tabla se queda en la página 2', async () => {
    const usuarioUi = userEvent.setup()
    renderConPreferencias(<AuditoriaPage />)
    await usuarioUi.click(await screen.findByRole('button', { name: /Siguiente/ }))

    await new Promise((r) => setTimeout(r, 600))

    await waitFor(() => expect(fetchAuditoria).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
  })

  it('escribir una búsqueda sí vuelve a la página 1 (el comportamiento correcto se conserva)', async () => {
    const usuarioUi = userEvent.setup()
    renderConPreferencias(<AuditoriaPage />)
    await usuarioUi.click(await screen.findByRole('button', { name: /Siguiente/ }))
    await screen.findByText('Página 2 de 2')

    await usuarioUi.type(screen.getByRole('searchbox'), 'qr')

    await waitFor(() => expect(fetchAuditoria).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'qr' })))
  })
})

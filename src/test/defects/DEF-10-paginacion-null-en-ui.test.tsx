/**
 * DEF-10 — La paginación nula del backend se muestra vacía en pantalla (RQ24, integración)
 *
 * Severidad: Media | Estado: ABIERTO
 * Relacionado con DEF-03 del backend: `?pageSize=abc` devuelve NaN → null.
 *
 * El front no valida la paginación que recibe, así que el pie de la tabla
 * renderiza literalmente "Página  de ", sin números.
 *
 * Verificado y descartado: los botones Anterior/Siguiente SÍ quedan
 * deshabilitados, porque `null >= null` se evalúa como `0 >= 0`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'
import type { User } from '../../types'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/Calendar', () => ({ default: () => null }))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const fetchCoordinatorDashboardSummary = vi.fn()
vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchCoordinatorDashboardSummary(...a),
}))

const coordinador: User = {
  id: 'c1',
  name: 'David',
  type: 'coordinator',
  email: 'd@t.com',
  roles: ['coordinador'],
}

describe('DEF-10 — La paginación debe mostrarse siempre con números', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('con paginación nula del backend debe mostrarse un número de página', async () => {
    fetchCoordinatorDashboardSummary.mockResolvedValue({
      stats: {
        totalProfesores: 1,
        totalCursos: 1,
        promedioEvaluaciones: 4,
        profesoresEnRiesgo: 0,
        totalEvaluaciones: 1,
      },
      teachers: [
        { profesorId: 1, nombre: 'Ana', email: 'a@t.com', totalEvaluaciones: 2, promedio: 4 },
      ],
      pagination: { page: null, pageSize: null, total: 1, totalPages: null },
    })

    render(
      <MemoryRouter>
        <DashboardCoordinador user={coordinador} />
      </MemoryRouter>
    )
    await waitFor(() => expect(fetchCoordinatorDashboardSummary).toHaveBeenCalled())

    // Hoy se renderiza "Página  de " (sin números).
    expect(document.body.textContent).toMatch(/Página\s*\d+\s*de\s*\d+/)
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/Calendar', () => ({ default: () => null }))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const fetchCoordinatorDashboardSummary = vi.fn()

vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchCoordinatorDashboardSummary(...a),
}))

/** Smoke: grafo C1–C2 en unit. */
describe('RQ24 integration — smoke resumen OK', () => {
  beforeEach(() => {
    fetchCoordinatorDashboardSummary.mockResolvedValue({
      stats: {
        totalProfesores: 2,
        totalCursos: 5,
        promedioEvaluaciones: 4,
        profesoresEnRiesgo: 0,
        totalEvaluaciones: 10,
      },
      teachers: [
        {
          profesorId: 1,
          nombre: 'Marta López',
          email: 'marta@test.com',
          totalEvaluaciones: 3,
          promedio: 4,
        },
      ],
      pagination: { page: 1, pageSize: 8, total: 1, totalPages: 1 },
    })
  })

  it('muestra docente y Total Profesores', async () => {
    render(
      <MemoryRouter>
        <DashboardCoordinador
          user={{
            id: 'c1',
            name: 'Coord',
            type: 'coordinator',
            email: 'c@t.com',
            roles: ['coordinador'],
          }}
        />
      </MemoryRouter>
    )
    expect(await screen.findByText('Marta López')).toBeInTheDocument()
    const title = screen.getByText('Total Profesores')
    const card = title.closest('.bg-white') as HTMLElement
    expect(within(card).getByText('2')).toBeInTheDocument()
  })
})

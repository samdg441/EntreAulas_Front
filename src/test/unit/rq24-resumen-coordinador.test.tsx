import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

function renderDash() {
  return render(
    <MemoryRouter>
      <DashboardCoordinador user={coordinador} />
    </MemoryRouter>
  )
}

function cardByTitle(title: string) {
  const titleEl = screen.getByText(title)
  return titleEl.closest('.bg-white') as HTMLElement
}

/** RQ24 Front — C1 error API | C2 OK stats+docentes */
describe('RQ24 unit — Resumen coordinador (frontend)', () => {
  beforeEach(() => {
    fetchCoordinatorDashboardSummary.mockReset()
  })

  it('C1: error API → Total Profesores en 0 y sin docentes', async () => {
    fetchCoordinatorDashboardSummary.mockRejectedValue(new Error('fail'))
    renderDash()
    await waitFor(() => expect(fetchCoordinatorDashboardSummary).toHaveBeenCalled())
    const card = cardByTitle('Total Profesores')
    expect(within(card).getByText('0')).toBeInTheDocument()
    // Lista de docentes vacía (no filas de tabla con email de docente)
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
  })

  it('C2: OK → stats y docente listado', async () => {
    fetchCoordinatorDashboardSummary.mockResolvedValue({
      stats: {
        totalProfesores: 4,
        totalCursos: 9,
        promedioEvaluaciones: 4.1,
        profesoresEnRiesgo: 1,
        totalEvaluaciones: 20,
      },
      teachers: [
        {
          profesorId: 1,
          nombre: 'Ana Pérez',
          email: 'ana@test.com',
          totalEvaluaciones: 5,
          promedio: 4.1,
        },
      ],
      pagination: { page: 1, pageSize: 8, total: 1, totalPages: 1 },
    })
    renderDash()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(within(cardByTitle('Total Profesores')).getByText('4')).toBeInTheDocument()
    expect(within(cardByTitle('Cursos Activos')).getByText('9')).toBeInTheDocument()
  })
})

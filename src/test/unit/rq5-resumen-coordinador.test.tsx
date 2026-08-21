import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'
import type { User } from '../../types'

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('../../components/Calendar', () => ({
  default: () => <div data-testid="calendar" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const fetchCoordinatorDashboardSummary = vi.fn()

vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...args: unknown[]) => fetchCoordinatorDashboardSummary(...args),
}))

function renderDashboard(user: User) {
  return render(
    <MemoryRouter>
      <DashboardCoordinador user={user} />
    </MemoryRouter>
  )
}

const coordinador: User = {
  id: 'c1',
  name: 'David Coord',
  type: 'coordinator',
  email: 'david@test.com',
  roles: ['coordinador'],
}

describe('RQ5 unitarias — Ver resumen del coordinador (frontend)', () => {
  beforeEach(() => {
    fetchCoordinatorDashboardSummary.mockReset()
    localStorage.clear()
  })

  it('Camino 1 (1-2-3-4-6-7-8-9): error de API → lista vacía / sin stats nuevas', async () => {
    fetchCoordinatorDashboardSummary.mockRejectedValue(new Error('Error al cargar el resumen del coordinador'))

    renderDashboard(coordinador)

    await waitFor(() => {
      expect(fetchCoordinatorDashboardSummary).toHaveBeenCalled()
    })
    expect(screen.getByText('Total Profesores')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('Camino 2 (1-2-3-4-5-7-8-9): resumen OK → cards + docentes paginados', async () => {
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

    renderDashboard(coordinador)

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })
})

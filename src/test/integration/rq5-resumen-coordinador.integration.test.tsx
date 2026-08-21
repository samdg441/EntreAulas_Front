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

const apiGet = vi.fn()

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
  default: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
}))

const coordinador: User = {
  id: 'c1',
  name: 'David Coord',
  type: 'coordinator',
  email: 'david@test.com',
  roles: ['coordinador'],
}

describe('RQ5 integración — Ver resumen del coordinador', () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it('Camino 1: no coordinador → 403, lista vacía', async () => {
    apiGet.mockRejectedValue({
      response: { status: 403, data: { error: 'Solo coordinadores pueden acceder a esta información.' } },
    })

    render(
      <MemoryRouter>
        <DashboardCoordinador user={coordinador} />
      </MemoryRouter>
    )

    await waitFor(() => expect(apiGet).toHaveBeenCalled())
    expect(screen.getByText('Total Profesores')).toBeInTheDocument()
  })

  it('Camino 2: sin carrera → 400', async () => {
    apiGet.mockRejectedValue({
      response: { status: 400, data: { error: 'No se encontró carrera asociada al coordinador' } },
    })

    render(
      <MemoryRouter>
        <DashboardCoordinador user={coordinador} />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('/api/coordinador/dashboard-summary'))
    })
  })

  it('Camino 3: resumen válido → front muestra stats y docentes', async () => {
    apiGet.mockResolvedValue({
      data: {
        stats: {
          totalProfesores: 2,
          totalCursos: 5,
          promedioEvaluaciones: 4.3,
          profesoresEnRiesgo: 0,
          totalEvaluaciones: 11,
        },
        teachers: [
          {
            profesorId: 9,
            nombre: 'Marta Ruiz',
            email: 'marta@test.com',
            totalEvaluaciones: 11,
            promedio: 4.3,
          },
        ],
        pagination: { page: 1, pageSize: 8, total: 1, totalPages: 1 },
      },
    })

    render(
      <MemoryRouter>
        <DashboardCoordinador user={coordinador} />
      </MemoryRouter>
    )

    expect(await screen.findByText('Marta Ruiz')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

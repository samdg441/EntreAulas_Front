import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../../features/dashboard-student/Dashboard'
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

const studentUser: User = {
  id: 'u-est',
  name: 'Ana Pérez',
  type: 'student',
  email: 'ana@test.com',
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard user={studentUser} />
    </MemoryRouter>
  )
}

describe('RQ11 integración — Evaluaciones del estudiante', () => {
  beforeEach(() => {
    apiGet.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('Camino 3: API student-stats falla → tarjetas visibles en 0', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('student-stats')) {
        throw { response: { status: 500, data: { error: 'Error interno del servidor' } } }
      }
      if (url.includes('student-enrolled-subjects')) {
        return { data: { materiasMatriculadas: [] } }
      }
      return { data: {} }
    })

    renderDashboard()

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled()
    })
    expect(await screen.findByText('Evaluaciones Pendientes')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
  })

  it('Camino 4: flujo feliz — back calcula y front pinta pendientes/completadas', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('student-stats')) {
        return {
          data: {
            evaluacionesCompletadas: 4,
            evaluacionesPendientes: 7,
            materiasMatriculadas: 11,
            promedioGeneral: 4.2,
            progresoGeneral: 36,
          },
        }
      }
      if (url.includes('student-enrolled-subjects')) {
        return { data: { materiasMatriculadas: [] } }
      }
      return { data: {} }
    })

    renderDashboard()

    expect(await screen.findByText('7')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/api/teachers/student-stats')
    })
  })
})

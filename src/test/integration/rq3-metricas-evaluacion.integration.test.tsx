import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardProfesor from '../../features/dashboard-teacher/DashboardProfesor'
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

const teacherUser: User = {
  id: 'u-prof',
  name: 'Ana Pérez',
  type: 'teacher',
  email: 'ana@test.com',
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardProfesor user={teacherUser} />
    </MemoryRouter>
  )
}

describe('RQ3 integración — Calcular métricas de evaluación', () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it('Camino 1: no autorizado (403) → sin métricas', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('teacher-id')) return { data: { teacherId: '7' } }
      const error = { response: { status: 403, data: { error: 'Solo los profesores...' } } }
      throw error
    })

    renderDashboard()

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled()
    })
    expect(await screen.findByText('0.0/5.0')).toBeInTheDocument()
  })

  it('Camino 2: falla lectura BD (404/500) → sin métricas', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('teacher-id')) return { data: { teacherId: '7' } }
      throw { response: { status: 500, data: { error: 'Error obteniendo evaluaciones completadas' } } }
    })

    renderDashboard()

    expect(await screen.findByText('0.0/5.0')).toBeInTheDocument()
  })

  it('Camino 3: flujo feliz — back calcula y front muestra promedio/totales', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('teacher-id')) return { data: { teacherId: '7' } }
      if (url.includes('teacher-stats')) {
        return {
          data: {
            calificacionPromedio: 4.8,
            totalEvaluaciones: 6,
            cursosImpartidos: 2,
            totalGruposImpartidos: 2,
            evaluacionesPorCurso: [],
          },
        }
      }
      if (url.includes('teacher-courses')) return { data: [] }
      return { data: {} }
    })

    renderDashboard()

    expect(await screen.findByText('4.8/5.0')).toBeInTheDocument()
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/api/teachers/teacher-stats/7')
    })
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportsPage from '../../features/evaluations/ReportsPage'
import type { User } from '../../types'

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('../../components/AISummaryCard', () => ({
  default: () => null,
}))

vi.mock('../../utils/export', () => ({
  exportElementToPDF: vi.fn(),
  exportElementToPNG: vi.fn(),
  exportObjectsToExcel: vi.fn(),
  exportCoordinatorReportExcel: vi.fn(),
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  RadarChart: () => <div />,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  PieChart: () => <div />,
  Pie: () => null,
  Cell: () => null,
}))

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

const teacher: User = { id: 'u1', name: 'Ana', type: 'teacher', email: 'ana@test.com' }

describe('RQ4 integración — Consultar estadísticas históricas', () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it('Camino 1: profesor no encontrado → mock / UI sin datos reales', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('teacher-id')) return { data: { teacherId: '0' } }
      if (url.includes('historical')) {
        return {
          data: {
            isMockData: true,
            totalEvaluaciones: 0,
            calificacionPromedio: 0,
          },
        }
      }
      if (url.includes('period-stats')) {
        return { data: { totalEvaluaciones: 0, calificacionPromedio: 0 } }
      }
      if (url.includes('period-category-stats')) return { data: [] }
      return { data: {} }
    })

    render(
      <MemoryRouter>
        <ReportsPage user={teacher} />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(apiGet.mock.calls.some((call) => String(call[0]).includes('stats/historical'))).toBe(true)
    })
    expect(screen.getByText('Mis Evaluaciones')).toBeInTheDocument()
  })

  it('Camino 2: histórico válido del período → front muestra tendencia/stats', async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('teacher-id')) return { data: { teacherId: '7' } }
      if (url.includes('historical')) {
        return {
          data: {
            period: '2026-1',
            totalEvaluaciones: 10,
            calificacionPromedio: 4.4,
          },
        }
      }
      if (url.includes('period-stats')) {
        return { data: { totalEvaluaciones: 10, calificacionPromedio: 4.4 } }
      }
      if (url.includes('period-category-stats')) return { data: [] }
      return { data: {} }
    })

    render(
      <MemoryRouter>
        <ReportsPage user={teacher} />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(apiGet.mock.calls.some((call) => String(call[0]).includes('/api/teachers/7/stats/historical'))).toBe(
        true
      )
    })
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})

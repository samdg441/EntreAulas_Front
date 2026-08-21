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

const fetchTeacherHistoricalStats = vi.fn()
const fetchTeacherId = vi.fn()
const fetchTeacherPeriodStats = vi.fn()
const fetchTeacherPeriodCategoryStats = vi.fn()
const fetchCoordinatorReportsOverview = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchTeacherHistoricalStats: (...args: unknown[]) => fetchTeacherHistoricalStats(...args),
  fetchTeacherId: (...args: unknown[]) => fetchTeacherId(...args),
  fetchTeacherPeriodStats: (...args: unknown[]) => fetchTeacherPeriodStats(...args),
  fetchTeacherPeriodCategoryStats: (...args: unknown[]) => fetchTeacherPeriodCategoryStats(...args),
}))

vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorReportsOverview: (...args: unknown[]) => fetchCoordinatorReportsOverview(...args),
}))

function renderReports(user: User) {
  return render(
    <MemoryRouter>
      <ReportsPage user={user} />
    </MemoryRouter>
  )
}

describe('RQ4 unitarias — Consultar estadísticas históricas (frontend)', () => {
  beforeEach(() => {
    fetchTeacherHistoricalStats.mockReset()
    fetchTeacherId.mockReset()
    fetchTeacherPeriodStats.mockReset()
    fetchTeacherPeriodCategoryStats.mockReset()
    fetchCoordinatorReportsOverview.mockReset()
    fetchTeacherPeriodCategoryStats.mockResolvedValue([])
    fetchTeacherPeriodStats.mockResolvedValue({ totalEvaluaciones: 0, calificacionPromedio: 0 })
  })

  it('Camino 1 (1-2-3-11): coordinador / sin id no consulta histórico de profesor', async () => {
    fetchCoordinatorReportsOverview.mockResolvedValue({
      summary: {},
      trend: [],
      categoryStats: [],
      distribution: [],
    })

    renderReports({ id: 'c1', name: 'Coord', type: 'coordinator', email: 'c@test.com' })

    await waitFor(() => {
      expect(fetchCoordinatorReportsOverview).toHaveBeenCalled()
    })
    expect(fetchTeacherHistoricalStats).not.toHaveBeenCalled()
    expect(fetchTeacherId).not.toHaveBeenCalled()
  })

  it('Camino 2 (1-2-4-5-6-8-9-10-11): período sin datos / error → serie con 0', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherHistoricalStats.mockRejectedValue(new Error('sin datos'))

    renderReports({ id: 'u1', name: 'Ana', type: 'teacher', email: 'ana@test.com' })

    await waitFor(() => {
      expect(fetchTeacherHistoricalStats).toHaveBeenCalled()
    })
    expect(screen.getByText('Mis Evaluaciones')).toBeInTheDocument()
  })

  it('Camino 3 (1-2-4-5-6-7-9-10-11): histórico OK arma tendencia con ratings', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherHistoricalStats.mockImplementation(async (_id: string, period?: string) => ({
      period,
      calificacionPromedio: period === '2026-1' ? 4.2 : 3.5,
      totalEvaluaciones: 8,
    }))
    fetchTeacherPeriodStats.mockResolvedValue({
      calificacionPromedio: 4.2,
      totalEvaluaciones: 8,
    })

    renderReports({ id: 'u1', name: 'Ana', type: 'teacher', email: 'ana@test.com' })

    await waitFor(() => {
      expect(fetchTeacherHistoricalStats).toHaveBeenCalled()
    })
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})

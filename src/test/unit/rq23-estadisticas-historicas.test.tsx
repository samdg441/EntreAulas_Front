import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportsPage from '../../features/evaluations/ReportsPage'
import type { User } from '../../types'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/AISummaryCard', () => ({ default: () => null }))
vi.mock('../../utils/export', () => ({
  exportElementToPDF: vi.fn(),
  exportElementToPNG: vi.fn(),
  exportObjectsToExcel: vi.fn(),
  exportCoordinatorReportExcel: vi.fn(),
}))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: unknown }) => <div>{children as never}</div>
  const Stub = (props: { 'data-testid'?: string; data?: unknown }) => (
    <div data-testid={props['data-testid']} data-points={JSON.stringify(props.data ?? null)} />
  )
  return {
    ResponsiveContainer: Passthrough,
    LineChart: ({ data, children }: { data?: unknown; children?: unknown }) => (
      <div data-testid="line-chart" data-ratings={JSON.stringify(
        Array.isArray(data) ? data.map((d: { rating?: number }) => d.rating ?? 0) : []
      )}>
        {children as never}
      </div>
    ),
    Line: () => null,
    BarChart: Passthrough,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    RadarChart: Passthrough,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    Radar: () => null,
    PieChart: Passthrough,
    Pie: () => null,
    Cell: () => null,
  }
})

const fetchTeacherHistoricalStats = vi.fn()
const fetchTeacherId = vi.fn()
const fetchTeacherPeriodStats = vi.fn()
const fetchTeacherPeriodCategoryStats = vi.fn()
const fetchCoordinatorReportsOverview = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchTeacherHistoricalStats: (...a: unknown[]) => fetchTeacherHistoricalStats(...a),
  fetchTeacherId: (...a: unknown[]) => fetchTeacherId(...a),
  fetchTeacherPeriodStats: (...a: unknown[]) => fetchTeacherPeriodStats(...a),
  fetchTeacherPeriodCategoryStats: (...a: unknown[]) => fetchTeacherPeriodCategoryStats(...a),
}))

vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorReportsOverview: (...a: unknown[]) => fetchCoordinatorReportsOverview(...a),
}))

function renderReports(user: User) {
  return render(
    <MemoryRouter>
      <ReportsPage user={user} />
    </MemoryRouter>
  )
}

/** RQ4 Front — C1 coord no histórico | C2 error→ceros | C3 OK ratings */
describe('RQ4 unit — Estadísticas históricas (frontend)', () => {
  beforeEach(() => {
    fetchTeacherHistoricalStats.mockReset()
    fetchTeacherId.mockReset()
    fetchTeacherPeriodStats.mockReset()
    fetchTeacherPeriodCategoryStats.mockReset()
    fetchCoordinatorReportsOverview.mockReset()
    fetchTeacherPeriodCategoryStats.mockResolvedValue([])
    fetchTeacherPeriodStats.mockResolvedValue({ totalEvaluaciones: 0, calificacionPromedio: 0 })
  })

  it('C1: coordinador no consulta histórico de profesor', async () => {
    fetchCoordinatorReportsOverview.mockResolvedValue({
      summary: {},
      trend: [],
      categoryStats: [],
      distribution: [],
    })
    renderReports({ id: 'c1', name: 'Coord', type: 'coordinator', email: 'c@t.com' })
    await waitFor(() => expect(fetchCoordinatorReportsOverview).toHaveBeenCalled())
    expect(fetchTeacherHistoricalStats).not.toHaveBeenCalled()
    expect(fetchTeacherId).not.toHaveBeenCalled()
  })

  it('C2: error por período → serie con rating 0', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherHistoricalStats.mockRejectedValue(new Error('sin datos'))
    renderReports({ id: 'u1', name: 'Ana', type: 'teacher', email: 'a@t.com' })

    // loadHistoricalData llama un GET por cada período; cada fallo → rating 0
    await waitFor(() => {
      expect(fetchTeacherHistoricalStats.mock.calls.length).toBeGreaterThan(1)
    })

    await waitFor(() => {
      const chart = screen.getByTestId('line-chart')
      const ratings = JSON.parse(chart.getAttribute('data-ratings') || '[]') as number[]
      expect(ratings.length).toBeGreaterThan(0)
      expect(ratings.every((r) => r === 0)).toBe(true)
    })
  })

  it('C3: histórico OK → ratings en tendencia', async () => {
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
    renderReports({ id: 'u1', name: 'Ana', type: 'teacher', email: 'a@t.com' })
    await waitFor(() => expect(fetchTeacherHistoricalStats).toHaveBeenCalled())
    const chart = await screen.findByTestId('line-chart')
    const ratings = JSON.parse(chart.getAttribute('data-ratings') || '[]') as number[]
    expect(ratings.some((r) => r === 4.2 || r === 3.5)).toBe(true)
  })
})

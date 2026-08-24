import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportsPage from '../../features/evaluations/ReportsPage'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/AISummaryCard', () => ({ default: () => null }))
vi.mock('../../utils/export', () => ({
  exportElementToPDF: vi.fn(),
  exportElementToPNG: vi.fn(),
  exportObjectsToExcel: vi.fn(),
  exportCoordinatorReportExcel: vi.fn(),
}))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  LineChart: ({ data }: { data?: Array<{ rating: number }> }) => (
    <div data-testid="line-chart" data-ratings={JSON.stringify((data ?? []).map((d) => d.rating))} />
  ),
  Line: () => null,
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
}))

const fetchTeacherHistoricalStats = vi.fn()
const fetchTeacherId = vi.fn()
const fetchTeacherPeriodStats = vi.fn()
const fetchTeacherPeriodCategoryStats = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchTeacherHistoricalStats: (...a: unknown[]) => fetchTeacherHistoricalStats(...a),
  fetchTeacherId: (...a: unknown[]) => fetchTeacherId(...a),
  fetchTeacherPeriodStats: (...a: unknown[]) => fetchTeacherPeriodStats(...a),
  fetchTeacherPeriodCategoryStats: (...a: unknown[]) => fetchTeacherPeriodCategoryStats(...a),
}))

vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorReportsOverview: vi.fn(),
}))

/** Smoke: grafo completo en unit. */
describe('RQ4 integration — smoke histórico', () => {
  beforeEach(() => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherPeriodCategoryStats.mockResolvedValue([])
    fetchTeacherPeriodStats.mockResolvedValue({ calificacionPromedio: 4, totalEvaluaciones: 2 })
    fetchTeacherHistoricalStats.mockResolvedValue({
      calificacionPromedio: 4,
      totalEvaluaciones: 2,
    })
  })

  it('consulta historical y pinta tendencia', async () => {
    render(
      <MemoryRouter>
        <ReportsPage user={{ id: 'u1', name: 'Ana', type: 'teacher', email: 'a@t.com' }} />
      </MemoryRouter>
    )
    await waitFor(() => expect(fetchTeacherHistoricalStats).toHaveBeenCalled())
    expect(await screen.findByTestId('line-chart')).toBeInTheDocument()
  })
})

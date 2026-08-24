import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardProfesor from '../../features/dashboard-teacher/DashboardProfesor'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/Calendar', () => ({ default: () => null }))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const fetchTeacherId = vi.fn()
const fetchTeacherStats = vi.fn()
const fetchTeacherCourses = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchTeacherId: (...a: unknown[]) => fetchTeacherId(...a),
  fetchTeacherStats: (...a: unknown[]) => fetchTeacherStats(...a),
  fetchTeacherCourses: (...a: unknown[]) => fetchTeacherCourses(...a),
}))

/** Smoke: grafo completo en unit. */
describe('RQ3 integration — smoke métricas OK', () => {
  beforeEach(() => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherCourses.mockResolvedValue([])
    fetchTeacherStats.mockResolvedValue({
      calificacionPromedio: 4.8,
      totalEvaluaciones: 5,
      cursosImpartidos: 1,
      totalGruposImpartidos: 1,
      evaluacionesPorCurso: [],
    })
  })

  it('muestra promedio del API', async () => {
    render(
      <MemoryRouter>
        <DashboardProfesor
          user={{ id: 'u1', name: 'Ana', type: 'teacher', email: 'a@t.com' }}
        />
      </MemoryRouter>
    )
    expect(await screen.findByText('4.8/5.0')).toBeInTheDocument()
  })
})

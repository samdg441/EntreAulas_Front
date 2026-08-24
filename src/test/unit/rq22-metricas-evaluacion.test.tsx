import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardProfesor from '../../features/dashboard-teacher/DashboardProfesor'
import type { User } from '../../types'

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

const teacher: User = { id: 'u1', name: 'Ana', type: 'teacher', email: 'a@t.com' }

function renderDash(user: User) {
  return render(
    <MemoryRouter>
      <DashboardProfesor user={user} />
    </MemoryRouter>
  )
}

/** RQ3 Front — C1 sin user | C2 API falla | C3 OK métricas */
describe('RQ3 unit — Calcular métricas (frontend)', () => {
  beforeEach(() => {
    fetchTeacherId.mockReset()
    fetchTeacherStats.mockReset()
    fetchTeacherCourses.mockReset()
    fetchTeacherCourses.mockResolvedValue([])
  })

  it('C1: sin user.id → no llama APIs', async () => {
    renderDash({ id: '', name: 'X', type: 'teacher', email: '' })
    await waitFor(() => {
      expect(fetchTeacherId).not.toHaveBeenCalled()
      expect(fetchTeacherStats).not.toHaveBeenCalled()
    })
  })

  it('C2: API falla → promedio 0.0/5.0', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherStats.mockRejectedValue(new Error('fail'))
    renderDash(teacher)
    expect(await screen.findByText('0.0/5.0')).toBeInTheDocument()
  })

  it('C3: API OK → promedio y total de evaluaciones', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherStats.mockResolvedValue({
      calificacionPromedio: 4.5,
      totalEvaluaciones: 12,
      cursosImpartidos: 3,
      totalGruposImpartidos: 2,
      evaluacionesPorCurso: [],
    })
    renderDash(teacher)
    expect(await screen.findByText('4.5/5.0')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})

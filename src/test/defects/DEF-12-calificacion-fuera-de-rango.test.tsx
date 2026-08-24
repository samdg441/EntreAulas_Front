/**
 * DEF-12 — La calificación mostrada no se valida contra la escala 0–5 (RQ22)
 *
 * Severidad: Baja | Estado: ABIERTO
 *
 * `averageRating > 0 ? \`${averageRating}/5.0\` : '0.0/5.0'` no comprueba el rango:
 * un 99 se muestra tal cual, y un valor negativo se enmascara como 0.0/5.0, que
 * es indistinguible de "sin evaluaciones".
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

function renderDash() {
  return render(
    <MemoryRouter>
      <DashboardProfesor user={teacher} />
    </MemoryRouter>
  )
}

describe('DEF-12 — La calificación debe respetar la escala 0–5', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchTeacherCourses.mockResolvedValue([])
    fetchTeacherId.mockResolvedValue('7')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('un promedio de 99 no debe mostrarse como calificación válida', async () => {
    fetchTeacherStats.mockResolvedValue({
      calificacionPromedio: 99,
      totalEvaluaciones: 3,
      evaluacionesPorCurso: [],
    })
    renderDash()
    expect(await screen.findByText(/\/5\.0$/)).toBeInTheDocument()
    expect(screen.queryByText('99/5.0')).not.toBeInTheDocument()
  })
})

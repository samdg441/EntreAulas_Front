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

const fetchTeacherId = vi.fn()
const fetchTeacherStats = vi.fn()
const fetchTeacherCourses = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchTeacherId: (...args: unknown[]) => fetchTeacherId(...args),
  fetchTeacherStats: (...args: unknown[]) => fetchTeacherStats(...args),
  fetchTeacherCourses: (...args: unknown[]) => fetchTeacherCourses(...args),
}))

function renderDashboard(user: User) {
  return render(
    <MemoryRouter>
      <DashboardProfesor user={user} />
    </MemoryRouter>
  )
}

describe('RQ3 unitarias — Calcular métricas de evaluación (frontend)', () => {
  beforeEach(() => {
    fetchTeacherId.mockReset()
    fetchTeacherStats.mockReset()
    fetchTeacherCourses.mockReset()
    localStorage.clear()
  })

  it('Camino 1 (1-2-3-11): sin usuario no carga métricas', async () => {
    renderDashboard({ id: '', name: 'Profesor', type: 'teacher', email: '' })

    await waitFor(() => {
      expect(fetchTeacherId).not.toHaveBeenCalled()
      expect(fetchTeacherStats).not.toHaveBeenCalled()
    })
    expect(screen.getByText('Calificación Promedio')).toBeInTheDocument()
  })

  it('Camino 2 (1-2-4-5-6-8-11): API falla → stats vacías', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherStats.mockRejectedValue(new Error('Error al cargar las estadísticas del profesor'))
    fetchTeacherCourses.mockResolvedValue([])

    renderDashboard({ id: 'u1', name: 'Ana Pérez', type: 'teacher', email: 'ana@test.com' })

    await waitFor(() => {
      expect(fetchTeacherStats).toHaveBeenCalled()
    })
    expect(await screen.findByText('0.0/5.0')).toBeInTheDocument()
  })

  it('Camino 3 (1-2-4-5-6-7-9-10-11): API OK muestra promedio y totales', async () => {
    fetchTeacherId.mockResolvedValue('7')
    fetchTeacherStats.mockResolvedValue({
      calificacionPromedio: 4.5,
      totalEvaluaciones: 12,
      cursosImpartidos: 3,
      totalGruposImpartidos: 2,
      evaluacionesPorCurso: [{ curso_id: 1, nombre: 'Cálculo', total: 12, promedio: 4.5 }],
    })
    fetchTeacherCourses.mockResolvedValue([])

    renderDashboard({ id: 'u1', name: 'Ana Pérez', type: 'teacher', email: 'ana@test.com' })

    expect(await screen.findByText('4.5/5.0')).toBeInTheDocument()
  })
})

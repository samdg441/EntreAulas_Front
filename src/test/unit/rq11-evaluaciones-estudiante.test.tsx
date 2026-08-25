import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../../features/dashboard-student/Dashboard'
import type { User } from '../../types'

const useAuth = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../../features/auth/Login', () => ({
  default: () => <div>Pantalla login</div>,
}))

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('../../components/Calendar', () => ({
  default: () => <div data-testid="calendar" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/dashboard']}>{children}</actual.MemoryRouter>
    ),
  }
})

const fetchStudentStats = vi.fn()
const fetchStudentEnrolledSubjects = vi.fn()

vi.mock('../../api/teachers', () => ({
  fetchStudentStats: (...args: unknown[]) => fetchStudentStats(...args),
  fetchStudentEnrolledSubjects: (...args: unknown[]) => fetchStudentEnrolledSubjects(...args),
}))

import App from '../../App'

const studentUser: User = {
  id: 'u-est',
  name: 'Ana Pérez',
  type: 'student',
  email: 'ana@test.com',
}

const teacherUser: User = {
  id: 'u-prof',
  name: 'Carlos Ruiz',
  type: 'teacher',
  email: 'carlos@test.com',
}

function renderDashboard(user: User) {
  return render(
    <MemoryRouter>
      <Dashboard user={user} />
    </MemoryRouter>
  )
}

/**
 * RQ11 Frontend — Dashboard estudiante (grafo Front)
 * C1 1-2-3-4-11 → /login
 * C2 1-2-3-5-6-11 → no llama student-stats
 * C3 1-2-3-5-7-8-9-11 → API falla, ceros
 * C4 1-2-3-5-7-8-10-11 → 200, pinta tarjetas
 */
describe('RQ11 unitarias — Evaluaciones del estudiante (frontend)', () => {
  beforeEach(() => {
    fetchStudentStats.mockReset()
    fetchStudentEnrolledSubjects.mockReset()
    useAuth.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('caminos que fallan', () => {
    it('Camino 1 (1-2-3-4-11): sin authUser redirige a /login', async () => {
      useAuth.mockReturnValue({ user: null })

      render(<App />)

      expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
      expect(fetchStudentStats).not.toHaveBeenCalled()
    })

    it('Camino 2 (1-2-3-5-6-11): hay sesión pero no es estudiante — no llama student-stats', async () => {
      renderDashboard(teacherUser)

      await waitFor(() => {
        expect(fetchStudentStats).not.toHaveBeenCalled()
        expect(fetchStudentEnrolledSubjects).not.toHaveBeenCalled()
      })
      expect(screen.queryByText('Evaluaciones Pendientes')).not.toBeInTheDocument()
      expect(screen.queryByText('Evaluaciones Completadas')).not.toBeInTheDocument()
    })

    it('Camino 3 (1-2-3-5-7-8-9-11): GET student-stats falla → tarjetas en 0', async () => {
      fetchStudentStats.mockRejectedValue(new Error('Error al obtener las estadísticas del estudiante'))
      fetchStudentEnrolledSubjects.mockResolvedValue({ materiasMatriculadas: [] })

      renderDashboard(studentUser)

      await waitFor(() => {
        expect(fetchStudentStats).toHaveBeenCalled()
      })
      expect(await screen.findByText('Evaluaciones Pendientes')).toBeInTheDocument()
      expect(screen.getByText('Evaluaciones Completadas')).toBeInTheDocument()
      expect(screen.getByText('Deben completarse pronto')).toBeInTheDocument()
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('caminos que funcionan', () => {
    it('Camino 4 (1-2-3-5-7-8-10-11): GET 200 pinta pendientes y completadas', async () => {
      fetchStudentStats.mockResolvedValue({
        evaluacionesCompletadas: 4,
        evaluacionesPendientes: 7,
        materiasMatriculadas: 11,
        promedioGeneral: 4.2,
        progresoGeneral: 36,
      })
      fetchStudentEnrolledSubjects.mockResolvedValue({ materiasMatriculadas: [] })

      renderDashboard(studentUser)

      expect(await screen.findByText('Evaluaciones Pendientes')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('Evaluaciones Completadas')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })
})

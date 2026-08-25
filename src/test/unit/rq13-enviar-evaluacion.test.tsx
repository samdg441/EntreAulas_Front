import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EvaluationForm from '../../features/evaluations/EvaluationForm'

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

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/evaluate/form']}>{children}</actual.MemoryRouter>
    ),
  }
})

const submitEvaluation = vi.fn()
const fetchStudentInfo = vi.fn()
const fetchEvaluationQuestions = vi.fn()

vi.mock('../../api/teachers', () => ({
  submitEvaluation: (...args: unknown[]) => submitEvaluation(...args),
  fetchStudentInfo: (...args: unknown[]) => fetchStudentInfo(...args),
  fetchEvaluationQuestions: (...args: unknown[]) => fetchEvaluationQuestions(...args),
}))

import App from '../../App'

const teacher = { id: '7', name: 'Ana Pérez' }
const course = { id: '10', name: 'Cálculo', code: 'C1' }
const group = { id: '3', numero_grupo: 1 }

function renderForm(state: Record<string, unknown> | null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/evaluate/form', state }]}>
      <Routes>
        <Route path="/evaluate/form" element={<EvaluationForm />} />
        <Route path="/evaluate/goodbye" element={<div>Gracias por tu participación</div>} />
        <Route path="/login" element={<div>Pantalla login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function readyForm() {
  fetchStudentInfo.mockResolvedValue({ id: 'est-1' })
  fetchEvaluationQuestions.mockResolvedValue({
    questions: [
      { id: '1', category: 'Claridad', question: '¿Explica con claridad?', type: 'rating' },
    ],
    courseName: 'Cálculo',
    courseCode: 'C1',
    carreraId: 1,
  })
}

async function abrirModal() {
  const user = userEvent.setup()
  expect(await screen.findByRole('button', { name: /finalizar evaluación/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /finalizar evaluación/i }))
  expect(await screen.findByText('Confirmar Evaluación')).toBeInTheDocument()
  return user
}

/**
 * RQ13 Frontend — Enviar evaluación docente (grafo Front)
 * C1 1-2-3-4-15 → /login
 * C2 1-2-3-5-6-7-15 → cancela modal
 * C3 1-2-3-5-6-8-9-10-15 → faltan IDs
 * C4 1...9-11-12-13-15 → POST falla
 * C5 1...9-11-12-14-15 → POST 200, goodbye
 */
describe('RQ13 unitarias — Enviar evaluación docente (frontend)', () => {
  beforeEach(() => {
    submitEvaluation.mockReset()
    fetchStudentInfo.mockReset()
    fetchEvaluationQuestions.mockReset()
    useAuth.mockReset()
    localStorage.clear()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('caminos que fallan', () => {
    it('Camino 1 (1-2-3-4-15): sin authUser redirige a /login', async () => {
      useAuth.mockReturnValue({ user: null })

      render(<App />)

      expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
      expect(submitEvaluation).not.toHaveBeenCalled()
    })

    it('Camino 2 (1-2-3-5-6-7-15): abre el modal y cancela — no llama a la API', async () => {
      await readyForm()
      renderForm({ teacher, course, group })

      const user = await abrirModal()
      await user.click(screen.getByRole('button', { name: /^cancelar$/i }))

      await waitFor(() => {
        expect(screen.queryByText('Confirmar Evaluación')).not.toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /finalizar evaluación/i })).toBeInTheDocument()
      expect(submitEvaluation).not.toHaveBeenCalled()
    })

    it('Camino 3 (1-2-3-5-6-8-9-10-15): confirma pero faltan IDs → alerta, sin POST', async () => {
      await readyForm()
      renderForm({ teacher: { name: 'Ana Pérez' }, course, group })

      const user = await abrirModal()
      await user.click(screen.getByRole('button', { name: /confirmar y enviar/i }))

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error: Faltan datos del profesor o curso')
      })
      expect(submitEvaluation).not.toHaveBeenCalled()
    })

    it('Camino 4 (1...9-11-12-13-15): POST falla → alerta con error del backend', async () => {
      await readyForm()
      submitEvaluation.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Ya has evaluado a este profesor para este curso y grupo' },
        },
      })
      renderForm({ teacher, course, group })

      const user = await abrirModal()
      await user.click(screen.getByRole('button', { name: /confirmar y enviar/i }))

      await waitFor(() => {
        expect(submitEvaluation).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith(
          'Ya has evaluado a este profesor para este curso y grupo'
        )
      })
      expect(screen.queryByText('Gracias por tu participación')).not.toBeInTheDocument()
    })
  })

  describe('caminos que funcionan', () => {
    it('Camino 5 (1...9-11-12-14-15): POST 200 navega a /evaluate/goodbye', async () => {
      await readyForm()
      submitEvaluation.mockResolvedValue({ success: true, evaluationId: 42 })
      renderForm({ teacher, course, group })

      const user = await abrirModal()
      await user.click(screen.getByRole('button', { name: /confirmar y enviar/i }))

      expect(await screen.findByText('Gracias por tu participación')).toBeInTheDocument()
      expect(submitEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: '7',
          courseId: '10',
          groupId: '3',
        })
      )
    })
  })
})

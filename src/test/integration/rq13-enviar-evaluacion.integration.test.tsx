import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EvaluationForm from '../../features/evaluations/EvaluationForm'

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const apiGet = vi.fn()
const apiPost = vi.fn()

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
  default: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
}))

const formState = {
  teacher: { id: '7', name: 'Ana Pérez' },
  course: { id: '10', name: 'Cálculo', code: 'C1' },
  group: { id: '3', numero_grupo: 1 },
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/evaluate/form', state: formState }]}>
      <Routes>
        <Route path="/evaluate/form" element={<EvaluationForm />} />
        <Route path="/evaluate/goodbye" element={<div>Gracias por tu participación</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function confirmarEnvio() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /finalizar evaluación/i }))
  await user.click(await screen.findByRole('button', { name: /confirmar y enviar/i }))
  return user
}

describe('RQ13 integración — Enviar evaluación docente', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    localStorage.clear()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    apiGet.mockImplementation(async (url: string) => {
      if (url.includes('evaluation-questions')) {
        return {
          data: {
            questions: [
              { id: '1', category: 'Claridad', question: '¿Explica con claridad?', type: 'rating' },
            ],
          },
        }
      }
      return { data: { id: 'est-1' } }
    })
  })

  it('Camino 4: POST evaluations falla → alerta con error del back', async () => {
    apiPost.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'Ya has evaluado a este profesor para este curso y grupo' },
      },
    })

    renderForm()
    await confirmarEnvio()

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        '/api/teachers/evaluations',
        expect.objectContaining({ teacherId: '7', courseId: '10' })
      )
      expect(window.alert).toHaveBeenCalledWith(
        'Ya has evaluado a este profesor para este curso y grupo'
      )
    })
  })

  it('Camino 5: POST 200 — front navega a la pantalla de agradecimiento', async () => {
    apiPost.mockResolvedValue({ data: { success: true, evaluationId: 42 } })

    renderForm()
    await confirmarEnvio()

    expect(await screen.findByText('Gracias por tu participación')).toBeInTheDocument()
    expect(apiPost).toHaveBeenCalledWith(
      '/api/teachers/evaluations',
      expect.objectContaining({ teacherId: '7', courseId: '10' })
    )
  })
})

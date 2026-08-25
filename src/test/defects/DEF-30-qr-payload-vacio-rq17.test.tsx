/**
 * DEF-30 — Un GET de token vacío abre la encuesta igual (RQ17)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * Relacionado con DEF-11 (RQ18). El grafo de RQ17 exige profesorId, cursoId
 * y grupoId para continuar. `QrEvaluationEntry` hace
 * `(await getQrEvaluation(token)) || {}` y navega a `/evaluate/form` con
 * identificadores `undefined`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'
import { renderWithRouter } from '../helpers/render'

const getQrEvaluation = vi.fn()
const autoEnrollQrEvaluation = vi.fn()
const useAuth = vi.fn()

vi.mock('../../api/evaluations.api', () => ({
  getQrEvaluation: (...a: unknown[]) => getQrEvaluation(...a),
  autoEnrollQrEvaluation: (...a: unknown[]) => autoEnrollQrEvaluation(...a),
}))

vi.mock('../../context/AuthContext', () => ({ useAuth: () => useAuth() }))

describe('DEF-30 — Un token resuelto sin datos no debe abrir la encuesta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue({})
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })
  })

  it('GET vacío muestra error y no entra a /evaluate/form', async () => {
    renderWithRouter(<QrEvaluationEntry />, {
      route: '/qr-evaluacion?token=t-vacio',
      path: '/qr-evaluacion',
      extraRoutes: [
        { path: '/login', element: <div>Pantalla login</div> },
        { path: '/evaluate/form', element: <div>Formulario evaluación</div> },
      ],
    })

    expect(await screen.findByText('No se pudo abrir la encuesta')).toBeInTheDocument()
    expect(screen.queryByText('Formulario evaluación')).not.toBeInTheDocument()
  })
})

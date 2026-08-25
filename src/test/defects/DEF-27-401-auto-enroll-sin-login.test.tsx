/**
 * DEF-27 — Un 401 en auto-enroll no lleva al login (RQ14)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * El grafo de RQ14 indica 401 → /login. Si la sesión caduca a mitad del
 * flujo, `QrEvaluationEntry` pinta el error en la misma pantalla y deja
 * un botón opcional "Ir a login". No redirige ni guarda `redirectTo`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'
import { renderWithRouter } from '../helpers/render'
import qrFixture from '../fixtures/rq18-qr.json'

const getQrEvaluation = vi.fn()
const autoEnrollQrEvaluation = vi.fn()
const useAuth = vi.fn()

vi.mock('../../api/evaluations.api', () => ({
  getQrEvaluation: (...a: unknown[]) => getQrEvaluation(...a),
  autoEnrollQrEvaluation: (...a: unknown[]) => autoEnrollQrEvaluation(...a),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}))

describe('DEF-27 — Un 401 en auto-enroll debe ir a /login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockRejectedValue({
      response: { status: 401, data: { error: 'Token de acceso requerido' } },
    })
  })

  it('401 redirige a login y guarda redirectTo', async () => {
    renderWithRouter(<QrEvaluationEntry />, {
      route: qrFixture.tokenValido.url,
      path: '/qr-evaluacion',
      extraRoutes: [
        { path: '/login', element: <div>Pantalla login</div> },
        { path: '/evaluate/form', element: <div>Formulario evaluación</div> },
      ],
    })

    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBe(qrFixture.tokenValido.url)
    expect(screen.queryByText('No se pudo abrir la encuesta')).not.toBeInTheDocument()
  })
})

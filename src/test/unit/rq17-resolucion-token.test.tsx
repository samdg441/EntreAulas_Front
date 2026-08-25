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

function renderEntry(url: string) {
  return renderWithRouter(<QrEvaluationEntry />, {
    route: url,
    path: '/qr-evaluacion',
    extraRoutes: [
      { path: '/login', element: <div>Pantalla login</div> },
      { path: '/evaluate/form', element: <div>Formulario evaluación</div> },
    ],
  })
}

/** RQ17 Front — C1 URL sin token | C2 sin sesión | C3 GET error | C4 200 */
describe('RQ17 unit — Resolución de token QR (frontend)', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C1: URL sin token → error local', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    renderEntry(qrFixture.sinToken.url)
    expect(await screen.findByText(qrFixture.sinToken.mensajeError)).toBeInTheDocument()
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C2: token sin sesión → /login + redirectTo', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBe(qrFixture.tokenValido.url)
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C3: GET 404/error → QR inválido o expirado', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue(qrFixture.tokenInvalido.apiError)
    renderEntry(qrFixture.tokenInvalido.url)
    expect(
      await screen.findByText(qrFixture.tokenInvalido.apiError.response.data.error)
    ).toBeInTheDocument()
    expect(autoEnrollQrEvaluation).not.toHaveBeenCalled()
  })

  it('C4: GET 200 → llama getQrEvaluation y entra al formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
    expect(getQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
  })
})

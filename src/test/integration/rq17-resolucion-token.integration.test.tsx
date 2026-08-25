import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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

/** RQ17 integración: GET token + mapeo a /evaluate/form */
describe('RQ17 integration — Resolución de token QR', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C2: token sin sesión → login + redirectTo', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toContain(qrFixture.tokenValido.token)
  })

  it('C3: 404 API → error en UI', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue(qrFixture.tokenInvalido.apiError)
    renderEntry(qrFixture.tokenInvalido.url)
    expect(
      await screen.findByText(qrFixture.tokenInvalido.apiError.response.data.error)
    ).toBeInTheDocument()
  })

  it('C4: 200 → getQrEvaluation(token) y formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockResolvedValue({})
    renderEntry(qrFixture.tokenValido.url)
    await waitFor(() =>
      expect(getQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
    )
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
  })
})

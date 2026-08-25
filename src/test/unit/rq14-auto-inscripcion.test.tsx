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

/** RQ14 Front — auto-enroll tras resolver QR: C1 sin sesión | C2 API falla | C3 OK */
describe('RQ14 unit — Auto-inscripción (frontend)', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C1: sin sesión → login (no llama auto-enroll)', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(autoEnrollQrEvaluation).not.toHaveBeenCalled()
  })

  it('C2: auto-enroll falla → error en UI', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockRejectedValue({
      response: { data: { error: 'Solo los estudiantes pueden matricularse por QR.' } },
    })
    renderEntry(qrFixture.tokenValido.url)
    expect(
      await screen.findByText('Solo los estudiantes pueden matricularse por QR.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Formulario evaluación')).not.toBeInTheDocument()
  })

  it('C3: auto-enroll OK → formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockResolvedValue({ enrolled: true, created: true })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
    expect(autoEnrollQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
  })
})

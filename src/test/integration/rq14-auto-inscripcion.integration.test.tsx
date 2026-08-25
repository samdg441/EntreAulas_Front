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

/** RQ14 integración: GET token + POST auto-enroll → /evaluate/form */
describe('RQ14 integration — Auto-inscripción', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
  })

  it('C3: 200 QR + enroll → formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'est1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })

    renderWithRouter(<QrEvaluationEntry />, {
      route: qrFixture.tokenValido.url,
      path: '/qr-evaluacion',
      extraRoutes: [{ path: '/evaluate/form', element: <div>Formulario evaluación</div> }],
    })

    await waitFor(() => {
      expect(getQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
      expect(autoEnrollQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
    })
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
  })
})

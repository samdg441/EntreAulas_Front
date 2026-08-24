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

/** RQ18 Front — C1 sin token | C2 sin sesión | C3 API error | C4 OK */
describe('RQ18 unit — Validar QR (frontend)', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C1: sin token → error local', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    renderEntry(qrFixture.sinToken.url)
    expect(await screen.findByText(qrFixture.sinToken.mensajeError)).toBeInTheDocument()
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C2: sin sesión → redirect login', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBe(qrFixture.tokenValido.url)
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C3: API error → QR inválido/expirado', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue(qrFixture.tokenInvalido.apiError)
    renderEntry(qrFixture.tokenInvalido.url)
    expect(
      await screen.findByText(qrFixture.tokenInvalido.apiError.response.data.error)
    ).toBeInTheDocument()
  })

  it('C4: OK → formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue(qrFixture.tokenValido.apiResponse)
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })
    renderEntry(qrFixture.tokenValido.url)
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
    expect(autoEnrollQrEvaluation).toHaveBeenCalledWith(qrFixture.tokenValido.token)
  })

  // La rama "vencido por fecha" no es alcanzable: el front no mira fechas y el
  // back tampoco (DEF-14). Ver HALLAZGOS.md.
  it.todo('C3b: QR fuera de su ventana de vigencia → error en pantalla (DEF-14)')
})

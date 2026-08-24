import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'

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
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/qr-evaluacion" element={<QrEvaluationEntry />} />
        <Route path="/login" element={<div>Pantalla login</div>} />
        <Route path="/evaluate/form" element={<div>Formulario evaluación</div>} />
      </Routes>
    </MemoryRouter>
  )
}

/** RQ1 Front — C1 sin token | C2 sin sesión | C3 API error | C4 OK */
describe('RQ1 unit — Validar QR (frontend)', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C1: sin token → error local', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    renderEntry('/qr-evaluacion')
    expect(await screen.findByText('No se encontró token en el QR.')).toBeInTheDocument()
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C2: sin sesión → redirect login', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry('/qr-evaluacion?token=abc')
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBe('/qr-evaluacion?token=abc')
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('C3: API error → QR inválido/expirado', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue({
      response: { data: { error: 'QR inválido o expirado.' } },
    })
    renderEntry('/qr-evaluacion?token=bad')
    expect(await screen.findByText('QR inválido o expirado.')).toBeInTheDocument()
  })

  it('C4: OK → formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue({
      profesorId: 1,
      cursoId: 2,
      grupoId: 3,
      profesorNombre: 'Ana',
      cursoNombre: 'Cálculo',
    })
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })
    renderEntry('/qr-evaluacion?token=ok')
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
    expect(autoEnrollQrEvaluation).toHaveBeenCalledWith('ok')
  })
})

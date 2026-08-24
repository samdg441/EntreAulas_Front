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

/** Integración RQ1: caminos de sesión + API (mismo grafo Front). */
describe('RQ1 integration — Validar QR', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('C2: token sin sesión → login + redirectTo', async () => {
    useAuth.mockReturnValue({ user: null })
    renderEntry('/qr-evaluacion?token=abc123')
    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toContain('token=abc123')
  })

  it('C3: 404 API → error en UI', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue({
      response: { data: { error: 'QR inválido o expirado.' } },
    })
    renderEntry('/qr-evaluacion?token=vencido')
    expect(await screen.findByText('No se pudo abrir la encuesta')).toBeInTheDocument()
    expect(screen.getByText('QR inválido o expirado.')).toBeInTheDocument()
  })

  it('C4: 200 + auto-enroll → formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue({ profesorId: 1, cursoId: 2, grupoId: 3 })
    autoEnrollQrEvaluation.mockResolvedValue({})
    renderEntry('/qr-evaluacion?token=ok')
    await waitFor(() => expect(getQrEvaluation).toHaveBeenCalledWith('ok'))
    expect(await screen.findByText('Formulario evaluación')).toBeInTheDocument()
  })
})

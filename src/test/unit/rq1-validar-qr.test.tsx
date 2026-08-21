import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'

const getQrEvaluation = vi.fn()
const autoEnrollQrEvaluation = vi.fn()
const useAuth = vi.fn()

vi.mock('../../api/evaluations.api', () => ({
  getQrEvaluation: (...args: unknown[]) => getQrEvaluation(...args),
  autoEnrollQrEvaluation: (...args: unknown[]) => autoEnrollQrEvaluation(...args),
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

describe('RQ1 unitarias — Validar QR vencido o inválido (frontend)', () => {
  beforeEach(() => {
    getQrEvaluation.mockReset()
    autoEnrollQrEvaluation.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('Camino 1 (1-2-3-4-11): URL sin token muestra error local', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })

    renderEntry('/qr-evaluacion')

    expect(await screen.findByText('No se encontró token en el QR.')).toBeInTheDocument()
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('Camino 2 (1-2-3-5-6-11): hay token pero no hay sesión → redirect a /login', async () => {
    useAuth.mockReturnValue({ user: null })

    renderEntry('/qr-evaluacion?token=abc123')

    expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBe('/qr-evaluacion?token=abc123')
    expect(getQrEvaluation).not.toHaveBeenCalled()
  })

  it('Camino 3 (1-2-3-5-7-8-9-11): token inválido/vencido (API 404)', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockRejectedValue({
      response: { data: { error: 'QR inválido o expirado.' } },
    })

    renderEntry('/qr-evaluacion?token=vencido')

    expect(await screen.findByText('No se pudo abrir la encuesta')).toBeInTheDocument()
    expect(screen.getByText('QR inválido o expirado.')).toBeInTheDocument()
  })

  it('Camino 4 (1-2-3-5-7-8-10-11): QR válido + usuario logueado navega al formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue({
      profesorId: 1,
      profesorNombre: 'Ana',
      cursoId: 2,
      cursoNombre: 'Cálculo',
      grupoId: 3,
    })
    autoEnrollQrEvaluation.mockResolvedValue({ alreadyEnrolled: true })

    renderEntry('/qr-evaluacion?token=ok')

    await waitFor(() => {
      expect(screen.getByText('Formulario evaluación')).toBeInTheDocument()
    })
    expect(autoEnrollQrEvaluation).toHaveBeenCalledWith('ok')
  })
})

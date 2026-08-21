import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'

const apiGet = vi.fn()
const apiPost = vi.fn()
const useAuth = vi.fn()

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
  default: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
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

describe('RQ1 integración — Validar QR vencido o inválido', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    useAuth.mockReset()
    localStorage.clear()
  })

  it('Camino 1: URL sin token — error solo en front (no llama back)', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })

    renderEntry('/qr-evaluacion')

    expect(await screen.findByText('No se encontró token en el QR.')).toBeInTheDocument()
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('Camino 2: token inválido — GET /api/qr-evaluaciones/:token 404 → UI de error', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    apiGet.mockRejectedValue({
      response: { status: 404, data: { error: 'QR inválido o expirado.' } },
    })

    renderEntry('/qr-evaluacion?token=invalido')

    expect(await screen.findByText('No se pudo abrir la encuesta')).toBeInTheDocument()
    expect(screen.getByText('QR inválido o expirado.')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/api/qr-evaluaciones/invalido')
  })

  it('Camino 3: QR válido — back 200 → front abre encuesta', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    apiGet.mockResolvedValue({
      data: {
        profesorId: 10,
        profesorNombre: 'Luis',
        cursoId: 20,
        cursoNombre: 'Álgebra',
        grupoId: 30,
      },
    })
    apiPost.mockResolvedValue({ data: { alreadyEnrolled: false } })

    renderEntry('/qr-evaluacion?token=valido')

    await waitFor(() => {
      expect(screen.getByText('Formulario evaluación')).toBeInTheDocument()
    })
    expect(apiGet).toHaveBeenCalledWith('/api/qr-evaluaciones/valido')
    expect(apiPost).toHaveBeenCalledWith('/api/qr-evaluaciones/valido/auto-enroll')
  })
})

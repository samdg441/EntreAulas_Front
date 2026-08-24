/**
 * DEF-11 — Un QR con respuesta vacía lleva al formulario sin datos (RQ18, integración)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * `QrEvaluationEntry` hace `(await getQrEvaluation(token)) || {}` y navega al
 * formulario sin comprobar que lleguen profesorId, cursoId y grupoId. El
 * estudiante termina en una encuesta con identificadores `undefined`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'

const getQrEvaluation = vi.fn()
const autoEnrollQrEvaluation = vi.fn()
const useAuth = vi.fn()

vi.mock('../../api/evaluations.api', () => ({
  getQrEvaluation: (...a: unknown[]) => getQrEvaluation(...a),
  autoEnrollQrEvaluation: (...a: unknown[]) => autoEnrollQrEvaluation(...a),
}))

vi.mock('../../context/AuthContext', () => ({ useAuth: () => useAuth() }))

describe('DEF-11 — Un QR sin datos debe mostrar error, no abrir la encuesta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('respuesta vacía del backend no debe navegar al formulario', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    getQrEvaluation.mockResolvedValue({})
    autoEnrollQrEvaluation.mockResolvedValue({})

    render(
      <MemoryRouter initialEntries={['/qr-evaluacion?token=ok']}>
        <Routes>
          <Route path="/qr-evaluacion" element={<QrEvaluationEntry />} />
          <Route path="/evaluate/form" element={<div>Formulario evaluación</div>} />
          <Route path="/login" element={<div>Pantalla login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('No se pudo abrir la encuesta')).toBeInTheDocument()
  })
})

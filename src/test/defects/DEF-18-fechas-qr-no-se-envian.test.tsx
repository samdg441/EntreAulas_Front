/**
 * DEF-18 — Las fechas de vigencia del QR no salen del cliente (RQ18, frontend)
 *
 * Severidad: Alta | Estado: ABIERTO
 *
 * Contraparte de DEF-14 y DEF-15 del backend. Las pantallas obligan a llenar
 * inicio y cierre, pero `createQrEvaluationsBatch` solo envía `{ grupoIds }`.
 * Además el formulario no compara las dos fechas: un cierre anterior al
 * inicio se acepta.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQrEvaluationsBatch } from '../../api/evaluations.api'
import ScheduleSurveys from '../../features/evaluations/ScheduleSurveys'

const post = vi.fn()
vi.mock('../../api/client', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a), get: vi.fn() },
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))
vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/CourseQrPoster', () => ({ CourseQrPoster: () => null }))
vi.mock('../../utils/export', () => ({ exportElementToPNG: vi.fn() }))
vi.mock('../../api/coordinador.api', () => ({
  fetchCursosConProfesor: vi.fn().mockResolvedValue([]),
}))

describe('DEF-18 — La ventana de vigencia debe viajar al backend y ser coherente', () => {
  beforeEach(() => {
    post.mockReset()
    post.mockResolvedValue({ data: { created: [] } })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('el lote de QR debe enviar startDate y endDate', async () => {
    await createQrEvaluationsBatch([1])

    expect(post).toHaveBeenCalledWith(
      '/api/qr-evaluaciones/batch',
      expect.objectContaining({
        grupoIds: [1],
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    )
  })

  it('un cierre anterior al inicio no debe programar la encuesta', () => {
    render(
      <MemoryRouter initialEntries={['/surveys/schedule']}>
        <Routes>
          <Route path="/surveys/schedule" element={<ScheduleSurveys />} />
          <Route path="/dashboard-coordinador" element={<div>Dashboard coordinador</div>} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(document.querySelector('input[name="startDate"]') as HTMLInputElement, {
      target: { value: '2026-12-31' },
    })
    fireEvent.change(document.querySelector('input[name="endDate"]') as HTMLInputElement, {
      target: { value: '2026-01-01' },
    })
    fireEvent.change(screen.getByPlaceholderText('2025-1'), {
      target: { value: '2026-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /programar encuesta/i }))

    expect(window.alert).not.toHaveBeenCalledWith('Encuesta programada correctamente')
  })
})

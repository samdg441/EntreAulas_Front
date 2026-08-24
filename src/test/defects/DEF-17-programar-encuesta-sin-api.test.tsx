/**
 * DEF-17 — "Programar encuesta" no llama al backend (RQ18, frontend)
 *
 * Severidad: Alta | Estado: ABIERTO
 *
 * `ScheduleSurveys.handleSubmit` exige fechas y período, muestra
 * "Encuesta programada correctamente" y navega al dashboard, pero el
 * bloque del `try` está vacío: no hay POST. El coordinador cree que dejó
 * una ventana de vigencia y no se persistió nada.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ScheduleSurveys from '../../features/evaluations/ScheduleSurveys'

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))
vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/CourseQrPoster', () => ({ CourseQrPoster: () => null }))
vi.mock('../../utils/export', () => ({ exportElementToPNG: vi.fn() }))
vi.mock('../../api/coordinador.api', () => ({
  fetchCursosConProfesor: vi.fn().mockResolvedValue([]),
}))

const createQrEvaluationsBatch = vi.fn()
vi.mock('../../api/evaluations.api', () => ({
  createQrEvaluationsBatch: (...a: unknown[]) => createQrEvaluationsBatch(...a),
  shareQrEvaluationsEmail: vi.fn(),
}))

describe('DEF-17 — Programar encuesta debe persistir en el servidor', () => {
  beforeEach(() => {
    createQrEvaluationsBatch.mockReset()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('con fechas y período no debe fingir éxito sin llamar a la API', async () => {
    render(
      <MemoryRouter initialEntries={['/surveys/schedule']}>
        <Routes>
          <Route path="/surveys/schedule" element={<ScheduleSurveys />} />
          <Route path="/dashboard-coordinador" element={<div>Dashboard coordinador</div>} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(document.querySelector('input[name="startDate"]') as HTMLInputElement, {
      target: { value: '2026-03-01' },
    })
    fireEvent.change(document.querySelector('input[name="endDate"]') as HTMLInputElement, {
      target: { value: '2026-03-31' },
    })
    fireEvent.change(screen.getByPlaceholderText('2025-1'), {
      target: { value: '2026-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /programar encuesta/i }))

    expect(createQrEvaluationsBatch).toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalledWith('Encuesta programada correctamente')
  })
})

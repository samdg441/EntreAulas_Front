import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AISummaryCard from '../../components/AISummaryCard'

const apiGet = vi.fn()

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
  default: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
}))

describe('RQ29 integración — Resumen generado con IA', () => {
  beforeEach(() => {
    apiGet.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('Camino 1: GET by-professor 401 → error en la tarjeta', async () => {
    apiGet.mockRejectedValue({
      response: { status: 401, data: { error: 'Token de acceso requerido' } },
    })

    render(
      <AISummaryCard endpoint="by-professor" params={{ profesor_id: 'user-profesor' }} />
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText(/token de acceso requerido/i)).toBeInTheDocument()
  })

  it('Camino 5: GET 200 — la tarjeta muestra el resumen del back', async () => {
    apiGet.mockResolvedValue({
      data: {
        textsCount: 4,
        analysisSource: 'open_text',
        summary: 'Resumen Gemini del docente',
        topics: ['claridad'],
      },
    })

    render(
      <AISummaryCard endpoint="by-professor" params={{ profesor_id: 'user-profesor' }} />
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText('Resumen Gemini del docente')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/api/ai/summarize/by-professor', {
      params: { profesor_id: 'user-profesor' },
    })
  })
})

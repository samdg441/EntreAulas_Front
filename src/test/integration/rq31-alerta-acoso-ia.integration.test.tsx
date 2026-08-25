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

describe('RQ31 integración — Recibir alerta de acoso con IA', () => {
  beforeEach(() => {
    apiGet.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('Camino 2: GET by-career 500 → error, sin banner de acoso', async () => {
    apiGet.mockRejectedValue({
      response: { status: 500, data: { error: 'Error interno del servidor' } },
    })

    render(<AISummaryCard endpoint="by-career" params={{ periodo_id: '2025-1' }} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText(/error interno del servidor/i)).toBeInTheDocument()
    expect(screen.queryByText('ALERTA DE ACOSO DETECTADO')).not.toBeInTheDocument()
  })

  it('Camino 5: GET 200 con acosoDetectado → banner y listado de docentes', async () => {
    apiGet.mockResolvedValue({
      data: {
        textsCount: 2,
        analysisSource: 'open_text',
        acosoDetectado: true,
        mensajeAcoso: '⚠️ ALERTA: Se detectaron menciones de acoso.',
        summary: 'Resumen de la carrera',
        topics: ['respeto'],
        acosoProfesores: [
          { profesorId: '7', nombre: 'Ana Perez', menciones: 1, ejemplos: [] },
        ],
      },
    })

    render(<AISummaryCard endpoint="by-career" params={{ periodo_id: '2025-1' }} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText('ALERTA DE ACOSO DETECTADO')).toBeInTheDocument()
    expect(screen.getByText('Ana Perez: 1 mención(es)')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/api/ai/summarize/by-career', {
      params: { periodo_id: '2025-1' },
    })
  })
})

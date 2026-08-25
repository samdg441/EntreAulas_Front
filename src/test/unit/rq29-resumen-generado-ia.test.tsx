import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

function renderCard() {
  return render(
    <AISummaryCard
      endpoint="by-professor"
      params={{ profesor_id: 'user-profesor', periodo_id: '2025-1' }}
    />
  )
}

async function generar() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /generar resumen ia/i }))
  return user
}

/**
 * RQ29 Frontend — Resumen generado con IA (AISummaryCard)
 * Consume GET /api/ai/summarize/by-professor
 */
describe('RQ29 unitarias — Resumen generado con IA (frontend)', () => {
  beforeEach(() => {
    apiGet.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('caminos que fallan', () => {
    it('Camino 1: API 401 → muestra error, no pinta resumen', async () => {
      apiGet.mockRejectedValue({
        response: { status: 401, data: { error: 'Token de acceso requerido', code: 'NO_TOKEN' } },
      })
      renderCard()
      await generar()

      expect(await screen.findByText(/token de acceso requerido/i)).toBeInTheDocument()
      expect(screen.queryByText('Resumen')).not.toBeInTheDocument()
    })

    it('Camino 2: API 403 → muestra error de permisos', async () => {
      apiGet.mockRejectedValue({
        response: { status: 403, data: { error: 'Permisos insuficientes', code: 'FORBIDDEN_ROLE' } },
      })
      renderCard()
      await generar()

      expect(await screen.findByText(/permisos insuficientes/i)).toBeInTheDocument()
    })
  })

  describe('caminos que funcionan', () => {
    it('Camino 3: 200 sin textos ni ratings → aviso sin datos', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 0,
          summary: 'No se encontraron respuestas abiertas para este profesor en el período seleccionado.',
          topics: [],
        },
      })
      renderCard()
      await generar()

      expect(
        await screen.findByText('⚠️ No se encontraron respuestas abiertas')
      ).toBeInTheDocument()
      expect(screen.queryByText('Temas más mencionados')).not.toBeInTheDocument()
    })

    it('Camino 4: 200 fallback cuantitativo → pinta resumen de ratings', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 0,
          ratingsCount: 12,
          analysisSource: 'quantitative_fallback',
          summary: 'Resumen cualitativo a partir de 12 respuestas cuantitativas del docente.',
          topics: ['promedio 4.20/5'],
        },
      })
      renderCard()
      await generar()

      expect(
        await screen.findByText(/resumen cualitativo generado desde/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText('Resumen cualitativo a partir de 12 respuestas cuantitativas del docente.')
      ).toBeInTheDocument()
      expect(screen.getByText('promedio 4.20/5')).toBeInTheDocument()
    })

    it('Camino 5: 200 con resumen IA → pinta summary y topics', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 4,
          analysisSource: 'open_text',
          summary: 'Resumen Gemini del docente',
          topics: ['claridad', 'puntualidad'],
        },
      })
      renderCard()
      await generar()

      expect(await screen.findByText('Resumen Gemini del docente')).toBeInTheDocument()
      expect(screen.getByText(/analizadas 4 respuestas abiertas/i)).toBeInTheDocument()
      expect(screen.getByText('claridad')).toBeInTheDocument()
      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/api/ai/summarize/by-professor', {
          params: { profesor_id: 'user-profesor', periodo_id: '2025-1' },
        })
      })
    })

    it('Camino 6: 200 con fallback local (Gemini falló en back) → pinta resumen local', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 3,
          analysisSource: 'open_text',
          summary: 'Estado general favorable en la percepción estudiantil.',
          topics: ['claridad'],
        },
      })
      renderCard()
      await generar()

      expect(await screen.findByText(/estado general favorable/i)).toBeInTheDocument()
      expect(screen.getByText('claridad')).toBeInTheDocument()
    })
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AISummaryCard from '../../components/AISummaryCard'

const useAuth = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../../features/auth/Login', () => ({
  default: () => <div>Pantalla login</div>,
}))

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/reports']}>{children}</actual.MemoryRouter>
    ),
  }
})

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

import App from '../../App'

function renderCard() {
  return render(
    <AISummaryCard endpoint="by-career" params={{ periodo_id: '2025-1' }} />
  )
}

async function generar() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /generar resumen ia/i }))
  return user
}

/**
 * RQ31 Frontend — Recibir alerta de acoso con IA
 * C1 → /login | C2 error API | C3 sin datos | C4 resumen sin alerta | C5 banner de acoso
 */
describe('RQ31 unitarias — Recibir alerta de acoso con IA (frontend)', () => {
  beforeEach(() => {
    apiGet.mockReset()
    useAuth.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('caminos que fallan', () => {
    it('Camino 1 (1-2-3-4): sin authUser redirige a /login', async () => {
      useAuth.mockReturnValue({ user: null, loading: false, hasRole: () => false })
      render(<App />)
      expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
    })

    it('Camino 2 (1-2-3-5-6-7-8-14): API falla → bloque de error, sin banner', async () => {
      apiGet.mockRejectedValue({
        response: { status: 500, data: { error: 'Error interno del servidor' } },
      })
      renderCard()
      await generar()

      expect(await screen.findByText(/error interno del servidor/i)).toBeInTheDocument()
      expect(screen.queryByText('ALERTA DE ACOSO DETECTADO')).not.toBeInTheDocument()
    })
  })

  describe('caminos que funcionan', () => {
    it('Camino 3 (1-2-3-5-6-7-9-10-14): 200 vacío → aviso sin respuestas', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 0,
          summary: 'No se encontraron respuestas abiertas válidas para esta carrera.',
          topics: [],
        },
      })
      renderCard()
      await generar()

      expect(
        await screen.findByText('⚠️ No se encontraron respuestas abiertas')
      ).toBeInTheDocument()
      expect(screen.queryByText('ALERTA DE ACOSO DETECTADO')).not.toBeInTheDocument()
    })

    it('Camino 4 (1-2-3-5-6-7-9-11-13-14): acosoDetectado false → resumen sin alerta', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 4,
          analysisSource: 'open_text',
          acosoDetectado: false,
          summary: 'Resumen de la carrera sin indicios de acoso',
          topics: ['claridad'],
          acosoProfesores: [],
        },
      })
      renderCard()
      await generar()

      expect(await screen.findByText('Resumen de la carrera sin indicios de acoso')).toBeInTheDocument()
      expect(screen.queryByText('ALERTA DE ACOSO DETECTADO')).not.toBeInTheDocument()
      expect(screen.queryByText(/docentes vinculados a menciones de acoso/i)).not.toBeInTheDocument()
    })

    it('Camino 5 (1-2-3-5-6-7-9-11-12-13-14): acosoDetectado true → banner y docentes', async () => {
      apiGet.mockResolvedValue({
        data: {
          textsCount: 2,
          analysisSource: 'open_text',
          acosoDetectado: true,
          mensajeAcoso: '⚠️ ALERTA: Se detectaron menciones que podrían referirse a situaciones de acoso.',
          summary: 'Resumen de la carrera',
          topics: ['respeto'],
          acosoProfesores: [
            { profesorId: '7', nombre: 'Ana Perez', menciones: 2, ejemplos: ['Hubo acoso'] },
          ],
        },
      })
      renderCard()
      await generar()

      expect(await screen.findByText('ALERTA DE ACOSO DETECTADO')).toBeInTheDocument()
      expect(screen.getByText('Ana Perez: 2 mención(es)')).toBeInTheDocument()
      expect(screen.getByText('Resumen de la carrera')).toBeInTheDocument()
      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/api/ai/summarize/by-career', {
          params: { periodo_id: '2025-1' },
        })
      })
    })
  })
})

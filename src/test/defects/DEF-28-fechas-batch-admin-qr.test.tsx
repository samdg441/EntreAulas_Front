/**
 * DEF-28 — Fechas y período no viajan en el lote de Admin QR (RQ15)
 *
 * Severidad: Alta | Estado: ABIERTO
 *
 * Contraparte de DEF-18, sobre la pantalla de RQ15. El formulario exige
 * inicio, cierre y período, pero `ensureTokensForGrupoIds` llama
 * `createQrEvaluationsBatch(missing)` y la API solo POSTea `{ grupoIds }`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import AdminQrPage from '../../features/dashboard-admin/AdminQrPage'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/CourseQrPoster', () => ({ CourseQrPoster: () => null }))
vi.mock('../../utils/export', () => ({ exportElementToPNG: vi.fn() }))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'a1', email: 'a@a.com', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' },
    loading: false,
  }),
}))

const academicStructure = vi.fn()
const gruposByCareer = vi.fn()
vi.mock('../../api/users', () => ({
  usersApi: {
    academicStructure: (...a: unknown[]) => academicStructure(...a),
    gruposByCareer: (...a: unknown[]) => gruposByCareer(...a),
  },
}))

const createQrEvaluationsBatch = vi.fn()
vi.mock('../../api/evaluations.api', () => ({
  createQrEvaluationsBatch: (...a: unknown[]) => createQrEvaluationsBatch(...a),
  shareQrEvaluationsEmail: vi.fn(),
}))

describe('DEF-28 — El lote de Admin QR debe enviar vigencia y período', () => {
  beforeEach(() => {
    academicStructure.mockResolvedValue({
      facultades: [{ id: 1, nombre: 'Ing', carreras: [{ id: 10, nombre: 'Sistemas' }] }],
    })
    gruposByCareer.mockResolvedValue([
      { id: 1, cursoNombre: 'Cálculo', cursoCodigo: 'MAT', grupo: '1', profesorNombre: 'Ana' },
    ])
    createQrEvaluationsBatch.mockResolvedValue({
      created: [{ grupoId: 1, token: 't1' }],
      skipped: [],
    })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('Confirmar generación envía grupoIds, startDate, endDate y period', async () => {
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    fireEvent.change(screen.getByPlaceholderText('2026-1'), { target: { value: '2026-1' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /Cargar cursos/i }))
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar generación/i }))

    await waitFor(() => {
      expect(createQrEvaluationsBatch).toHaveBeenCalled()
    })
    expect(createQrEvaluationsBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        grupoIds: [1],
        startDate: '2026-03-01',
        endDate: '2026-06-01',
        period: '2026-1',
      })
    )
  })
})

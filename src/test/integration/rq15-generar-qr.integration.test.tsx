import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
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

/** RQ15 integración: smoke POST batch desde Confirmar generación. */
describe('RQ15 integration — Generación QR', () => {
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

  it('C4: confirmar con grupo → POST /batch', async () => {
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
      expect(createQrEvaluationsBatch).toHaveBeenCalledWith([1])
    })
  })
})

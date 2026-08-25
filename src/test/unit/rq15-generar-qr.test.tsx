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
    hasRole: (r: string) => r === 'admin',
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
const shareQrEvaluationsEmail = vi.fn()
vi.mock('../../api/evaluations.api', () => ({
  createQrEvaluationsBatch: (...a: unknown[]) => createQrEvaluationsBatch(...a),
  shareQrEvaluationsEmail: (...a: unknown[]) => shareQrEvaluationsEmail(...a),
}))

const grupo = {
  id: 1,
  cursoNombre: 'Cálculo',
  cursoCodigo: 'MAT',
  grupo: '1',
  profesorNombre: 'Ana P',
}

async function loadGrupo() {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: /Cargar cursos/i }))
  expect(await screen.findByText('Cálculo')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('checkbox'))
}

/** RQ15 Front — C1 fechas | C2 sin grupos | C3 API falla | C4 201 */
describe('RQ15 unit — Generación masiva QR (frontend)', () => {
  beforeEach(() => {
    academicStructure.mockReset()
    gruposByCareer.mockReset()
    createQrEvaluationsBatch.mockReset()
    academicStructure.mockResolvedValue({
      facultades: [{ id: 1, nombre: 'Ing', carreras: [{ id: 10, nombre: 'Sistemas' }] }],
    })
    gruposByCareer.mockResolvedValue([grupo])
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('C1: submit sin fechas/período → alerta', async () => {
    renderWithRouter(<AdminQrPage />)
    await screen.findByText('Generación de QR')
    fireEvent.click(screen.getByRole('button', { name: /Confirmar generación/i }))
    expect(window.alert).toHaveBeenCalledWith(
      'Completa Fecha de inicio, Fecha de cierre y Período.'
    )
    expect(createQrEvaluationsBatch).not.toHaveBeenCalled()
  })

  it('C2: fechas ok sin grupos → alerta', async () => {
    renderWithRouter(<AdminQrPage />)
    await screen.findByText('Generación de QR')
    fireEvent.change(screen.getByPlaceholderText('2026-1'), { target: { value: '2026-1' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar generación/i }))
    expect(window.alert).toHaveBeenCalledWith('Selecciona al menos un curso/grupo.')
  })

  it('C3: POST batch falla → alerta error', async () => {
    createQrEvaluationsBatch.mockRejectedValue(new Error('fail'))
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    fireEvent.change(screen.getByPlaceholderText('2026-1'), { target: { value: '2026-1' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    await loadGrupo()
    fireEvent.click(screen.getByRole('button', { name: /Confirmar generación/i }))
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error al generar los QR')
    })
  })

  it('C4: 201 → alerta de QR generados', async () => {
    createQrEvaluationsBatch.mockResolvedValue({
      created: [{ grupoId: 1, token: 't1' }],
      skipped: [],
    })
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    fireEvent.change(screen.getByPlaceholderText('2026-1'), { target: { value: '2026-1' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    await loadGrupo()
    fireEvent.click(screen.getByRole('button', { name: /Confirmar generación/i }))
    await waitFor(() => {
      expect(createQrEvaluationsBatch).toHaveBeenCalledWith([1])
      expect(window.alert).toHaveBeenCalledWith('QR generados / encuesta lista para compartir.')
    })
  })
})

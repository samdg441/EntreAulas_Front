/**
 * DEF-29 — El modal de correo no valida el formato del destinatario (RQ16)
 *
 * Severidad: Baja | Estado: ABIERTO
 *
 * RQ16 C1 exige destinatario válido. La UI solo comprueba `to.trim()` no
 * vacío: "hola-sin-arroba" dispara `shareQrEvaluationsEmail` y el error
 * llega, si acaso, desde el 400 del backend.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
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
const shareQrEvaluationsEmail = vi.fn()
vi.mock('../../api/evaluations.api', () => ({
  createQrEvaluationsBatch: (...a: unknown[]) => createQrEvaluationsBatch(...a),
  shareQrEvaluationsEmail: (...a: unknown[]) => shareQrEvaluationsEmail(...a),
}))

describe('DEF-29 — Un destinatario sin formato de correo no debe enviarse', () => {
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
    shareQrEvaluationsEmail.mockReset()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('hola-sin-arroba no llama a shareQrEvaluationsEmail', async () => {
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    fireEvent.change(screen.getByPlaceholderText('2026-1'), { target: { value: '2026-1' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /Cargar cursos/i }))
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Generar QR/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Compartir email/i }))
    expect(await screen.findByText('Compartir QRs por correo')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Destinatario'), {
      target: { value: 'hola-sin-arroba' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))

    await Promise.resolve()
    expect(shareQrEvaluationsEmail).not.toHaveBeenCalled()
  })
})

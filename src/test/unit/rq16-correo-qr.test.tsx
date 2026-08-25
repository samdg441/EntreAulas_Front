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
const shareQrEvaluationsEmail = vi.fn()
vi.mock('../../api/evaluations.api', () => ({
  createQrEvaluationsBatch: (...a: unknown[]) => createQrEvaluationsBatch(...a),
  shareQrEvaluationsEmail: (...a: unknown[]) => shareQrEvaluationsEmail(...a),
}))

async function abrirModalCorreo() {
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
}

/** RQ16 Front — C1 sin destinatario | C2 API falla | C3 200 */
describe('RQ16 unit — Distribución por correo (frontend)', () => {
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

  it('C1: enviar sin destinatario → alerta', async () => {
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    await abrirModalCorreo()
    fireEvent.change(screen.getByPlaceholderText('Destinatario'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))
    expect(window.alert).toHaveBeenCalledWith(
      'Completa correo/asunto y genera QRs antes de enviar.'
    )
    expect(shareQrEvaluationsEmail).not.toHaveBeenCalled()
  })

  it('C2: API/SMTP falla → alerta error', async () => {
    shareQrEvaluationsEmail.mockRejectedValue({
      response: { data: { error: 'Servicio de correo no configurado. Faltan variables SMTP en el backend.' } },
    })
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    await abrirModalCorreo()
    fireEvent.change(screen.getByPlaceholderText('Destinatario'), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Servicio de correo no configurado. Faltan variables SMTP en el backend.'
      )
    })
  })

  it('C3: 200 → alerta enviado', async () => {
    shareQrEvaluationsEmail.mockResolvedValue({ message: 'ok', sentTo: 'a@b.com', totalLinks: 1 })
    renderWithRouter(<AdminQrPage />)
    await screen.findByText(/Selecciona una carrera/i)
    await abrirModalCorreo()
    fireEvent.change(screen.getByPlaceholderText('Destinatario'), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))
    await waitFor(() => {
      expect(shareQrEvaluationsEmail).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Correo enviado correctamente.')
    })
  })
})

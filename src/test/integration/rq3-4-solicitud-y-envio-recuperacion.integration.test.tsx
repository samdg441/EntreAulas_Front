import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import ForgotPassword from '../../features/auth/ForgotPassword'
import { requestPasswordReset } from '../../api/passwordReset'

vi.mock('../../api/passwordReset', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  validateResetToken: vi.fn(),
}))

describe('RQ3.1 + RQ4 — Solicitud y envío de correo de recuperación (integración)', () => {
  beforeEach(() => {
    vi.mocked(requestPasswordReset).mockReset()
  })

  it('monta sin lanzar y muestra el formulario de solicitud', () => {
    renderConSesion(<ForgotPassword />, { route: '/forgot-password' })
    expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument()
  })

  it('con un correo con formato inválido, bloquea el envío y no llama a la API', async () => {
    const user = userEvent.setup()
    renderConSesion(<ForgotPassword />, { route: '/forgot-password' })

    await user.type(screen.getByLabelText(/correo institucional/i), 'usuario@sindominio')
    await user.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }))

    expect(
      await screen.findByText('Por favor, ingresa un correo electrónico válido')
    ).toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it('con un correo válido, solicita el envío y muestra la pantalla de confirmación', async () => {
    const user = userEvent.setup()
    vi.mocked(requestPasswordReset).mockResolvedValue({
      success: true,
      message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación',
    })

    renderConSesion(<ForgotPassword />, { route: '/forgot-password' })
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }))

    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'estudiante@uni.edu' })
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument()
    expect(
      screen.getByText('Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación')
    ).toBeInTheDocument()
  })

  it('si el backend falla, muestra el mensaje de error y se queda en el formulario', async () => {
    const user = userEvent.setup()
    vi.mocked(requestPasswordReset).mockResolvedValue({
      success: false,
      message: 'Demasiadas solicitudes, intenta más tarde',
    })

    renderConSesion(<ForgotPassword />, { route: '/forgot-password' })
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }))

    expect(await screen.findByText('Demasiadas solicitudes, intenta más tarde')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument()
  })
})

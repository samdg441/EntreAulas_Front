import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import ResetPassword from '../../features/auth/ResetPassword'
import { resetPassword, validateResetToken } from '../../api/passwordReset'

vi.mock('../../api/passwordReset', () => ({
  resetPassword: vi.fn(),
  validateResetToken: vi.fn(),
}))

const renderReset = (query: string) =>
  renderConSesion(<ResetPassword />, { route: `/reset-password${query}` })

describe('RQ5 — Restablecimiento de contraseña (integración)', () => {
  beforeEach(() => {
    vi.mocked(validateResetToken).mockReset()
    vi.mocked(resetPassword).mockReset()
  })

  it('sin token o correo en el enlace, muestra "enlace inválido" sin llamar al backend', async () => {
    renderReset('')

    expect(await screen.findByText(/enlace de recuperación es inválido/i)).toBeInTheDocument()
    expect(validateResetToken).not.toHaveBeenCalled()
  })

  it('con token y correo, valida contra el backend y muestra el formulario si el token es válido', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'Token válido' })

    renderReset('?token=tok-123&email=user%40uni.edu')

    expect(validateResetToken).toHaveBeenCalledWith('tok-123', 'user@uni.edu')
    expect(await screen.findByLabelText(/^nueva contraseña$/i)).toBeInTheDocument()
  })

  it('si el backend rechaza el token, muestra el error y ofrece pedir un nuevo enlace', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: false, message: 'El token ha expirado' })

    renderReset('?token=tok-viejo&email=user%40uni.edu')

    expect(await screen.findByText('El token ha expirado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solicitar un nuevo enlace/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/nueva contraseña/i)).not.toBeInTheDocument()
  })

  it('con token válido, una contraseña débil bloquea el envío y no llama a resetPassword', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    const user = userEvent.setup()
    renderReset('?token=tok-123&email=user%40uni.edu')

    await screen.findByLabelText(/^nueva contraseña$/i)
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'corta')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'corta')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))

    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres')
    ).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('con contraseñas que no coinciden, muestra el error de confirmación', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    const user = userEvent.setup()
    renderReset('?token=tok-123&email=user%40uni.edu')

    await screen.findByLabelText(/^nueva contraseña$/i)
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Abcdef2!')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('con una contraseña válida y confirmada, llama a resetPassword y muestra la pantalla de éxito', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    vi.mocked(resetPassword).mockResolvedValue({
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente',
    })
    const user = userEvent.setup()
    renderReset('?token=tok-123&email=user%40uni.edu')

    await screen.findByLabelText(/^nueva contraseña$/i)
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'tok-123', email: 'user@uni.edu', newPassword: 'Abcdef1!' })
      )
    )
    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ir al inicio de sesión/i }))
    expect(screen.getByRole('button', { name: /volver al inicio de sesión/i })).toBeInTheDocument()
  })

  it('muestra el rechazo del servidor, pide la clave y deja ver la contraseña', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    vi.mocked(resetPassword).mockResolvedValueOnce({ success: false, message: 'El enlace ya se usó' })
    const user = userEvent.setup()
    renderReset('?token=tok-123&email=user%40uni.edu')

    await screen.findByLabelText(/^nueva contraseña$/i)
    const formulario = screen.getByLabelText(/^nueva contraseña$/i).closest('form') as HTMLFormElement
    fireEvent.submit(formulario)
    expect(await screen.findByText('La nueva contraseña es requerida')).toBeInTheDocument()
    expect(screen.getByText('Confirma tu contraseña')).toBeInTheDocument()

    const botones = within(formulario).getAllByRole('button')
    await user.click(botones[0])
    await user.click(botones[1])
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(await screen.findByText('El enlace ya se usó')).toBeInTheDocument()

    vi.mocked(resetPassword).mockRejectedValueOnce(new Error('red'))
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(await screen.findByText('Error al actualizar la contraseña')).toBeInTheDocument()
  })
})

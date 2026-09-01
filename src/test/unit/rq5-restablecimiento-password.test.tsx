import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../api/client', () => {
  const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { apiClient, default: apiClient }
})

import { apiClient } from '../../api/client'
import { validateResetToken, resetPassword } from '../../api/passwordReset'
import ForgotPassword from '../../features/auth/ForgotPassword'

const api = apiClient as unknown as Record<'get' | 'post', ReturnType<typeof vi.fn>>
const TOKEN = 'tok-123'
const EMAIL = 'ana@uni.edu'

function renderConToken() {
  return renderWithRouter(<ForgotPassword />, {
    route: `/forgot-password?token=${TOKEN}&email=${EMAIL}`,
    path: '/forgot-password',
    extraRoutes: [{ path: '/login', element: <div>Login</div> }],
  })
}

const actualizarBtn = () => screen.getByRole('button', { name: /actualizar contraseña/i })

beforeEach(() => {
  api.post.mockReset()
  api.get.mockReset()
})

describe('RQ5 — Restablecimiento de contraseña', () => {
  it('C1: validateResetToken con 2xx → { success: true }', async () => {
    api.get.mockResolvedValue({ data: { valid: true } })
    const r = await validateResetToken(TOKEN, EMAIL)
    expect(r.success).toBe(true)
    expect(api.get).toHaveBeenCalledWith(`/api/auth/validate-reset-token/${TOKEN}?email=${EMAIL}`)
  })

  it('C2: validateResetToken con error sin cuerpo → "Token inválido o expirado"', async () => {
    api.get.mockRejectedValue(new Error('boom'))
    const r = await validateResetToken(TOKEN, EMAIL)
    expect(r).toEqual({ success: false, message: 'Token inválido o expirado' })
  })

  it('C3: validateResetToken con response.data.error → ese mensaje', async () => {
    api.get.mockRejectedValue({ response: { data: { error: 'El enlace ya fue usado' } } })
    const r = await validateResetToken(TOKEN, EMAIL)
    expect(r.message).toBe('El enlace ya fue usado')
  })

  it('C4: enlace con token válido → se muestra el formulario con el correo bloqueado', async () => {
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()

    // esperar a que el formulario de reset esté montado por completo
    expect(await screen.findByLabelText('Nueva Contraseña')).toBeInTheDocument()
    const correo = screen.getByLabelText(/correo institucional/i) as HTMLInputElement
    expect(correo.value).toBe(EMAIL)
    expect(correo).toBeDisabled()
  })

  it('C5: token inválido → banner de error y no aparece el formulario de nueva contraseña', async () => {
    api.get.mockRejectedValue({ response: { data: { error: 'Token inválido o expirado' } } })
    renderConToken()

    expect(await screen.findByText('Token inválido o expirado')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument()
  })

  it('C6: contraseña que no cumple las reglas → error inline y NO se llama a reset-password', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()

    await user.type(await screen.findByLabelText('Nueva Contraseña'), 'minuscula1!')
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'minuscula1!')
    await user.click(actualizarBtn())

    expect(await screen.findByText(/al menos una letra mayúscula/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C7: confirmación distinta → "Las contraseñas no coinciden" y NO se llama a reset-password', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()

    await user.type(await screen.findByLabelText('Nueva Contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'Password124!')
    await user.click(actualizarBtn())

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C8: contraseña válida → POST /api/auth/reset-password y pantalla de éxito', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    api.post.mockResolvedValue({ data: {} })
    renderConToken()

    await user.type(await screen.findByLabelText('Nueva Contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'Password123!')
    await user.click(actualizarBtn())

    expect(
      await screen.findByText(/tu contraseña ha sido actualizada exitosamente/i),
    ).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: TOKEN,
      email: EMAIL,
      newPassword: 'Password123!',
      confirmPassword: 'Password123!',
    })
  })

  it('C9: resetPassword con error del backend → success:false con el mensaje de la API', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'El token expiró' } } })
    const r = await resetPassword({
      token: TOKEN,
      email: EMAIL,
      newPassword: 'Password123!',
      confirmPassword: 'Password123!',
    })
    expect(r).toEqual({ success: false, message: 'El token expiró' })
  })

  it('C10: contraseña demasiado corta → "al menos 8 caracteres"', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()
    await user.type(await screen.findByLabelText('Nueva Contraseña'), 'Ab1!')
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'Ab1!')
    await user.click(actualizarBtn())
    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([
    ['ABC12345!', /al menos una letra minúscula/i],
    ['abc12345!', /al menos una letra mayúscula/i],
    ['Password!!', /al menos un número/i],
    ['Password12', /al menos un carácter especial/i],
  ])('C11: regla de contraseña — %s', async (pwd, mensaje) => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()
    await user.type(await screen.findByLabelText('Nueva Contraseña'), pwd)
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), pwd)
    await user.click(actualizarBtn())
    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C12: reset con contraseña válida pero la API rechaza → banner de error, sin pantalla de éxito', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { valid: true } })
    api.post.mockRejectedValue({ response: { data: { error: 'El enlace expiró' } } })
    renderConToken()
    await user.type(await screen.findByLabelText('Nueva Contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'Password123!')
    await user.click(actualizarBtn())
    expect(await screen.findByText('El enlace expiró')).toBeInTheDocument()
    expect(screen.queryByText(/actualizada exitosamente/i)).not.toBeInTheDocument()
  })

  it('C12b: campos de contraseña vacíos → "requerida" y "Confirma tu contraseña"', async () => {
    api.get.mockResolvedValue({ data: { valid: true } })
    renderConToken()
    const form = (await screen.findByLabelText('Nueva Contraseña')).closest('form') as HTMLFormElement
    fireEvent.submit(form)
    expect(await screen.findByText(/la nueva contraseña es requerida/i)).toBeInTheDocument()
    expect(screen.getByText(/confirma tu contraseña/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C12c: resetPassword — mensaje por defecto y .message del backend', async () => {
    api.post.mockRejectedValueOnce(new Error('offline'))
    expect((await resetPassword({ token: TOKEN, email: EMAIL, newPassword: 'x', confirmPassword: 'x' })).message).toBe(
      'Error al actualizar la contraseña',
    )
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Token de un solo uso' } } })
    expect((await resetPassword({ token: TOKEN, email: EMAIL, newPassword: 'x', confirmPassword: 'x' })).message).toBe(
      'Token de un solo uso',
    )
  })

  it('C13: sin token en la URL → se queda en el paso de solicitud (no valida token)', async () => {
    renderWithRouter(<ForgotPassword />, {
      route: '/forgot-password',
      path: '/forgot-password',
      extraRoutes: [{ path: '/login', element: <div>Login</div> }],
    })
    expect(
      await screen.findByRole('button', { name: /enviar enlace de recuperación/i }),
    ).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument()
  })
})

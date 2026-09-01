/**
 * RQ4 — Envío del correo de recuperación.
 * Ejercita: requestPasswordReset (todas las ramas del manejo de respuesta) y
 * la pantalla de confirmación de <ForgotPassword/> con su botón de retorno al login.
 * Único límite mockeado: apiClient (capa axios).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../api/client', () => {
  const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { apiClient, default: apiClient }
})

import { apiClient } from '../../api/client'
import { requestPasswordReset } from '../../api/passwordReset'
import ForgotPassword from '../../features/auth/ForgotPassword'

const api = apiClient as unknown as Record<'get' | 'post', ReturnType<typeof vi.fn>>

beforeEach(() => {
  api.post.mockReset()
  api.get.mockReset()
})

describe('RQ4 — Envío de correo de recuperación', () => {
  it('C1: respuesta 2xx → success:true con el mensaje neutro de confirmación', async () => {
    api.post.mockResolvedValue({ data: { ok: true } })
    const r = await requestPasswordReset({ email: 'ana@uni.edu' })
    expect(r).toEqual({
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
      data: { ok: true },
    })
    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'ana@uni.edu' })
  })

  it('C2: error con response.data.error → se propaga ese mensaje', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'Correo no institucional' } } })
    const r = await requestPasswordReset({ email: 'x@gmail.com' })
    expect(r).toEqual({ success: false, message: 'Correo no institucional' })
  })

  it('C3: error con response.data.message (sin .error) → se usa .message', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Límite de envíos alcanzado' } } })
    const r = await requestPasswordReset({ email: 'ana@uni.edu' })
    expect(r.message).toBe('Límite de envíos alcanzado')
  })

  it('C4: error sin cuerpo → mensaje por defecto', async () => {
    api.post.mockRejectedValue(new Error('network down'))
    const r = await requestPasswordReset({ email: 'ana@uni.edu' })
    expect(r.message).toBe('Error al enviar la solicitud de recuperación')
  })

  it('C5: en la UI, tras el 2xx se muestra la confirmación y el botón vuelve al login', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: {} })
    renderWithRouter(<ForgotPassword />, {
      route: '/forgot-password',
      path: '/forgot-password',
      extraRoutes: [{ path: '/login', element: <div>Pantalla de login</div> }],
    })

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }))

    expect(await screen.findByRole('heading', { name: /proceso completado/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ir al inicio de sesión/i }))
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })
})

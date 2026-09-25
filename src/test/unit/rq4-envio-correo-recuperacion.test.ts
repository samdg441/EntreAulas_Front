import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestPasswordReset } from '../../api/passwordReset'
import { apiClient } from '../../api/client'

vi.mock('../../api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('RQ4 — Envío de correo de recuperación de contraseña', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('llama al endpoint de forgot-password con el correo del usuario', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

    await requestPasswordReset({ email: 'user@uni.edu' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'user@uni.edu' })
  })

  it('en éxito, usa el mensaje del backend cuando lo envía', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: 'Correo de recuperación enviado' },
    })

    const resultado = await requestPasswordReset({ email: 'user@uni.edu' })

    expect(resultado).toEqual({ success: true, message: 'Correo de recuperación enviado' })
  })

  it('en éxito sin mensaje del backend, usa el mensaje genérico de seguridad (no revela si el correo existe)', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

    const resultado = await requestPasswordReset({ email: 'no-existe@uni.edu' })

    expect(resultado.success).toBe(true)
    expect(resultado.message).toBe(
      'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
    )
  })

  it('ante un fallo de transporte/backend, reporta success:false con el mensaje de error', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { data: { error: 'Demasiadas solicitudes, intenta más tarde' } },
    })

    const resultado = await requestPasswordReset({ email: 'user@uni.edu' })

    expect(resultado).toEqual({
      success: false,
      message: 'Demasiadas solicitudes, intenta más tarde',
    })
  })

  it('ante un error sin detalle del backend, usa el mensaje de fallback', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('timeout'))

    const resultado = await requestPasswordReset({ email: 'user@uni.edu' })

    expect(resultado).toEqual({
      success: false,
      message: 'Error al enviar la solicitud de recuperación',
    })
  })
})

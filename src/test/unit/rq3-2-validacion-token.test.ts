import { describe, it, expect, vi, beforeEach } from 'vitest'
import { debeValidarToken } from '../../features/auth/password-reset-flow'
import { validateResetToken } from '../../api/passwordReset'
import { apiClient } from '../../api/client'

vi.mock('../../api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('RQ3.2 — Validación de token', () => {
  describe('debeValidarToken', () => {
    it('valida solo cuando la URL trae token y correo', () => {
      expect(debeValidarToken('tok-123', 'a@b.com')).toBe(true)
    })

    it('no valida si falta el token', () => {
      expect(debeValidarToken(null, 'a@b.com')).toBe(false)
    })

    it('no valida si falta el correo', () => {
      expect(debeValidarToken('tok-123', null)).toBe(false)
    })

    it('no valida si faltan ambos', () => {
      expect(debeValidarToken(null, null)).toBe(false)
    })
  })

  describe('validateResetToken', () => {
    beforeEach(() => {
      vi.mocked(apiClient.get).mockReset()
    })

    it('consulta el endpoint con el token en la ruta y el correo como query param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { message: 'Token válido' } })

      await validateResetToken('tok con espacios', 'user@uni.edu')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/auth/validate-reset-token/tok%20con%20espacios',
        { params: { email: 'user@uni.edu' } }
      )
    })

    it('reporta éxito con el mensaje del backend cuando el token es válido', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { message: 'Token válido' } })

      const resultado = await validateResetToken('tok-123', 'user@uni.edu')

      expect(resultado).toEqual({ success: true, message: 'Token válido' })
    })

    it('usa un mensaje de éxito por defecto si el backend no envía uno', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: {} })

      expect((await validateResetToken('tok-123', 'user@uni.edu')).message).toBe('Token válido')
    })

    it('reporta fallo con el mensaje del backend cuando el token es inválido o expiró', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { data: { error: 'El token ha expirado' } },
      })

      const resultado = await validateResetToken('tok-vencido', 'user@uni.edu')

      expect(resultado).toEqual({ success: false, message: 'El token ha expirado' })
    })

    it('usa un mensaje de fallo genérico si el backend no da detalle del error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('network down'))

      expect((await validateResetToken('tok-x', 'user@uni.edu')).message).toBe(
        'Token inválido o expirado'
      )
    })
  })
})

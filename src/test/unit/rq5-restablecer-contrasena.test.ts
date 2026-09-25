import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validarFormularioReset } from '../../features/auth/password-reset-flow'
import { resetPassword } from '../../api/passwordReset'
import { apiClient } from '../../api/client'

vi.mock('../../api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('RQ5 — Restablecimiento de contraseña', () => {
  describe('validarFormularioReset', () => {
    it('exige la nueva contraseña cuando el campo está vacío', () => {
      expect(validarFormularioReset('', 'algo').newPassword).toBe('La nueva contraseña es requerida')
    })

    it('exige que la nueva contraseña cumpla la política (delegada en validatePasswordStrength)', () => {
      expect(validarFormularioReset('corta', 'corta').newPassword).toBe(
        'La contraseña debe tener al menos 8 caracteres'
      )
    })

    it('exige confirmar la contraseña cuando el campo está vacío', () => {
      expect(validarFormularioReset('Abcdef1!', '').confirmPassword).toBe('Confirma tu contraseña')
    })

    it('rechaza cuando la confirmación no coincide con la nueva contraseña', () => {
      expect(validarFormularioReset('Abcdef1!', 'Otra123!').confirmPassword).toBe(
        'Las contraseñas no coinciden'
      )
    })

    it('no devuelve errores cuando la contraseña es válida y la confirmación coincide', () => {
      expect(validarFormularioReset('Abcdef1!', 'Abcdef1!')).toEqual({})
    })

    it('reporta ambos errores a la vez si la contraseña es débil y además no coincide', () => {
      const errores = validarFormularioReset('corta', 'otracosa')
      expect(errores.newPassword).toBe('La contraseña debe tener al menos 8 caracteres')
      expect(errores.confirmPassword).toBe('Las contraseñas no coinciden')
    })
  })

  describe('resetPassword', () => {
    beforeEach(() => {
      vi.mocked(apiClient.post).mockReset()
    })

    it('envía token, correo y nueva contraseña al endpoint de reset', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

      await resetPassword({ token: 'tok-123', email: 'user@uni.edu', newPassword: 'Abcdef1!' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'tok-123',
        email: 'user@uni.edu',
        newPassword: 'Abcdef1!',
      })
    })

    it('en éxito, confirma la actualización con el mensaje del backend o uno por defecto', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
      const resultado = await resetPassword({ token: 't', email: 'e@u.edu', newPassword: 'Abcdef1!' })
      expect(resultado).toEqual({
        success: true,
        message: 'Tu contraseña ha sido actualizada exitosamente',
      })
    })

    it('ante un token vencido o inválido, reporta el error del backend', async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { error: 'El enlace ya fue usado o expiró' } },
      })

      const resultado = await resetPassword({ token: 't', email: 'e@u.edu', newPassword: 'Abcdef1!' })

      expect(resultado).toEqual({ success: false, message: 'El enlace ya fue usado o expiró' })
    })

    it('ante un fallo sin detalle, usa el mensaje de fallback', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('boom'))

      expect((await resetPassword({ token: 't', email: 'e@u.edu', newPassword: 'Abcdef1!' })).message).toBe(
        'Error al actualizar la contraseña'
      )
    })
  })
})

import { apiClient } from './client'

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  email: string
  newPassword: string
  confirmPassword: string
}

export interface PasswordResetResponse {
  success: boolean
  message: string
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: string; message?: string } } }
  return err.response?.data?.error || err.response?.data?.message || fallback
}

export async function requestPasswordReset(
  data: ForgotPasswordRequest
): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.post('/api/auth/forgot-password', data)
    return {
      success: true,
      message:
        response.data?.message ||
        'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación',
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: extractErrorMessage(error, 'Error al enviar la solicitud de recuperación'),
    }
  }
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.post('/api/auth/reset-password', data)
    return {
      success: true,
      message: response.data?.message || 'Tu contraseña ha sido actualizada exitosamente',
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: extractErrorMessage(error, 'Error al actualizar la contraseña'),
    }
  }
}

export async function validateResetToken(
  token: string,
  email: string
): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.get(
      `/api/auth/validate-reset-token/${encodeURIComponent(token)}`,
      { params: { email } }
    )
    return {
      success: true,
      message: response.data?.message || 'Token válido',
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: extractErrorMessage(error, 'Token inválido o expirado'),
    }
  }
}

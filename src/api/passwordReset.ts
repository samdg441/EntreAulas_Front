import { apiClient } from './client'
import { getApiErrorMessage } from '../lib/apiError'

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  email: string
  newPassword: string
}

export interface PasswordResetResponse {
  success: boolean
  message: string
  data?: unknown
}

// Función para solicitar reset de contraseña
export async function requestPasswordReset(data: ForgotPasswordRequest): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.post('/api/auth/forgot-password', data)

    return {
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
      data: response.data
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Error al enviar la solicitud de recuperación')
    }
  }
}

// Función para resetear la contraseña
export async function resetPassword(data: ResetPasswordRequest): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.post('/api/auth/reset-password', data)

    return {
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente',
      data: response.data
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Error al actualizar la contraseña')
    }
  }
}

// Función para validar token de reset
export async function validateResetToken(token: string, email: string): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.get(
      `/api/auth/validate-reset-token/${encodeURIComponent(token)}`,
      { params: { email } }
    )

    return {
      success: true,
      message: 'Token válido',
      data: response.data
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Token inválido o expirado')
    }
  }
}

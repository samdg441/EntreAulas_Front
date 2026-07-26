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
  data?: any
}

// Función para solicitar reset de contraseña
export async function requestPasswordReset(data: ForgotPasswordRequest): Promise<PasswordResetResponse> {
  try {
    console.log('🔐 Solicitando reset de contraseña para:', data.email)
    
    const response = await apiClient.post('/api/auth/forgot-password', data)
    
    console.log('✅ Reset solicitado exitosamente:', response.data)
    return {
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ Error al solicitar reset de contraseña:', error)
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Error al enviar la solicitud de recuperación'
    
    return {
      success: false,
      message: errorMessage
    }
  }
}

// Función para resetear la contraseña
export async function resetPassword(data: ResetPasswordRequest): Promise<PasswordResetResponse> {
  try {
    console.log('🔐 Reseteando contraseña para:', data.email)
    
    const response = await apiClient.post('/api/auth/reset-password', data)
    
    console.log('✅ Contraseña reseteada exitosamente:', response.data)
    return {
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente',
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ Error al resetear contraseña:', error)
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Error al actualizar la contraseña'
    
    return {
      success: false,
      message: errorMessage
    }
  }
}

// Función para validar token de reset
export async function validateResetToken(token: string, email: string): Promise<PasswordResetResponse> {
  try {
    console.log('🔐 Validando token de reset:', token, 'para:', email)
    
    const response = await apiClient.get(`/api/auth/validate-reset-token/${token}?email=${email}`)
    
    console.log('✅ Token validado exitosamente:', response.data)
    return {
      success: true,
      message: 'Token válido',
      data: response.data
    }
  } catch (error: any) {
    console.error('❌ Error al validar token:', error)
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Token inválido o expirado'
    
    return {
      success: false,
      message: errorMessage
    }
  }
}

import { isValidEmail, validatePasswordStrength } from '../../lib/validation'

/** Solo se valida el token contra el backend si la URL trae token y email. */
export function debeValidarToken(token: string | null, email: string | null): boolean {
  return Boolean(token && email)
}

export interface RequestFormErrors {
  email?: string
}

export function validarFormularioRequest(email: string): RequestFormErrors {
  if (!email) {
    return { email: 'El correo electrónico es requerido' }
  }
  if (!isValidEmail(email)) {
    return { email: 'Por favor, ingresa un correo electrónico válido' }
  }
  return {}
}

export interface ResetFormErrors {
  newPassword?: string
  confirmPassword?: string
}

export function validarFormularioReset(newPassword: string, confirmPassword: string): ResetFormErrors {
  const errors: ResetFormErrors = {}

  if (!newPassword) {
    errors.newPassword = 'La nueva contraseña es requerida'
  } else {
    const policy = validatePasswordStrength(newPassword)
    if (!policy.valid && policy.message) {
      errors.newPassword = policy.message
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña'
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
  }

  return errors
}

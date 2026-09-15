const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

export interface PasswordPolicyResult {
  valid: boolean
  message: string | null
}

export function validatePasswordStrength(password: string): PasswordPolicyResult {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula' }
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula' }
  }
  if (!hasNumber) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' }
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'La contraseña debe contener al menos un carácter especial' }
  }
  return { valid: true, message: null }
}

import { describe, it, expect } from 'vitest'
import { isValidEmail, validatePasswordStrength } from '../../lib/validation'

describe('lib/validation — isValidEmail', () => {
  it('acepta un correo con formato válido', () => {
    expect(isValidEmail('ana@uni.edu')).toBe(true)
  })

  it('rechaza un correo vacío', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rechaza un correo sin dominio con punto', () => {
    expect(isValidEmail('a@b')).toBe(false)
  })

  it('rechaza un correo sin @', () => {
    expect(isValidEmail('no-es-correo')).toBe(false)
  })

  it('rechaza un correo con espacios', () => {
    expect(isValidEmail('a b@uni.edu')).toBe(false)
  })
})

describe('lib/validation — validatePasswordStrength', () => {
  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(validatePasswordStrength('Password123!')).toEqual({ valid: true, message: null })
  })

  it('rechaza una contraseña demasiado corta', () => {
    const r = validatePasswordStrength('Ab1!')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/al menos 8 caracteres/i)
  })

  it('rechaza una contraseña sin mayúscula', () => {
    const r = validatePasswordStrength('password123!')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/letra mayúscula/i)
  })

  it('rechaza una contraseña sin minúscula', () => {
    const r = validatePasswordStrength('PASSWORD123!')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/letra minúscula/i)
  })

  it('rechaza una contraseña sin número', () => {
    const r = validatePasswordStrength('Password!!')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/al menos un número/i)
  })

  it('rechaza una contraseña sin carácter especial', () => {
    const r = validatePasswordStrength('Password12')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/carácter especial/i)
  })
})

import { describe, it, expect } from 'vitest'
import {
  debeValidarToken,
  validarFormularioRequest,
  validarFormularioReset,
} from '../../features/auth/password-reset-flow'

describe('features/auth/password-reset-flow — debeValidarToken', () => {
  it('true cuando hay token y email', () => {
    expect(debeValidarToken('tok-123', 'ana@uni.edu')).toBe(true)
  })

  it('false cuando falta el token', () => {
    expect(debeValidarToken(null, 'ana@uni.edu')).toBe(false)
  })

  it('false cuando falta el email', () => {
    expect(debeValidarToken('tok-123', null)).toBe(false)
  })

  it('false cuando faltan ambos', () => {
    expect(debeValidarToken(null, null)).toBe(false)
  })
})

describe('features/auth/password-reset-flow — validarFormularioRequest', () => {
  it('exige el correo si está vacío', () => {
    expect(validarFormularioRequest('')).toEqual({ email: 'El correo electrónico es requerido' })
  })

  it('exige formato válido', () => {
    expect(validarFormularioRequest('a@b')).toEqual({
      email: 'Por favor, ingresa un correo electrónico válido',
    })
  })

  it('sin errores si el correo es válido', () => {
    expect(validarFormularioRequest('ana@uni.edu')).toEqual({})
  })
})

describe('features/auth/password-reset-flow — validarFormularioReset', () => {
  it('exige la nueva contraseña si está vacía', () => {
    const r = validarFormularioReset('', '')
    expect(r.newPassword).toBe('La nueva contraseña es requerida')
    expect(r.confirmPassword).toBe('Confirma tu contraseña')
  })

  it('propaga el mensaje de política de password inválida', () => {
    const r = validarFormularioReset('minuscula1!', 'minuscula1!')
    expect(r.newPassword).toMatch(/letra mayúscula/i)
  })

  it('exige confirmación si falta', () => {
    const r = validarFormularioReset('Password123!', '')
    expect(r.confirmPassword).toBe('Confirma tu contraseña')
  })

  it('detecta contraseñas que no coinciden', () => {
    const r = validarFormularioReset('Password123!', 'Password124!')
    expect(r.confirmPassword).toBe('Las contraseñas no coinciden')
  })

  it('sin errores si todo es válido y coincide', () => {
    expect(validarFormularioReset('Password123!', 'Password123!')).toEqual({})
  })
})

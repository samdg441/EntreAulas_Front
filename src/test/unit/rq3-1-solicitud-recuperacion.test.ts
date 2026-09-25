import { describe, it, expect } from 'vitest'
import { validarFormularioRequest } from '../../features/auth/password-reset-flow'

describe('RQ3.1 — Solicitud de correo de recuperación', () => {
  it('exige el correo cuando el campo está vacío', () => {
    expect(validarFormularioRequest('')).toEqual({ email: 'El correo electrónico es requerido' })
  })

  it('rechaza un correo con formato inválido', () => {
    expect(validarFormularioRequest('no-es-un-correo')).toEqual({
      email: 'Por favor, ingresa un correo electrónico válido',
    })
  })

  it('rechaza un correo sin dominio', () => {
    expect(validarFormularioRequest('usuario@')).toEqual({
      email: 'Por favor, ingresa un correo electrónico válido',
    })
  })

  it('acepta un correo institucional válido sin errores', () => {
    expect(validarFormularioRequest('estudiante@uni.edu.co')).toEqual({})
  })
})

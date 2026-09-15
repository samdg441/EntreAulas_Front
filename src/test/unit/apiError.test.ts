import { describe, it, expect } from 'vitest'
import { getApiErrorMessage } from '../../lib/apiError'

describe('lib/apiError — getApiErrorMessage', () => {
  it('usa response.data.error cuando está presente', () => {
    const error = { response: { data: { error: 'El correo ya está registrado' } } }
    expect(getApiErrorMessage(error, 'fallback')).toBe('El correo ya está registrado')
  })

  it('usa response.data.message cuando no hay .error', () => {
    const error = { response: { data: { message: 'Límite de envíos alcanzado' } } }
    expect(getApiErrorMessage(error, 'fallback')).toBe('Límite de envíos alcanzado')
  })

  it('prioriza .error sobre .message cuando ambos existen', () => {
    const error = { response: { data: { error: 'A', message: 'B' } } }
    expect(getApiErrorMessage(error, 'fallback')).toBe('A')
  })

  it('devuelve el fallback si no hay response', () => {
    expect(getApiErrorMessage(new Error('network down'), 'fallback')).toBe('fallback')
  })

  it('devuelve el fallback si response.data está vacío', () => {
    expect(getApiErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback')
  })

  it('devuelve el fallback para errores no-objeto', () => {
    expect(getApiErrorMessage('boom', 'fallback')).toBe('fallback')
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage(undefined, 'fallback')).toBe('fallback')
  })
})

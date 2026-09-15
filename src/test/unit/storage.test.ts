import { describe, it, expect, beforeEach } from 'vitest'
import { authStorage } from '../../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('lib/storage — authStorage', () => {
  it('guarda y lee el token', () => {
    authStorage.setToken('jwt-123')
    expect(authStorage.getToken()).toBe('jwt-123')
  })

  it('devuelve null si no hay token', () => {
    expect(authStorage.getToken()).toBeNull()
  })

  it('guarda y lee el usuario como objeto', () => {
    authStorage.setUser({ id: '1', nombre: 'Ana' })
    expect(authStorage.getUser()).toEqual({ id: '1', nombre: 'Ana' })
  })

  it('devuelve null si no hay usuario guardado', () => {
    expect(authStorage.getUser()).toBeNull()
  })

  it('clear() borra token y usuario', () => {
    authStorage.setToken('jwt-123')
    authStorage.setUser({ id: '1' })
    authStorage.clear()
    expect(authStorage.getToken()).toBeNull()
    expect(authStorage.getUser()).toBeNull()
  })

  it('consumeRedirectTo lee y borra en una sola operación', () => {
    authStorage.setRedirectTo('/qr-evaluacion/abc')
    expect(authStorage.consumeRedirectTo()).toBe('/qr-evaluacion/abc')
    expect(authStorage.getRedirectTo()).toBeNull()
  })

  it('consumeRedirectTo devuelve null si no había nada guardado', () => {
    expect(authStorage.consumeRedirectTo()).toBeNull()
  })
})

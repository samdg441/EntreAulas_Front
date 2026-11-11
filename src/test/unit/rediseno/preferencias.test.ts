/**
 * Preferencias de visualización (modo noche, idioma y tamaño de texto) — lógica pura.
 * Patrón AAA, principios FIRST (rápidas, independientes, repetibles) y un Fake de Storage en memoria.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  CLAVE_PREFERENCIAS,
  PREFERENCIAS_POR_DEFECTO,
  aplicarPreferencias,
  esTemaOscuro,
  guardarPreferencias,
  leerPreferencias,
  normalizarPreferencias,
} from '../../../preferencias/preferencias'

class AlmacenFalso implements Pick<Storage, 'getItem' | 'setItem'> {
  datos = new Map<string, string>()
  getItem = (k: string) => this.datos.get(k) ?? null
  setItem = (k: string, v: string) => void this.datos.set(k, v)
}

describe('normalizarPreferencias', () => {
  it('con un objeto vacío devuelve los valores por defecto', () => {
    expect(normalizarPreferencias({})).toEqual(PREFERENCIAS_POR_DEFECTO)
  })

  it.each([null, undefined, 'texto', 42, []])('con %j (no es un objeto válido) usa los valores por defecto', (crudo) => {
    expect(normalizarPreferencias(crudo)).toEqual(PREFERENCIAS_POR_DEFECTO)
  })

  it('conserva los valores válidos y reemplaza solo los inválidos', () => {
    const resultado = normalizarPreferencias({ tema: 'oscuro', idioma: 'fr', tamano: 'xlarge' })

    expect(resultado).toEqual({ tema: 'oscuro', idioma: 'es', tamano: 'xlarge' })
  })
})

describe('leerPreferencias y guardarPreferencias', () => {
  it('guarda y recupera las preferencias (ida y vuelta)', () => {
    const almacen = new AlmacenFalso()
    const prefs = { tema: 'oscuro', idioma: 'en', tamano: 'large' } as const

    guardarPreferencias(prefs, almacen)

    expect(leerPreferencias(almacen)).toEqual(prefs)
    expect(JSON.parse(almacen.datos.get(CLAVE_PREFERENCIAS)!)).toEqual(prefs)
  })

  it('un JSON dañado no rompe la lectura: vuelve a los valores por defecto', () => {
    const almacen = new AlmacenFalso()
    almacen.datos.set(CLAVE_PREFERENCIAS, '{no es json')

    expect(leerPreferencias(almacen)).toEqual(PREFERENCIAS_POR_DEFECTO)
  })

  it('si el almacenamiento lanza (modo privado) guardar no propaga el error', () => {
    const roto = { setItem: vi.fn(() => { throw new Error('cuota llena') }) }

    expect(() => guardarPreferencias(PREFERENCIAS_POR_DEFECTO, roto)).not.toThrow()
    expect(roto.setItem).toHaveBeenCalledOnce()
  })
})

describe('esTemaOscuro', () => {
  it.each([
    ['oscuro', false, true],
    ['oscuro', true, true],
    ['claro', true, false],
    ['claro', false, false],
    ['sistema', true, true],
    ['sistema', false, false],
  ] as const)('tema %s con sistema oscuro=%s → %s (tabla de decisión)', (tema, sistema, esperado) => {
    expect(esTemaOscuro(tema, sistema)).toBe(esperado)
  })
})

describe('aplicarPreferencias', () => {
  it('refleja tema, idioma y tamaño en el elemento raíz', () => {
    const raiz = document.createElement('html')

    aplicarPreferencias({ tema: 'oscuro', idioma: 'en', tamano: 'large' }, false, raiz)

    expect(raiz.classList.contains('dark')).toBe(true)
    expect(raiz.lang).toBe('en')
    expect(raiz.getAttribute('data-text-size')).toBe('large')
  })

  it('el tamaño estándar quita el atributo y el tema claro quita la clase dark', () => {
    const raiz = document.createElement('html')
    raiz.classList.add('dark')
    raiz.setAttribute('data-text-size', 'xlarge')

    aplicarPreferencias({ tema: 'claro', idioma: 'es', tamano: 'standard' }, true, raiz)

    expect(raiz.classList.contains('dark')).toBe(false)
    expect(raiz.hasAttribute('data-text-size')).toBe(false)
  })
})

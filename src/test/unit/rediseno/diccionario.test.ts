import { describe, expect, it } from 'vitest'
import { DICCIONARIO, existeClave, traducir, type Clave } from '../../../i18n/diccionario'

const marcadores = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
const claves = Object.keys(DICCIONARIO) as Clave[]

describe('Diccionario ES/EN', () => {
  it('toda clave tiene texto en español y en inglés', () => {
    const vacias = claves.filter((c) => !DICCIONARIO[c].es.trim() || !DICCIONARIO[c].en.trim())

    expect(vacias).toEqual([])
  })

  it('los dos idiomas usan los mismos marcadores {variable}', () => {
    const distintos = claves.filter((c) => marcadores(DICCIONARIO[c].es).join() !== marcadores(DICCIONARIO[c].en).join())

    expect(distintos).toEqual([])
  })

  it('el texto en inglés no es una copia del español salvo marca o nombre propio', () => {
    const iguales = claves.filter((c) => DICCIONARIO[c].es === DICCIONARIO[c].en)

    // Nombres propios y la plantilla del saludo, que no cambian.
    expect(iguales.sort()).toEqual(['app.nombre', 'app.universidad', 'coord.saludo'].sort())
  })
})

describe('traducir', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(traducir('es', 'nav.inicio')).toBe('Inicio')
    expect(traducir('en', 'nav.inicio')).toBe('Home')
  })

  it('sustituye los marcadores y deja intactos los que no recibe', () => {
    expect(traducir('en', 'com.pagina', { pagina: 2, total: 5 })).toBe('Page 2 of 5')
    expect(traducir('es', 'com.pagina', { pagina: 2 })).toBe('Página 2 de {total}')
  })

  it('con una clave inexistente devuelve la propia clave (no rompe la pantalla)', () => {
    expect(traducir('en', 'no.existe' as Clave)).toBe('no.existe')
  })

  it('existeClave distingue claves válidas de otras', () => {
    expect(existeClave('rol.admin')).toBe(true)
    expect(existeClave('rol.inventado')).toBe(false)
  })
})

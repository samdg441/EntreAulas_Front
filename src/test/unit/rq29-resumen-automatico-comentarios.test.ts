import { describe, expect, it } from 'vitest'
import {
  decidirMontajeReportes,
  decidirVistaResumen,
  destinoTras401,
  endpointPorRol,
  esAvisoSinRespuestas,
  hayResumenParaPintar,
  mensajeErrorResumen,
} from '../helpers/resumen-ia'

/**
 * RQ29 — Generar resumen automático de comentarios (frontend)
 *
 *  3-4  Sin sesión o 401 → /login
 *  5    Endpoint según rol (by-professor / by-career / by-faculty)
 *  7-8  GET 403/500 → bloque de error, no pinta resumen
 *  9-10 200 sin textos ni fallback → aviso ámbar
 *  9-11 200 con textos o fallback cuantitativo → pinta resumen y temas
 */

const resumenGemini = {
  textsCount: 8,
  summary: 'Los estudiantes destacan claridad y piden más ejemplos.',
  topics: ['claridad', 'ejemplos'],
  analysisSource: 'open_text' as const,
}

const fallbackCuantitativo = {
  textsCount: 0,
  ratingsCount: 12,
  summary: 'Resumen a partir de 12 valoraciones. Promedio 4.20/5.',
  topics: ['promedio 4.20/5', 'sin respuestas abiertas'],
  analysisSource: 'quantitative_fallback' as const,
}

const sinDatos = {
  textsCount: 0,
  summary: 'No se encontraron respuestas abiertas para este profesor.',
  topics: [] as string[],
}

class RQ29ResumenAutomaticoComentarios {
  N4_sinSesionVaALogin() {
    expect(decidirMontajeReportes(null)).toBe('login')
    expect(decidirMontajeReportes(undefined)).toBe('login')
    expect(decidirVistaResumen({ haySesion: false })).toBe('login')
    expect(destinoTras401(401)).toBe('login')
    expect(
      decidirVistaResumen({
        haySesion: true,
        status: 401,
        result: resumenGemini,
      })
    ).toBe('login')
  }

  N3_conSesionMontaReportes() {
    expect(
      decidirMontajeReportes({ id: 'u1', tipo_usuario: 'profesor' })
    ).toBe('reportes')
  }

  N5_endpointSegunRol() {
    expect(endpointPorRol('teacher')).toBe('by-professor')
    expect(endpointPorRol('coordinator')).toBe('by-career')
    expect(endpointPorRol('decano')).toBe('by-faculty')
    expect(endpointPorRol('admin')).toBe('by-professor')
  }

  N8_getFallaMuestraError() {
    for (const status of [403, 500]) {
      expect(
        decidirVistaResumen({ haySesion: true, status })
      ).toBe('error')
    }
    expect(destinoTras401(403)).toBe('seguir')
    expect(destinoTras401(500)).toBe('seguir')
    expect(
      mensajeErrorResumen({ response: { data: { error: 'Permisos insuficientes' }, status: 403 } })
    ).toBe('Permisos insuficientes')
    expect(mensajeErrorResumen({ message: 'Network Error' })).toBe('Network Error')
    expect(mensajeErrorResumen(null)).toBe('No se pudo generar el resumen automáticamente')
  }

  N10_avisoSinRespuestas() {
    expect(esAvisoSinRespuestas(sinDatos)).toBe(true)
    expect(hayResumenParaPintar(sinDatos)).toBe(false)
    expect(
      decidirVistaResumen({ haySesion: true, status: 200, result: sinDatos })
    ).toBe('aviso-sin-respuestas')
  }

  N11_pintaResumenYTemas() {
    expect(hayResumenParaPintar(resumenGemini)).toBe(true)
    expect(esAvisoSinRespuestas(resumenGemini)).toBe(false)
    expect(
      decidirVistaResumen({ haySesion: true, status: 200, result: resumenGemini })
    ).toBe('pintar')
    expect(resumenGemini.summary.length).toBeGreaterThan(10)
    expect(resumenGemini.topics).toEqual(['claridad', 'ejemplos'])
  }

  N11_pintaFallbackCuantitativo() {
    expect(hayResumenParaPintar(fallbackCuantitativo)).toBe(true)
    expect(esAvisoSinRespuestas(fallbackCuantitativo)).toBe(false)
    expect(
      decidirVistaResumen({ haySesion: true, status: 200, result: fallbackCuantitativo })
    ).toBe('pintar')
    expect(fallbackCuantitativo.analysisSource).toBe('quantitative_fallback')
    expect(fallbackCuantitativo.ratingsCount).toBe(12)
  }

  FALLA_N4_sinSesionSeEsperaPintar() {
    expect(decidirVistaResumen({ haySesion: false, result: resumenGemini })).toBe('pintar')
  }

  FALLA_N8_errorSeEsperaPintar() {
    expect(decidirVistaResumen({ haySesion: true, status: 500 })).toBe('pintar')
  }

  FALLA_N10_sinDatosSeEsperaPintar() {
    expect(decidirVistaResumen({ haySesion: true, status: 200, result: sinDatos })).toBe('pintar')
  }
}

const pruebas = new RQ29ResumenAutomaticoComentarios()

describe('RQ29 — Generar resumen automático de comentarios (frontend)', () => {
  it('Nodo 3-4: sin sesión o 401 → /login', () => pruebas.N4_sinSesionVaALogin())
  it('Nodo 3: con sesión monta reportes', () => pruebas.N3_conSesionMontaReportes())
  it('Nodo 5: endpoint según rol', () => pruebas.N5_endpointSegunRol())
  it('Nodo 7-8: GET 403/500 → error, no pinta', () => pruebas.N8_getFallaMuestraError())
  it('Nodo 9-10: 200 sin textos → aviso sin respuestas', () => pruebas.N10_avisoSinRespuestas())
  it('Nodo 9-11: textos abiertos → pinta resumen y temas', () => pruebas.N11_pintaResumenYTemas())
  it('Nodo 9-11: fallback cuantitativo también se pinta', () => pruebas.N11_pintaFallbackCuantitativo())
  it('FALLA N4: sin sesión — se espera (mal) pintar', () => pruebas.FALLA_N4_sinSesionSeEsperaPintar())
  it('FALLA N8: error API — se espera (mal) pintar', () => pruebas.FALLA_N8_errorSeEsperaPintar())
  it('FALLA N10: sin datos — se espera (mal) pintar', () => pruebas.FALLA_N10_sinDatosSeEsperaPintar())
})

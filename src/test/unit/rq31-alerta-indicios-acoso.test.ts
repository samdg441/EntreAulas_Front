import { describe, expect, it } from 'vitest'
import { decidirMontajeReportes, destinoTras401, endpointPorRol } from '../helpers/resumen-ia'
import {
  decidirVistaAlerta,
  muestraBannerAcoso,
  muestraListaDocentesAcoso,
  tituloAlertaAcoso,
} from '../helpers/alerta-acoso'

/**
 * RQ31 — Recibir alerta ante indicios de acoso (frontend)
 *
 *  3-4  Sin sesión / 401 → login, no se abre la alerta
 *  7-8  GET falla → error, sin banner
 *  9-10 200 sin textos → aviso ámbar, sin alerta
 * 11-13 datos y acosoDetectado false → solo resumen
 * 11-12 datos y alerta → banner ALERTA DE ACOSO + resumen
 */

const resumenSinAcoso = {
  textsCount: 6,
  summary: 'Percepción general positiva en la carrera.',
  topics: ['claridad'],
  analysisSource: 'open_text' as const,
  acosoDetectado: false,
  acosoProfesores: [] as Array<{
    profesorId: string
    nombre: string
    menciones: number
    ejemplos: string[]
  }>,
}

const resumenConAlerta = {
  textsCount: 6,
  summary: 'Hay menciones graves que requieren revisión.',
  topics: ['clima'],
  analysisSource: 'open_text' as const,
  acosoDetectado: true,
  mensajeAcoso: '⚠️ ALERTA: Se detectaron menciones de acoso en 2 respuesta(s).',
  acosoProfesores: [
    { profesorId: 'p1', nombre: 'Ana Diaz', menciones: 2, ejemplos: ['hubo acoso'] },
  ],
}

const sinDatos = {
  textsCount: 0,
  summary: 'No se encontraron respuestas abiertas.',
  topics: [] as string[],
  acosoDetectado: true,
  mensajeAcoso: 'no debería pintarse',
  acosoProfesores: [{ profesorId: 'p1', nombre: 'Ana', menciones: 1, ejemplos: [] }],
}

class RQ31AlertaIndiciosAcoso {
  N4_sinSesionNoAbreAlerta() {
    expect(decidirMontajeReportes(null)).toBe('login')
    expect(destinoTras401(401)).toBe('login')
    expect(decidirVistaAlerta({ haySesion: false, result: resumenConAlerta })).toBe('login')
    expect(decidirVistaAlerta({ haySesion: true, status: 401, result: resumenConAlerta })).toBe(
      'login'
    )
  }

  N5_coordinadorUsaByCareer() {
    expect(endpointPorRol('coordinator')).toBe('by-career')
    expect(endpointPorRol('decano')).toBe('by-faculty')
    expect(endpointPorRol('teacher')).toBe('by-professor')
  }

  N8_getFallaSinBanner() {
    expect(decidirVistaAlerta({ haySesion: true, status: 403 })).toBe('error')
    expect(decidirVistaAlerta({ haySesion: true, status: 500 })).toBe('error')
    expect(muestraBannerAcoso(null)).toBe(false)
    expect(muestraListaDocentesAcoso(null)).toBe(false)
  }

  N10_sinRespuestasNoEvaluaAlerta() {
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: sinDatos })).toBe(
      'aviso-sin-respuestas'
    )
    expect(muestraBannerAcoso(sinDatos)).toBe(false)
    expect(muestraListaDocentesAcoso(sinDatos)).toBe(false)
  }

  N13_datosSinIndiciosSoloResumen() {
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: resumenSinAcoso })).toBe(
      'resumen'
    )
    expect(muestraBannerAcoso(resumenSinAcoso)).toBe(false)
    expect(muestraListaDocentesAcoso(resumenSinAcoso)).toBe(false)
    expect(resumenSinAcoso.summary).toBeTruthy()
  }

  N12_datosConIndiciosMuestraAlertaYResumen() {
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: resumenConAlerta })).toBe(
      'alerta'
    )
    expect(muestraBannerAcoso(resumenConAlerta)).toBe(true)
    expect(muestraListaDocentesAcoso(resumenConAlerta)).toBe(true)
    expect(tituloAlertaAcoso()).toBe('ALERTA DE ACOSO DETECTADO')
    expect(resumenConAlerta.mensajeAcoso).toMatch(/ALERTA/)
    expect(resumenConAlerta.acosoProfesores[0]).toMatchObject({
      nombre: 'Ana Diaz',
      menciones: 2,
    })
    expect(resumenConAlerta.summary).toBeTruthy()
  }

  N12_soloListaDocentesTambienEsAlerta() {
    const soloLista = {
      ...resumenSinAcoso,
      acosoProfesores: [{ profesorId: 'p2', nombre: 'Luis', menciones: 1, ejemplos: [] }],
    }
    expect(muestraBannerAcoso(soloLista)).toBe(false)
    expect(muestraListaDocentesAcoso(soloLista)).toBe(true)
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: soloLista })).toBe('alerta')
  }

  FALLA_N4_sinSesionSeEsperaAlerta() {
    expect(decidirVistaAlerta({ haySesion: false, result: resumenConAlerta })).toBe('alerta')
  }

  FALLA_N10_sinDatosSeEsperaBanner() {
    expect(muestraBannerAcoso(sinDatos)).toBe(true)
  }

  FALLA_N13_sinIndiciosSeEsperaBanner() {
    expect(muestraBannerAcoso(resumenSinAcoso)).toBe(true)
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: resumenSinAcoso })).toBe(
      'alerta'
    )
  }
}

const pruebas = new RQ31AlertaIndiciosAcoso()

describe('RQ31 — Recibir alerta ante indicios de acoso (frontend)', () => {
  it('Nodo 3-4: sin sesión o 401 → login, no abre alerta', () => pruebas.N4_sinSesionNoAbreAlerta())
  it('Nodo 5: coordinador usa by-career', () => pruebas.N5_coordinadorUsaByCareer())
  it('Nodo 7-8: GET falla → error, sin banner', () => pruebas.N8_getFallaSinBanner())
  it('Nodo 9-10: sin respuestas → aviso, no evalúa alerta', () =>
    pruebas.N10_sinRespuestasNoEvaluaAlerta())
  it('Nodo 11-13: datos sin indicios → solo resumen', () => pruebas.N13_datosSinIndiciosSoloResumen())
  it('Nodo 11-12: indicios → banner y lista de docentes', () =>
    pruebas.N12_datosConIndiciosMuestraAlertaYResumen())
  it('Nodo 12: solo acosoProfesores también muestra alerta', () =>
    pruebas.N12_soloListaDocentesTambienEsAlerta())
  it('FALLA N4: sin sesión — se espera (mal) alerta', () => pruebas.FALLA_N4_sinSesionSeEsperaAlerta())
  it('FALLA N10: sin datos — se espera (mal) banner', () => pruebas.FALLA_N10_sinDatosSeEsperaBanner())
  it('FALLA N13: sin indicios — se espera (mal) banner', () =>
    pruebas.FALLA_N13_sinIndiciosSeEsperaBanner())
})

import { describe, expect, it } from 'vitest'
import { promedioVisible } from '../../lib/calificaciones'
import {
  decidirVistaResumen,
  endpointPorRol,
  esAvisoSinRespuestas,
  hayResumenParaPintar,
} from '../../features/evaluations/resumen-ia'

/**
 * Regresión de pantalla de RF-REP-25, RF-REP-26 y RF-IA-32.
 * El camino que ya se veía bien se conserva. El 99 sigue fuera de la tarjeta
 * y no vuelve a pisar un promedio válido.
 */
describe('RF-REP-25, RF-REP-26 y RF-IA-32 — Regresión en pantalla', () => {
  it('RF-REP-26: un promedio 4 sigue visible y el 99 sigue en 0', () => {
    const visible = promedioVisible(4)
    const oculto = promedioVisible(99)

    expect(visible).toBe(4)
    expect(oculto).toBe(0)
    expect(oculto).not.toBe(visible)
  })

  it('Regresión RF-REP-26: mezclar 99 con 4.5 no cambia lo que ya se pintaba', () => {
    expect(promedioVisible(4.5)).toBe(4.5)
    expect(promedioVisible(99)).toBe(0)
    expect(promedioVisible(4.5)).not.toBe(promedioVisible(99))
  })

  it('RF-IA-32: cada rol sigue pidiendo su propio resumen', () => {
    expect(endpointPorRol('teacher')).toBe('by-professor')
    expect(endpointPorRol('coordinator')).toBe('by-career')
    expect(endpointPorRol('decano')).toBe('by-faculty')
  })

  it('RF-IA-32: con comentarios se pinta el resumen', () => {
    const result = { summary: 'Claridad.', topics: ['claridad'], textsCount: 2, analysisSource: 'open_text' as const }

    expect(hayResumenParaPintar(result)).toBe(true)
    expect(decidirVistaResumen({ haySesion: true, result })).toBe('pintar')
  })

  it('Regresión RF-IA-32: sin textos y con notas se pinta el respaldo, no el aviso vacío', () => {
    const result = {
      textsCount: 0,
      ratingsCount: 2,
      analysisSource: 'quantitative_fallback' as const,
      summary: 'Desde las notas.',
    }

    expect(esAvisoSinRespuestas(result)).toBe(false)
    expect(hayResumenParaPintar(result)).toBe(true)
    expect(decidirVistaResumen({ haySesion: true, result })).toBe('pintar')
  })

  it('Regresión RF-IA-32: un 401 sigue mandando al login y un 500 al error', () => {
    expect(decidirVistaResumen({ haySesion: true, status: 401 })).toBe('login')
    expect(decidirVistaResumen({ haySesion: false })).toBe('login')
    expect(decidirVistaResumen({ haySesion: true, status: 500 })).toBe('error')
    expect(decidirVistaResumen({ haySesion: true, status: 500 })).not.toBe('pintar')
  })
})

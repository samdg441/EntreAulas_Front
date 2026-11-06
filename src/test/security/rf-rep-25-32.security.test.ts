import { describe, expect, it } from 'vitest'
import { promedioVisible } from '../../lib/calificaciones'
import { decidirVistaResumen, endpointPorRol } from '../../features/evaluations/resumen-ia'

/**
 * RF-REP-25, RF-REP-26 y RF-IA-32 — Lo que la pantalla no debe pintar ni pedir.
 * A01 el rol no escala. A03 un texto inyectado no se vuelve promedio. A04 el 99 no se muestra.
 */
describe('RF-REP-26 — Seguridad de la tarjeta', () => {
  it.each([99, 0, -1, 1000, '<script>alert(1)</script>', "4; DROP TABLE", Number.NaN])(
    'A03/A04: %j no se pinta como promedio',
    (valor) => {
      expect(promedioVisible(valor)).toBe(0)
    }
  )

  it('un promedio dentro de la escala sí se conserva', () => {
    expect(promedioVisible(4.5)).toBe(4.5)
  })
})

describe('RF-IA-32 — Seguridad del resumen en pantalla', () => {
  it('A01: el profesor, el coordinador y el decano piden alcances distintos', () => {
    expect(endpointPorRol('teacher')).toBe('by-professor')
    expect(endpointPorRol('coordinator')).toBe('by-career')
    expect(endpointPorRol('decano')).toBe('by-faculty')
  })

  it('A01/A07: sin sesión o con 401 no se pinta el resumen', () => {
    const result = { summary: '<script>alert(1)</script>', textsCount: 2, analysisSource: 'open_text' as const }

    expect(decidirVistaResumen({ haySesion: false, result })).toBe('login')
    expect(decidirVistaResumen({ haySesion: true, status: 401, result })).toBe('login')
    expect(decidirVistaResumen({ haySesion: true, status: 403, result })).toBe('error')
  })

  it('A03: un 500 no trata el cuerpo con HTML como resumen pintable', () => {
    expect(
      decidirVistaResumen({
        haySesion: true,
        status: 500,
        result: { summary: '<img src=x onerror=alert(1)>', textsCount: 1, analysisSource: 'open_text' },
      })
    ).toBe('error')
  })
})

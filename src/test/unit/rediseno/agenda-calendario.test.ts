import { describe, expect, it } from 'vitest'
import { situacionDeVentana } from '../../../components/AgendaEvaluaciones'
import { diasHasta, formatoFechaLarga, nombresDiasSemana } from '../../../lib/calendario'

const ventana = { periodoId: 1, ano: 2026, semestre: 2, fechaInicio: '2026-11-03', fechaFin: '2026-11-21' }
const fecha = (iso: string) => new Date(`${iso}T12:00:00`)

describe('situacionDeVentana (valores límite)', () => {
  it.each([
    ['2026-11-02', 'proxima', 1],
    ['2026-11-03', 'abierta', 18],
    ['2026-11-10', 'abierta', 11],
    ['2026-11-21', 'abierta', 0],
    ['2026-11-22', 'cerrada', 1],
  ] as const)('el %s la evaluación está %s (%s días)', (hoy, tipo, dias) => {
    expect(situacionDeVentana(ventana, fecha(hoy))).toEqual({ tipo, dias })
  })
})

describe('utilidades del calendario', () => {
  it('diasHasta ignora la hora del día', () => {
    expect(diasHasta(new Date(2026, 10, 10, 23, 59), new Date(2026, 10, 11, 0, 1))).toBe(1)
  })

  it('nombresDiasSemana empieza en lunes y cambia con el idioma', () => {
    expect(nombresDiasSemana('es-CO', 'long')[0]).toBe('lunes')
    expect(nombresDiasSemana('en-US', 'long')[0]).toBe('Monday')
    expect(nombresDiasSemana('en-US')).toHaveLength(7)
  })

  it('formatoFechaLarga respeta el idioma', () => {
    expect(formatoFechaLarga('2026-11-03', 'es-CO')).toBe('3 de noviembre')
    expect(formatoFechaLarga('2026-11-03', 'en-US')).toBe('November 3')
  })
})

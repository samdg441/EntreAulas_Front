import { describe, expect, it } from 'vitest'
import { notificacionesDeEvaluacion } from '../../../lib/notificaciones'
import type { VentanaEvaluacion } from '../../../api/periodos.api'

const ventana: VentanaEvaluacion = {
  periodoId: 2,
  ano: 2026,
  semestre: 1,
  fechaInicio: '2026-09-28',
  fechaFin: '2026-10-09',
}

describe('Notificaciones desde el calendario de evaluación', () => {
  it('sin ventanas no hay notificaciones (nada inventado)', () => {
    expect(notificacionesDeEvaluacion(new Date(2026, 9, 3), [], 'estudiante')).toEqual([])
  })

  it('ventana abierta: avisa la fecha de cierre y al estudiante lo lleva a evaluar', () => {
    const [n] = notificacionesDeEvaluacion(new Date(2026, 9, 3), [ventana], 'estudiante')

    expect(n.titulo).toBe('Evaluación docente abierta')
    expect(n.mensaje).toContain('2026-1')
    expect(n.mensaje).toContain('9 de octubre')
    expect(n.mensaje).toContain('en 6 días')
    expect(n.urgente).toBe(false)
    expect(n.accion).toEqual({ texto: 'Evaluar ahora', ruta: '/evaluate/selection' })
  })

  it('a dos días o menos del cierre es urgente; docentes y coordinadores van a reportes', () => {
    const [n] = notificacionesDeEvaluacion(new Date(2026, 9, 8), [ventana], 'profesor')

    expect(n.urgente).toBe(true)
    expect(n.mensaje).toContain('cierra mañana')
    expect(n.accion?.ruta).toBe('/reports')
  })

  it('el admin recibe el aviso sin acción', () => {
    const [n] = notificacionesDeEvaluacion(new Date(2026, 9, 3), [ventana], 'admin')

    expect(n.accion).toBeUndefined()
  })

  it('ventana futura: avisa cuándo abre', () => {
    const [n] = notificacionesDeEvaluacion(new Date(2026, 8, 25), [ventana], 'estudiante')

    expect(n.titulo).toBe('Próxima evaluación docente')
    expect(n.mensaje).toContain('28 de septiembre')
    expect(n.mensaje).toContain('en 3 días')
    expect(n.accion).toBeUndefined()
  })

  it('ventana ya cerrada: no queda ninguna notificación vieja', () => {
    expect(notificacionesDeEvaluacion(new Date(2026, 9, 20), [ventana], 'estudiante')).toEqual([])
  })

  it('el id cambia si cambian las fechas, para volver a avisar', () => {
    const [a] = notificacionesDeEvaluacion(new Date(2026, 9, 3), [ventana], 'estudiante')
    const [b] = notificacionesDeEvaluacion(new Date(2026, 9, 3), [{ ...ventana, fechaFin: '2026-10-16' }], 'estudiante')

    expect(a.id).not.toBe(b.id)
  })
})

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

/**
 * RF-NOT-34 y RF-NOT-35. Dado / Cuando / Entonces y AAA.
 * La lista que arma esta función es la que muestra la campana.
 */
describe('RF-NOT — Notificaciones de la ventana de evaluación', () => {
  it('RF-NOT-34: sin ventanas no inventa avisos', () => {
    // Dado que no hay ventanas de evaluación
    // Arrange
    const hoy = new Date(2026, 9, 3)

    // Cuando se consulta la fecha
    // Act
    const avisos = notificacionesDeEvaluacion(hoy, [], 'estudiante')

    // Entonces no hay notificaciones
    // Assert
    expect(avisos).toEqual([])
  })

  it('RF-NOT-34: con la ventana abierta avisa el cierre', () => {
    // Dado que hoy cae dentro de la ventana 2026-1
    // Arrange
    const hoy = new Date(2026, 9, 3)

    // Cuando el estudiante consulta
    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [ventana], 'estudiante')

    // Entonces anuncia que la evaluación está abierta y hasta qué día
    // Assert
    expect(aviso.titulo).toBe('Evaluación docente abierta')
    expect(aviso.mensaje).toContain('2026-1')
    expect(aviso.mensaje).toContain('9 de octubre')
    expect(aviso.urgente).toBe(false)
  })

  it('RF-NOT-34: a dos días o menos del cierre el aviso es urgente', () => {
    // Dado que faltan dos días o menos para el cierre
    // Arrange
    const hoy = new Date(2026, 9, 8)

    // Cuando se consulta
    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [ventana], 'profesor')

    // Entonces el aviso queda marcado como urgente
    // Assert
    expect(aviso.urgente).toBe(true)
    expect(aviso.mensaje).toContain('cierra mañana')
  })

  it('RF-NOT-34: antes de abrir anuncia la próxima evaluación', () => {
    // Dado que la ventana todavía no empieza
    // Arrange
    const hoy = new Date(2026, 8, 25)

    // Cuando se consulta
    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [ventana], 'estudiante')

    // Entonces anuncia la fecha de apertura y no ofrece acción
    // Assert
    expect(aviso.titulo).toBe('Próxima evaluación docente')
    expect(aviso.mensaje).toContain('28 de septiembre')
    expect(aviso.accion).toBeUndefined()
  })

  it('RF-NOT-34: una ventana ya cerrada no deja un aviso viejo', () => {
    // Dado que la ventana ya terminó
    // Arrange
    const hoy = new Date(2026, 9, 20)

    // Cuando se consulta
    // Act
    const avisos = notificacionesDeEvaluacion(hoy, [ventana], 'estudiante')

    // Entonces la lista queda vacía
    // Assert
    expect(avisos).toEqual([])
  })

  it('RF-NOT-35: el estudiante ve la acción de evaluar', () => {
    // Dado que la evaluación está abierta
    // Arrange
    const hoy = new Date(2026, 9, 3)

    // Cuando el aviso es para un estudiante
    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [ventana], 'estudiante')

    // Entonces la lista ofrece ir a elegir la encuesta
    // Assert
    expect(aviso.accion).toEqual({ texto: 'Evaluar ahora', ruta: '/evaluate/selection' })
  })

  it('RF-NOT-35: el docente ve la acción de reportes y el admin ninguna', () => {
    // Dado que la evaluación está abierta
    // Arrange
    const hoy = new Date(2026, 9, 3)

    // Cuando el aviso es para un docente y para un admin
    // Act
    const [docente] = notificacionesDeEvaluacion(hoy, [ventana], 'profesor')
    const [admin] = notificacionesDeEvaluacion(hoy, [ventana], 'admin')

    // Entonces cada rol recibe la acción que le corresponde
    // Assert
    expect(docente.accion).toEqual({ texto: 'Ver reportes', ruta: '/reports' })
    expect(admin.accion).toBeUndefined()
  })

  it('RF-NOT-35: el identificador cambia si cambian las fechas, para volver a mostrar el aviso', () => {
    // Dado dos ventanas con distinto cierre
    // Arrange
    const hoy = new Date(2026, 9, 3)
    const otra = { ...ventana, fechaFin: '2026-10-16' }

    // Cuando se arman las dos listas
    // Act
    const [primera] = notificacionesDeEvaluacion(hoy, [ventana], 'estudiante')
    const [segunda] = notificacionesDeEvaluacion(hoy, [otra], 'estudiante')

    // Entonces no se tratan como el mismo aviso ya leído
    // Assert
    expect(primera.id).not.toBe(segunda.id)
  })
})

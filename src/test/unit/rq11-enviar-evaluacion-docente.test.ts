import { describe, expect, it } from 'vitest'
import {
  ALERTA_ERROR_GENERICO,
  ALERTA_FALTAN_DATOS,
  MENSAJE_GOODBYE,
  armarPayloadEvaluacion,
  decidirEnvioFormulario,
  decidirMontajeFormulario,
  hayProfesorYCurso,
  mensajeErrorEnvio,
} from '../../features/evaluations/evaluacion-docente'

const PROFESOR = { id: 7 }
const CURSO = { id: 31 }
const PREGUNTAS = [
  { id: '1', type: 'rating' as const },
  { id: '2', type: 'rating' as const },
  { id: '3', type: 'text' as const },
]

/**
 * RQ11 en el formulario: el estudiante arma respuestas y, si el servidor
 * acepta, ve el goodbye. Un rechazo (rol, repetición o cuerpo vacío) no lo muestra.
 */
describe('RQ11 — Enviar la evaluación docente', () => {
  it('sin sesión el formulario no se monta y el envío vuelve al login', () => {
    // Act
    const montaje = decidirMontajeFormulario(null)
    const destino = decidirEnvioFormulario({ haySesion: false, confirma: true, teacher: PROFESOR, course: CURSO })

    // Assert
    expect(montaje, 'montaje').to.equal('login')
    expect(destino, 'destino').to.equal('login')
  })

  it('el estudiante guarda la evaluación y recibe el goodbye', () => {
    // Arrange
    const pedido = {
      teacher: PROFESOR,
      course: CURSO,
      group: { id: 4 },
      comments: 'explica con claridad',
      questions: PREGUNTAS,
      ratings: [4, 5, null],
      textAnswers: [undefined, undefined, 'buena metodología'],
    }

    // Act
    const payload = armarPayloadEvaluacion(pedido)
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: true,
    })

    // Assert
    expect(destino, 'destino').to.equal('goodbye')
    expect(MENSAJE_GOODBYE, 'aviso').to.be.a('string').and.not.to.be.empty
    expect(payload, 'payload').to.include({
      teacherId: '7',
      courseId: '31',
      groupId: '4',
      overallRating: 4.5,
    })
    expect(payload.answers, 'respuestas').to.have.lengthOf(3)
    expect(payload.answers[0], 'rating').to.include({ questionId: 1, rating: 4, textAnswer: null })
    expect(payload.answers[2], 'texto').to.include({ questionId: 3, rating: null, textAnswer: 'buena metodología' })
  })

  it('el mismo envío, negado a un profesor, no muestra el goodbye', () => {
    // Act
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: false,
    })
    const mensaje = mensajeErrorEnvio({
      response: { data: { error: 'Solo los estudiantes pueden enviar la evaluación' } },
    })

    // Assert
    expect(destino, 'destino').to.equal('alerta-error')
    expect(mensaje, 'mensaje').to.equal('Solo los estudiantes pueden enviar la evaluación')
  })

  it('repetir la evaluación muestra el rechazo y no crea otra', () => {
    // Act
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: false,
    })
    const mensaje = mensajeErrorEnvio({
      response: { data: { error: 'Ya enviaste la evaluación de este profesor' } },
    })

    // Assert
    expect(destino, 'destino').to.equal('alerta-error')
    expect(mensaje, 'mensaje').to.equal('Ya enviaste la evaluación de este profesor')
  })

  it('sin respuestas el detalle de validación se muestra y el goodbye no aparece', () => {
    // Arrange
    const pedido = {
      teacher: PROFESOR,
      course: CURSO,
      questions: [] as typeof PREGUNTAS,
      ratings: [],
      textAnswers: [],
    }

    // Act
    const payload = armarPayloadEvaluacion(pedido)
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: false,
    })
    const mensaje = mensajeErrorEnvio({
      response: {
        data: {
          error: 'Datos de evaluación inválidos',
          details: [{ field: 'answers', message: 'Se requiere al menos una respuesta' }],
        },
      },
    })

    // Assert
    expect(payload.answers, 'respuestas').to.be.an('array').and.to.be.empty
    expect(payload.overallRating, 'promedio').to.equal(0)
    expect(destino, 'destino').to.equal('alerta-error')
    expect(mensaje, 'detalle').to.include('answers: Se requiere al menos una respuesta')
  })

  it('sin profesor o curso el envío se detiene antes de llamar al servidor', () => {
    // Act
    const faltan = hayProfesorYCurso({ teacher: null, course: CURSO })
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: { id: null },
      course: CURSO,
      envioOk: true,
    })
    const cancelado = decidirEnvioFormulario({
      haySesion: true,
      confirma: false,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: true,
    })

    // Assert
    expect(faltan, 'datos').to.equal(false)
    expect(destino, 'destino').to.equal('faltan-datos')
    expect(ALERTA_FALTAN_DATOS, 'alerta').to.include('profesor')
    expect(cancelado, 'cancelar').to.equal('cancelar')
  })

  it('un error sin cuerpo del servidor usa el mensaje genérico o el de la red', () => {
    // Act
    const generico = mensajeErrorEnvio(null)
    const red = mensajeErrorEnvio({ message: 'Network Error' })
    const montaje = decidirMontajeFormulario({ tipo_usuario: 'estudiante' })

    // Assert
    expect(generico, 'genérico').to.equal(ALERTA_ERROR_GENERICO)
    expect(red, 'red').to.equal('Network Error')
    expect(montaje, 'montaje').to.equal('formulario')
  })

  it('sin grupo el payload no inventa un groupId', () => {
    // Act
    const payload = armarPayloadEvaluacion({
      teacher: PROFESOR,
      course: CURSO,
      questions: [{ id: '9', type: 'rating' }],
      ratings: [3],
      textAnswers: [],
    })

    // Assert
    expect(payload, 'payload').to.include({ teacherId: '7', courseId: '31', overallRating: 3 })
    expect(payload.groupId, 'grupo').to.equal(undefined)
  })
})

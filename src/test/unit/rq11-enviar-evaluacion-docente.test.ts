import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta } from '../../features/auth/dashboard-path'
import {
  ALERTA_ERROR_GENERICO,
  ALERTA_FALTAN_DATOS,
  armarPayloadEvaluacion,
  decidirEnvioFormulario,
  decidirMontajeFormulario,
  hayProfesorYCurso,
  MENSAJE_GOODBYE,
  mensajeErrorEnvio,
} from '../helpers/evaluacion-docente'

/**
 * RQ11 — Enviar la evaluación docente (frontend /evaluate/form)
 *
 * Nodos del grafo:
 *  1-2  Abre /evaluate/form
 *  3-4  ¿Hay sesión? No → /login
 *  5    Click «Finalizar Evaluación»
 *  6-7  ¿Confirma? No → cierra modal, no hay POST
 *  8-10 Falta teacher.id o course.id → alerta, no hay POST
 * 11-13 POST falla → alerta con error del back, no goodbye
 * 14-15 POST 200 → /evaluate/goodbye
 */

const teacher = { id: 12 }
const course = { id: 3 }
const group = { id: 7 }

class RQ11EnviarEvaluacionDocente {
  // Nodo 1-2: el wrapper solo monta el formulario si hay authUser
  N2_montajeSegunSesion() {
    expect(decidirMontajeFormulario(null)).toBe('login')
    expect(decidirMontajeFormulario(undefined)).toBe('login')
    expect(
      decidirMontajeFormulario({ id: 'u1', tipo_usuario: 'estudiante' })
    ).toBe('formulario')
  }

  // Nodo 3-4: sin token / sin user → /login (App.tsx 286-288)
  N4_sinSesionVaALogin() {
    expect(decidirAccesoRuta({ token: null, savedUser: null, user: null })).toBe('login')
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: null, user: null })).toBe('login')
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: '{}', user: null })).toBe('login')
    expect(decidirEnvioFormulario({ haySesion: false, confirma: true, teacher, course, envioOk: true })).toBe(
      'login'
    )
  }

  // Nodo 5-7: abre el modal y cancela → sigue en el formulario, no POST
  N7_cancelaElModal() {
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: false,
        teacher,
        course,
        envioOk: true,
      })
    ).toBe('cancelar')
  }

  // Nodo 8-9: teacher.id y course.id presentes
  N9_hayProfesorYCurso() {
    expect(hayProfesorYCurso({ teacher, course })).toBe(true)
    expect(hayProfesorYCurso({ teacher: { id: '12' }, course: { id: '3' } })).toBe(true)
  }

  // Nodo 8-10: falta profesor o curso → alerta, no POST
  N10_faltanDatos() {
    expect(hayProfesorYCurso({ teacher: null, course })).toBe(false)
    expect(hayProfesorYCurso({ teacher, course: null })).toBe(false)
    expect(hayProfesorYCurso({ teacher: { id: '' }, course })).toBe(false)
    expect(hayProfesorYCurso({ teacher: { id: undefined }, course })).toBe(false)
    expect(hayProfesorYCurso({ teacher, course: { id: 0 } })).toBe(false)

    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: true,
        teacher: null,
        course,
        envioOk: true,
      })
    ).toBe('faltan-datos')
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: true,
        teacher,
        course: { id: null },
        envioOk: true,
      })
    ).toBe('faltan-datos')
    expect(ALERTA_FALTAN_DATOS).toBe('Error: Faltan datos del profesor o curso')
  }

  // Nodo 11: el payload del POST arma teacherId, courseId, answers y overallRating
  N11_armaPayloadDelPost() {
    const payload = armarPayloadEvaluacion({
      teacher,
      course,
      group,
      comments: 'Buen curso',
      questions: [
        { id: '1', type: 'rating' },
        { id: '2', type: 'rating' },
        { id: '3', type: 'text' },
      ],
      ratings: [4, 5],
      textAnswers: [undefined, undefined, 'claro y puntual'],
    })
    expect(payload.teacherId).toBe('12')
    expect(payload.courseId).toBe('3')
    expect(payload.groupId).toBe('7')
    expect(payload.comments).toBe('Buen curso')
    expect(payload.answers).toEqual([
      { questionId: 1, rating: 4, textAnswer: null },
      { questionId: 2, rating: 5, textAnswer: null },
      { questionId: 3, rating: null, textAnswer: 'claro y puntual' },
    ])
    expect(payload.overallRating).toBe(4.5)
  }

  // Nodo 11: sin grupo no se manda groupId; sin ratings el promedio es 0
  N11_payloadSinGrupoNiRatings() {
    const payload = armarPayloadEvaluacion({
      teacher,
      course,
      questions: [{ id: '8', type: 'text' }],
      ratings: [],
      textAnswers: ['solo comentario'],
    })
    expect(payload.groupId).toBeUndefined()
    expect(payload.overallRating).toBe(0)
    expect(payload.answers).toHaveLength(1)
  }

  // Nodo 12-13: POST 400/403/404/409/500 → alerta con el error del back, no goodbye
  N13_postFallaMuestraAlerta() {
    for (const status of [400, 403, 404, 409, 500]) {
      expect(
        decidirEnvioFormulario({
          haySesion: true,
          confirma: true,
          teacher,
          course,
          envioOk: false,
        })
      ).toBe('alerta-error')
      expect(status).toBeGreaterThanOrEqual(400)
    }

    expect(
      mensajeErrorEnvio({
        response: { data: { error: 'Ya has evaluado a este profesor para este curso y grupo' } },
      })
    ).toBe('Ya has evaluado a este profesor para este curso y grupo')

    expect(
      mensajeErrorEnvio({
        response: {
          data: {
            error: 'Datos de evaluación inválidos',
            details: [{ field: 'answers', message: 'Debe haber al menos una respuesta' }],
          },
        },
      })
    ).toContain('answers: Debe haber al menos una respuesta')

    expect(mensajeErrorEnvio({ message: 'Network Error' })).toBe('Network Error')
    expect(mensajeErrorEnvio(null)).toBe(ALERTA_ERROR_GENERICO)
  }

  // Nodo 14-15: POST 200 cierra el modal y va a /evaluate/goodbye
  N14_envioExitosoVaAGoodbye() {
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: true,
        teacher,
        course,
        envioOk: true,
      })
    ).toBe('goodbye')
    expect(MENSAJE_GOODBYE).toMatch(/Tu encuesta fue enviada correctamente/)
  }

  FALLA_N4_sinSesionSeEsperaFormulario() {
    expect(decidirEnvioFormulario({ haySesion: false, confirma: true, teacher, course, envioOk: true })).toBe(
      'goodbye'
    )
  }

  FALLA_N7_cancelarIgualEnvia() {
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: false,
        teacher,
        course,
        envioOk: true,
      })
    ).toBe('goodbye')
  }

  FALLA_N10_sinProfesorIgualEnvia() {
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: true,
        teacher: null,
        course,
        envioOk: true,
      })
    ).toBe('goodbye')
  }

  FALLA_N13_errorPostSeEsperaGoodbye() {
    expect(
      decidirEnvioFormulario({
        haySesion: true,
        confirma: true,
        teacher,
        course,
        envioOk: false,
      })
    ).toBe('goodbye')
  }
}

const pruebas = new RQ11EnviarEvaluacionDocente()

describe('RQ11 — Enviar la evaluación docente (frontend)', () => {
  it('Nodo 1-2: sin authUser el wrapper no monta el formulario', () => pruebas.N2_montajeSegunSesion())
  it('Nodo 3-4: sin sesión → /login', () => pruebas.N4_sinSesionVaALogin())
  it('Nodo 5-7: cancela el modal → no hay POST', () => pruebas.N7_cancelaElModal())
  it('Nodo 8-9: teacher.id y course.id presentes', () => pruebas.N9_hayProfesorYCurso())
  it('Nodo 8-10: faltan datos → alerta, no hay POST', () => pruebas.N10_faltanDatos())
  it('Nodo 11: arma el payload del POST', () => pruebas.N11_armaPayloadDelPost())
  it('Nodo 11: sin grupo ni ratings → groupId undefined y promedio 0', () =>
    pruebas.N11_payloadSinGrupoNiRatings())
  it('Nodo 12-13: POST falla → alerta con error del back', () => pruebas.N13_postFallaMuestraAlerta())
  it('Nodo 14-15: POST 200 → /evaluate/goodbye', () => pruebas.N14_envioExitosoVaAGoodbye())
  it('FALLA N4: sin sesión — se espera (mal) goodbye', () => pruebas.FALLA_N4_sinSesionSeEsperaFormulario())
  it('FALLA N7: cancelar — se espera (mal) enviar', () => pruebas.FALLA_N7_cancelarIgualEnvia())
  it('FALLA N10: sin profesor — se espera (mal) goodbye', () => pruebas.FALLA_N10_sinProfesorIgualEnvia())
  it('FALLA N13: error POST — se espera (mal) goodbye', () => pruebas.FALLA_N13_errorPostSeEsperaGoodbye())
})

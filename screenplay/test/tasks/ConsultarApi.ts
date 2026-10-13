import { Task } from '@serenity-js/core'
import { GetRequest, PostRequest, Send } from '@serenity-js/rest'

import { tokenCoordinador } from '../support/entorno'

const evaluacion = {
  teacherId: '7',
  courseId: '31',
  groupId: '4',
  answers: [{ questionId: 1, rating: 5, textAnswer: null }],
  overallRating: 5,
  comments: 'claridad',
}

const evaluacionInvalida = {
  ...evaluacion,
  teacherId: '7; DROP TABLE evaluaciones',
}

const alta = {
  email: 'luis@soyudemedellin.edu.co',
  password: 'Clave-Segura2026!',
  nombre: 'Luis',
  apellido: 'Gomez',
  tipo_usuario: 'estudiante',
}

const conSesion = (peticion: ReturnType<typeof PostRequest.to>) =>
  peticion.using({ headers: { Authorization: `Bearer ${tokenCoordinador()}` } })

export const ConsultarApi = {
  sinToken: (ruta: string) => Task.where(`#actor consulta ${ruta} sin token`, Send.a(GetRequest.to(ruta))),

  comoCoordinador: (ruta: string) =>
    Task.where(`#actor consulta ${ruta} con su sesión de coordinador`,
      Send.a(GetRequest.to(ruta).using({ headers: { Authorization: `Bearer ${tokenCoordinador()}` } })),
    ),

  iniciarSesion: (correo: string, clave: string) =>
    Task.where(`#actor intenta iniciar sesión con ${correo}`,
      Send.a(PostRequest.to('/api/auth/login').with({ email: correo, password: clave })),
    ),

  evaluacionSinToken: () =>
    Task.where('#actor envía una evaluación sin token', Send.a(PostRequest.to('/api/teachers/evaluations').with(evaluacion))),

  evaluacionComoCoordinador: () =>
    Task.where('#actor envía una evaluación con su sesión de coordinador',
      Send.a(conSesion(PostRequest.to('/api/teachers/evaluations').with(evaluacion))),
    ),

  evaluacionInvalidaComoCoordinador: () =>
    Task.where('#actor envía una evaluación con un identificador inválido',
      Send.a(conSesion(PostRequest.to('/api/teachers/evaluations').with(evaluacionInvalida))),
    ),

  altaSinToken: () =>
    Task.where('#actor crea un usuario sin token', Send.a(PostRequest.to('/api/auth/create-user').with(alta))),

  altaComoCoordinador: () =>
    Task.where('#actor crea un usuario con su sesión de coordinador',
      Send.a(conSesion(PostRequest.to('/api/auth/create-user').with(alta))),
    ),

  resumenSinComentarios: () =>
    Task.where('#actor pide un resumen sin comentarios',
      Send.a(conSesion(PostRequest.to('/api/ai/summarize').with({ texts: [] }))),
    ),

  resumenSinToken: () =>
    Task.where('#actor pide un resumen sin token', Send.a(PostRequest.to('/api/ai/summarize').with({ texts: ['claridad'] }))),
}

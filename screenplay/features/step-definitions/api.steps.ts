import { Then, When } from '@cucumber/cucumber'
import { Ensure, equals, includes, isLessThan, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight, Question } from '@serenity-js/core'
import { LastResponse } from '@serenity-js/rest'

import { ConsultarApi } from '../../test/tasks/ConsultarApi'

const campoDeLaRespuesta = (campo: string) =>
  Question.about<unknown>(`el campo "${campo}" de la respuesta`, async (actor) => {
    const cuerpo = await actor.answer(LastResponse.body<Record<string, unknown>>())
    return cuerpo?.[campo]
  })

When('{actor} consulta {string} sin token', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(ConsultarApi.sinToken(ruta))
})

When('{actor} consulta {string} como coordinador', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(ConsultarApi.comoCoordinador(ruta))
})

When('{actor} intenta iniciar sesión con {string} y la clave {string}', async (actor: Actor, correo: string, clave: string) => {
  await actor.attemptsTo(ConsultarApi.iniciarSesion(correo, clave))
})

When('{actor} envía una evaluación sin token', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.evaluacionSinToken())
})

When('{actor} envía una evaluación como coordinador', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.evaluacionComoCoordinador())
})

When('{actor} envía una evaluación con un identificador inválido', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.evaluacionInvalidaComoCoordinador())
})

When('{actor} crea un usuario sin token', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.altaSinToken())
})

When('{actor} crea un usuario como coordinador', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.altaComoCoordinador())
})

When('{actor} pide un resumen sin token', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.resumenSinToken())
})

When('{actor} pide un resumen sin comentarios como coordinador', async (actor: Actor) => {
  await actor.attemptsTo(ConsultarApi.resumenSinComentarios())
})

Then('la respuesta tiene estado {int}', async (estado: number) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(LastResponse.status(), equals(estado)))
})

Then('el campo {string} de la respuesta es {string}', async (campo: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(campoDeLaRespuesta(campo), equals(valor)))
})

Then('el campo {string} de la respuesta menciona {string}', async (campo: string, texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(campoDeLaRespuesta(campo).describedAs(`el campo "${campo}"`), includes(texto)))
})

Then('la respuesta no trae el campo {string}', async (campo: string) => {
  const presente = Question.about<boolean>(`si la respuesta trae "${campo}"`, async (actor) => {
    const cuerpo = await actor.answer(LastResponse.body<Record<string, unknown>>())
    return Object.prototype.hasOwnProperty.call(cuerpo ?? {}, campo)
  })
  await actorInTheSpotlight().attemptsTo(Ensure.that(presente, not(equals(true))))
})

Then('la respuesta trae como mucho {int} docentes', async (maximo: number) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(LastResponse.body<{ teachers: unknown[] }>().teachers.length, isLessThan(maximo + 1)),
  )
})

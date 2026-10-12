import { Then } from '@cucumber/cucumber'
import { Ensure, equals, includes, isFalse, isTrue, matches, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight, notes, Question } from '@serenity-js/core'
import { Navigate } from '@serenity-js/web'

import type { NotasDelActor } from '../../test/interactions/LlamarAlBack'
import { Pantalla } from '../../test/questions/Pantalla'
import { Respuesta } from '../../test/questions/Respuesta'
import { AbrirEntreAulas } from '../../test/tasks/AbrirEntreAulas'
import { IniciarSesion } from '../../test/tasks/IniciarSesion'
import { PrepararPorApi } from '../../test/tasks/PreparacionPorApi'
import { RestablecerClave, SolicitarRecuperacion } from '../../test/tasks/Recuperacion'
import { SolicitarEnlaceDeRecuperacionPorApi } from '../../test/tasks/SolicitarEnlacePorApi'
import { correoUnico, TOKEN_EXPIRADO, TOKEN_INEXISTENTE, USUARIO_RECUPERACION } from '../../test/support/entorno'
import { paso } from '../support/pasos'

const correoDeLaCuenta = () => notes<NotasDelActor>().get('correoCreado')

const enlaceDeRestablecimiento = Question.about<string>('el enlace de restablecimiento', async actor => {
  const token = await actor.answer(notes<NotasDelActor>().get('tokenDeRecuperacion'))
  const correo = await actor.answer(correoDeLaCuenta())
  return `/reset-password?token=${token}&email=${encodeURIComponent(correo)}`
})

const enlaceCon = (token: string) =>
  `/reset-password?token=${token}&email=${encodeURIComponent(USUARIO_RECUPERACION)}`

paso('{quien} solicita la recuperación de {string}', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(SolicitarRecuperacion.para(correo))
})

Then('ve la confirmación {string}', async (titulo: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.tituloDeConfirmacion(), includes(titulo)))
})

Then('el aviso dice {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Pantalla.textoDeConfirmacion(), includes(texto)))
})

Then('no ve ninguna confirmación', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Pantalla.hayConfirmacion(), isFalse()))
})

Then('ve la opción de solicitar un nuevo enlace', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.hayOpcionDeNuevoEnlace(), isTrue()))
})

paso('{quien} abre un enlace de restablecimiento con un token inexistente', async (actor: Actor) => {
  await actor.attemptsTo(AbrirEntreAulas.sinSesionEn(enlaceCon(TOKEN_INEXISTENTE)))
})

paso('{quien} abre un enlace de restablecimiento con el token expirado', async (actor: Actor) => {
  await actor.attemptsTo(AbrirEntreAulas.sinSesionEn(enlaceCon(TOKEN_EXPIRADO)))
})

paso('{quien} pide por API el enlace de recuperación de {string}', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(SolicitarEnlaceDeRecuperacionPorApi.para(correo))
})

paso('{quien} guarda el token recibido', async (actor: Actor) => {
  await actor.attemptsTo(notes<NotasDelActor>().set('tokenAnterior', notes<NotasDelActor>().get('tokenDeRecuperacion')))
})

Then('la respuesta tiene estado {int}', async (estado: number) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.estado(), equals(estado)))
})

Then('el enlace generado apunta a {string} con un token de 64 caracteres y el correo solicitado', async (ruta: string) => {
  const enlace = notes<NotasDelActor>().get('enlaceDeRecuperacion')
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(enlace, includes(ruta)),
    Ensure.that(enlace, matches(/token=[0-9a-f]{64}&email=usuario\.activo%40entreaulas\.test$/i)),
  )
})

Then('la respuesta no incluye ningún enlace de recuperación', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(Respuesta.campo('resetLink'), equals(undefined)),
    Ensure.that(Respuesta.campo('resetToken'), equals(undefined)),
  )
})

Then('el token recibido es distinto del guardado', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(notes<NotasDelActor>().get('tokenDeRecuperacion'), not(equals(notes<NotasDelActor>().get('tokenAnterior')))),
  )
})

paso('{quien} tiene una cuenta nueva con clave {string}', async (actor: Actor, clave: string) => {
  const correo = correoUnico('e2e.rq5')
  await actor.attemptsTo(
    notes<NotasDelActor>().set('correoCreado', correo),
    PrepararPorApi.usuarioNuevo(correo, clave),
    Ensure.that(Respuesta.estado(), equals(201)),
  )
})

paso('{quien} recibió un enlace de recuperación vigente', async (actor: Actor) => {
  const correo = await actor.answer(correoDeLaCuenta())
  await actor.attemptsTo(SolicitarEnlaceDeRecuperacionPorApi.para(correo))
})

paso('{quien} abre el enlace de recuperación', async (actor: Actor) => {
  await actor.attemptsTo(AbrirEntreAulas.sinSesionEn(enlaceDeRestablecimiento))
})

paso('{quien} abre de nuevo el mismo enlace de recuperación', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.eventually(Pantalla.tituloDeConfirmacion(), includes('Contraseña actualizada')),
    Navigate.to(enlaceDeRestablecimiento),
  )
})

paso('{quien} restablece su contraseña con {string} y la confirma', async (actor: Actor, clave: string) => {
  await actor.attemptsTo(RestablecerClave.con(clave, clave))
})

paso('{quien} restablece su contraseña con {string} y la confirma como {string}',
  async (actor: Actor, clave: string, confirmacion: string) => {
    await actor.attemptsTo(RestablecerClave.con(clave, confirmacion))
  })

Then('puede iniciar sesión con la clave {string}', async (clave: string) => {
  const actor = actorInTheSpotlight()
  const correo = await actor.answer(correoDeLaCuenta())
  await actor.attemptsTo(
    AbrirEntreAulas.sinSesionEn('/login'),
    IniciarSesion.como('Estudiante', correo, clave),
    Ensure.eventually(Pantalla.rutaActual(), equals('/dashboard-estudiante')),
  )
})

Then('no puede iniciar sesión con la clave {string}', async (clave: string) => {
  const actor = actorInTheSpotlight()
  const correo = await actor.answer(correoDeLaCuenta())
  await actor.attemptsTo(
    AbrirEntreAulas.sinSesionEn('/login'),
    IniciarSesion.como('Estudiante', correo, clave),
    Ensure.eventually(Pantalla.mensajeDeError(), includes('Credenciales inválidas')),
    Ensure.that(Pantalla.rutaActual(), equals('/login')),
  )
})

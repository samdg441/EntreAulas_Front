import { Then } from '@cucumber/cucumber'
import { equals, Ensure, includes, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight, Duration, Wait } from '@serenity-js/core'

import { Pantalla } from '../../test/questions/Pantalla'
import { AbrirEntreAulas } from '../../test/tasks/AbrirEntreAulas'
import { IniciarSesion } from '../../test/tasks/IniciarSesion'
import { CUENTAS } from '../../test/support/entorno'
import { paso } from '../support/pasos'
import '../support/parametros'
import '../support/serenity'

const PANEL_POR_CUENTA: Record<string, string> = {
  estudiante: '/dashboard-estudiante',
  coordinador: '/dashboard-coordinador',
  decano: '/dashboard-decano',
  admin: '/dashboard-admin',
}

const cuenta = (clave: string) => {
  const c = CUENTAS[clave as keyof typeof CUENTAS]
  if (!c) throw new Error(`Cuenta desconocida "${clave}". Opciones: ${Object.keys(CUENTAS).join(', ')}`)
  return c
}

paso('{quien} abre EntreAulas sin sesión en {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(AbrirEntreAulas.sinSesionEn(ruta))
})

paso('{quien} abre EntreAulas en {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(AbrirEntreAulas.en(ruta))
})

paso('{quien} abre directamente {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(AbrirEntreAulas.en(ruta))
})

paso('{quien} inicia sesión con la cuenta {string}', async (actor: Actor, clave: string) => {
  const c = cuenta(clave)
  await actor.attemptsTo(IniciarSesion.como(c.tipo, c.correo, c.clave))
})

paso('{quien} ingresó con la cuenta {string}', async (actor: Actor, clave: string) => {
  const c = cuenta(clave)
  await actor.attemptsTo(
    IniciarSesion.como(c.tipo, c.correo, c.clave),
    Ensure.eventually(Pantalla.rutaActual(), equals(PANEL_POR_CUENTA[clave])),
  )
})

paso('{quien} inicia sesión como {string} con {string} y la clave {string}',
  async (actor: Actor, tipo: string, correo: string, clave: string) => {
    await actor.attemptsTo(IniciarSesion.como(tipo, correo, clave))
  })

Then('la ruta actual es {string}', async (ruta: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.rutaActual(), equals(ruta)))
})

Then('la ruta actual no es {string}', async (ruta: string) => {
  await actorInTheSpotlight().attemptsTo(
    Wait.upTo(Duration.ofSeconds(5)).until(Pantalla.rutaActual(), not(equals(ruta))),
  )
})

Then('ve el mensaje de error {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.mensajeDeError(), includes(texto)))
})


import { Before } from '@badeball/cypress-cucumber-preprocessor'
import { Elenco } from '../screenplay/actor'
import { LlamarALaApi, NavegarLaWeb, UsarElBackSimulado } from '../screenplay/abilities'
import { GestionarEncuestasSimuladas } from '../screenplay/abilities/encuestas'

/** Un back simulado por escenario, compartido por todos los actores de ese escenario. */
let back = UsarElBackSimulado.enMemoria()
/** Encuestas, selección y ventanas (escenarios @ESTEBAN). */
let encuestas = GestionarEncuestasSimuladas.enMemoria()

export const elenco = new Elenco((actor) =>
  actor.whoCan(NavegarLaWeb.usandoCypress(), back, encuestas, LlamarALaApi.enEntreAulas())
)

/** «Ana», «Luis»… o un pronombre que se refiere al último actor nombrado. */
export const actorLlamado = (nombre: string) => (/^(ella|él|el)$/i.test(nombre) ? elenco.actorEnEscena() : elenco.actor(nombre))

export const backSimulado = () => back
export const encuestasSimuladas = () => encuestas

Before(() => {
  elenco.despedir()
  back = UsarElBackSimulado.enMemoria()
  encuestas = GestionarEncuestasSimuladas.enMemoria()
  // Primero lo genérico: en Cypress gana el intercept registrado al final.
  cy.simularBackVacio()
})

Before({ tags: '@web' }, () => {
  back.levantar()
})

Before({ tags: '@ESTEBAN' }, () => {
  encuestas.levantar()
})

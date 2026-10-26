import { Before } from '@badeball/cypress-cucumber-preprocessor'
import { Elenco } from '../screenplay/actor'
import { LlamarALaApi, NavegarLaWeb, UsarElBackSimulado } from '../screenplay/abilities'

/** Un back simulado por escenario, compartido por todos los actores de ese escenario. */
let back = UsarElBackSimulado.enMemoria()

export const elenco = new Elenco((actor) => actor.whoCan(NavegarLaWeb.usandoCypress(), back, LlamarALaApi.enEntreAulas()))

/** «Ana», «Luis»… o un pronombre que se refiere al último actor nombrado. */
export const actorLlamado = (nombre: string) => (/^(ella|él|el)$/i.test(nombre) ? elenco.actorEnEscena() : elenco.actor(nombre))

export const backSimulado = () => back

Before(() => {
  elenco.despedir()
  back = UsarElBackSimulado.enMemoria()
  // Primero lo genérico: en Cypress gana el intercept registrado al final.
  cy.simularBackVacio()
})

Before({ tags: '@web' }, () => {
  back.levantar()
})

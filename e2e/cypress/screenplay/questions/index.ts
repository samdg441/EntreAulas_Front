import { Actor, Question } from '../actor'
import { UsarElBackSimulado } from '../abilities'

const pregunta = <T>(descripcion: string, answeredBy: (actor: Actor) => Cypress.Chainable<T>): Question<T> => ({ descripcion, answeredBy })

export const RutaActual = {
  valor: () => pregunta('la ruta actual', () => cy.location('pathname')),
}

/** Texto visible de la página (con espera: Cypress reintenta hasta que aparezca). */
export const MensajeVisible = {
  que: (texto: string) => pregunta(`si ve «${texto}»`, () => cy.contains(texto, { timeout: 10_000 }).should('be.visible').then(() => true)),
  ausente: (texto: string) => pregunta(`si no ve «${texto}»`, () => cy.contains(texto).should('not.exist').then(() => true)),
}

export const FilaDeUsuario = {
  conCorreo: (correo: string) => pregunta(`si la lista muestra ${correo}`, () => cy.contains('td', correo).should('be.visible').then(() => true)),
}

export const CorreosRecibidos = {
  por: (correo: string) =>
    pregunta(`cuántos correos recibió ${correo}`, (actor) =>
      cy.then(() => actor.abilityTo(UsarElBackSimulado).estado.correos.filter((c) => c.para === correo).length)
    ),
}

export const CuentasRegistradas = {
  conCorreo: (correo: string) =>
    pregunta(`cuántas cuentas tienen ${correo}`, (actor) =>
      cy.then(() => actor.abilityTo(UsarElBackSimulado).estado.cuentas.filter((c) => c.email === correo).length)
    ),
}

/** Respuesta de la última llamada a la API real. */
export const UltimaRespuesta = {
  estado: () => pregunta('el estado de la última respuesta', (actor) => cy.then(() => actor.recall<Cypress.Response<unknown>>('ultimaRespuesta').status)),
  cuerpo: () =>
    pregunta('el cuerpo de la última respuesta', (actor) =>
      cy.then(() => actor.recall<Cypress.Response<Record<string, unknown>>>('ultimaRespuesta').body)
    ),
}

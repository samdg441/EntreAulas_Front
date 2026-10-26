import { Activity, Actor } from '../actor'
import { LlamarALaApi } from '../abilities'

const actividad = (descripcion: string, performAs: (actor: Actor) => void): Activity => ({ descripcion, performAs })

export const Visitar = {
  la: (ruta: string) => actividad(`visita ${ruta}`, () => void cy.visit(ruta)),
}

export const Escribir = {
  elTexto: (texto: string, opciones: { secreto?: boolean } = {}) => ({
    en: (selector: string) =>
      actividad(`escribe ${opciones.secreto ? '••••' : `«${texto}»`} en ${selector}`, () => {
        cy.get(selector).clear()
        if (texto) cy.get(selector).type(texto, { log: !opciones.secreto })
      }),
  }),
}

export const Pulsar = {
  en: (selector: string) => actividad(`pulsa ${selector}`, () => void cy.get(selector).click()),
  elBoton: (texto: string) => actividad(`pulsa el botón «${texto}»`, () => void cy.contains('button', texto).click()),
}

export const Seleccionar = {
  laOpcion: (valor: string) => ({
    en: (selector: string) => actividad(`selecciona «${valor}» en ${selector}`, () => void cy.get(selector).select(valor)),
  }),
}

export const OlvidarLaSesion = actividad('cierra la sesión del navegador', () => void cy.clearLocalStorage())

/** Llama a la API real y guarda la respuesta en las notas del actor como «ultimaRespuesta». */
export const Pedir = {
  por: (metodo: string, ruta: string, cuerpo?: Cypress.RequestBody) =>
    actividad(`pide ${metodo} ${ruta}`, (actor) => {
      const { baseUrl } = actor.abilityTo(LlamarALaApi)
      cy.request({ method: metodo, url: `${baseUrl}${ruta}`, body: cuerpo, failOnStatusCode: false, timeout: 120_000 }).then((r) =>
        actor.remember('ultimaRespuesta', r)
      )
    }),
}

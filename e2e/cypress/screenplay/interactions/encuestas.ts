import { Activity } from '../actor'

/**
 * Interacciones de bajo nivel (Screenplay): un solo gesto sobre la interfaz.
 * Las tareas de `tasks/encuestas.ts` las combinan; los pasos Gherkin nunca las usan directamente.
 */
const interaccion = (descripcion: string, performAs: () => void): Activity => ({ descripcion, performAs })

/** Escribe en el campo cuyo <label> tiene ese texto (Input del proyecto: label + input hermanos). */
export const EscribirEnElCampo = {
  etiquetado: (etiqueta: string) => ({
    elTexto: (texto: string) =>
      interaccion(`escribe «${texto}» en «${etiqueta}»`, () => {
        cy.contains('label', etiqueta, { timeout: 15_000 }).parent().find('input').as('campo')
        cy.get('@campo').clear()
        if (texto) cy.get('@campo').type(texto)
      }),
  }),
}

export const PulsarElBoton = {
  llamado: (texto: string) =>
    interaccion(`pulsa «${texto}»`, () => void cy.contains('button', texto, { timeout: 15_000 }).click()),
  con: (selector: string, descripcion: string) =>
    interaccion(`pulsa ${descripcion}`, () => void cy.get(selector, { timeout: 15_000 }).click()),
}

export const PulsarElTexto = {
  llamado: (texto: string) => interaccion(`pulsa «${texto}»`, () => void cy.contains(texto, { timeout: 15_000 }).click()),
}

/** Pulsa un botón dentro de la fila de la tabla que contiene ese texto. */
export const PulsarEnLaFila = {
  de: (textoDeLaFila: string) => ({
    elBoton: (boton: string) =>
      interaccion(`pulsa «${boton}» en la fila de «${textoDeLaFila}»`, () =>
        void cy.contains('tr', textoDeLaFila, { timeout: 15_000 }).contains('button', boton).click()
      ),
  }),
}

export const ElegirEnLaLista = {
  laOpcion: (valor: string) => ({
    en: (selector: string) => interaccion(`elige «${valor}» en ${selector}`, () => void cy.get(selector).select(valor)),
  }),
}

export const EscribirEn = {
  elSelector: (selector: string) => ({
    elTexto: (texto: string) =>
      interaccion(`escribe «${texto}» en ${selector}`, () => void cy.get(selector, { timeout: 15_000 }).clear().type(texto)),
  }),
}

/** Fija la fecha del navegador sin congelar los temporizadores (animaciones y esperas siguen andando). */
export const FijarLaFechaDeHoy = {
  en: (fechaIso: string) =>
    interaccion(`fija la fecha de hoy en ${fechaIso}`, () => {
      const [anio, mes, dia] = fechaIso.split('-').map(Number)
      cy.clock(new Date(anio, mes - 1, dia, 9, 0, 0), ['Date'])
    }),
}

export const EsperarLaRespuesta = {
  de: (alias: string) => interaccion(`espera la respuesta de @${alias}`, () => void cy.wait(`@${alias}`)),
}

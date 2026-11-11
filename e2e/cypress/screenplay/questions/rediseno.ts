import { Question } from '../actor'

const pregunta = <T>(descripcion: string, answeredBy: () => Cypress.Chainable<T>): Question<T> => ({ descripcion, answeredBy })

export const IndicadorDelPanel = {
  llamado: (nombre: string) =>
    pregunta(`el valor del indicador «${nombre}»`, () => cy.contains('dt', nombre, { timeout: 15_000 }).parent().invoke('text')),
}

export const SeccionDeLaBarra = {
  con: (seccion: string, enlace: string) =>
    pregunta(`si la sección «${seccion}» de la barra lateral tiene «${enlace}»`, () =>
      cy.get('nav[aria-label="Navegación principal"]', { timeout: 15_000 })
        .contains('p', seccion)
        .parent()
        .contains('a', enlace)
        .should('be.visible')
        .then(() => true)
    ),
}

export const DiasDelCalendario = {
  conLimites: () =>
    pregunta('si el calendario marca apertura y cierre', () =>
      cy.get('[role="gridcell"][aria-label*="apertura de la evaluación"]', { timeout: 15_000 }).should('have.length', 1).then(() =>
        cy.get('[role="gridcell"][aria-label*="cierre de la evaluación"]').should('have.length', 1).then(() => true)
      )
    ),
}

export const EventosDeAuditoria = {
  listados: () => pregunta('cuántos eventos lista la auditoría', () => cy.get('table tbody tr', { timeout: 15_000 }).its('length')),
}

export const DocentesListados = {
  incluye: (nombre: string) => pregunta(`si la lista incluye a ${nombre}`, () => cy.get('section[aria-labelledby="titulo-lista"]').then(($s) => $s.text().includes(nombre))),
}

export const AtributoDeLaPagina = {
  html: (atributo: string) => pregunta(`el atributo «${atributo}» de <html>`, () => cy.get('html').invoke('attr', atributo)),
  tieneClase: (clase: string) => pregunta(`si <html> tiene la clase ${clase}`, () => cy.get('html').then(($h) => $h.hasClass(clase))),
}

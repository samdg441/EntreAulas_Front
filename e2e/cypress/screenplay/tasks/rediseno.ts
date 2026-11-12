import { Activity } from '../actor'

const actividad = (descripcion: string, performAs: () => void): Activity => ({ descripcion, performAs })

/** Tareas del panel rediseñado del coordinador (Screenplay: el actor sabe QUÉ hace, no CÓMO se pinta). */
export const AbrirLaAuditoria = actividad('abre la auditoría desde la barra lateral', () => {
  cy.contains('nav a', 'Auditoría', { timeout: 15_000 }).click()
  cy.wait('@auditoria')
})

export const FiltrarLaAuditoriaPor = {
  accion: (accion: string) =>
    actividad(`filtra la auditoría por «${accion}»`, () => {
      cy.get('#au-accion').select(accion)
      cy.wait('@auditoria')
    }),
}

export const AbrirLaGestionDeProfesores = actividad('abre la gestión de profesores desde la barra lateral', () => {
  cy.contains('nav a', 'Gestión de profesores', { timeout: 15_000 }).click()
})

export const FiltrarDocentesEnRiesgo = actividad('filtra a los docentes en riesgo', () => {
  cy.contains('[role="radio"]', 'En riesgo', { timeout: 15_000 }).click()
})

export const ElegirPreferencias = {
  modo: (modo: string) => actividad(`elige el modo «${modo}»`, () => cy.contains('[role="radio"]', modo).click()),
  idioma: (idioma: string) => actividad(`elige el idioma «${idioma}»`, () => cy.contains('[role="radio"]', idioma).click()),
  letra: (letra: string) => actividad(`elige la letra «${letra}»`, () => cy.contains('[role="radio"]', new RegExp(`^${letra}$`)).click()),
}

export const AbrirLasPreferencias = actividad('abre las preferencias de visualización', () => {
  cy.get('button[aria-label="Preferencias de visualización"]', { timeout: 15_000 }).click()
})

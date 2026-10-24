/**
 * Accesibilidad de RQ6 y RQ17.
 * El rechazo de acceso y el QR sin token se leen como texto, con botones que tienen nombre.
 */
describe('RQ6 y RQ17 — Accesibilidad', () => {
  it('RQ6: la pantalla de acceso denegado tiene título y un enlace con nombre', () => {
    cy.visit('/forbidden')

    cy.contains('h1', 'Acceso no permitido').should('be.visible')
    cy.get('a, button').filter(':visible').first().should('not.have.attr', 'aria-hidden', 'true')
  })

  it('RQ17: el error del QR tiene título, descripción y botones con nombre', () => {
    cy.visit('/qr-evaluacion')

    cy.contains('No se pudo abrir la encuesta').should('be.visible')
    cy.contains('No se encontró token en el QR.').should('be.visible')
    cy.contains('button', 'Reintentar').should('be.visible')
    cy.contains('button', 'Ir a login').focus().should('be.focused')
  })

  it('el login del estudiante asocia la etiqueta del correo con el campo', () => {
    cy.visit('/login')

    cy.contains('label', 'Correo Institucional').should('have.attr', 'for')
    cy.get('input[type="email"]').should('have.attr', 'required')
    cy.get('input[type="password"]').should('have.attr', 'type', 'password')
    cy.get('button[type="submit"]').should('contain.text', 'Iniciar sesión')
  })
})

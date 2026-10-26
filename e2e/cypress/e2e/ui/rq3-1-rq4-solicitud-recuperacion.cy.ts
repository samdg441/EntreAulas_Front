/**
 * RQ3.1 — Solicitud de recuperación y RQ4 — Envío del enlace por correo.
 * El front pide el enlace a POST /api/auth/forgot-password; el correo lo envía el back (RQ4),
 * así que en la UI se verifica la petición y la confirmación genérica (sin revelar si la cuenta existe).
 */
const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'

describe('RQ3.1 / RQ4 — UI: solicitud del enlace de recuperación', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.visit('/forgot-password')
  })

  context('escenarios exitosos', () => {
    it('correo registrado: envía la solicitud y confirma con el mensaje genérico', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 200, body: { message: MENSAJE_GENERICO } }).as('solicitud')

      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()

      cy.wait('@solicitud').its('request.body').should('deep.equal', { email: 'eva@soyudemedellin.edu.co' })
      cy.contains('Solicitud enviada').should('be.visible')
      cy.contains(MENSAJE_GENERICO).should('be.visible')
    })

    it('correo no registrado: la respuesta es idéntica (no se enumeran cuentas)', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 200, body: { message: MENSAJE_GENERICO } }).as('solicitud')

      cy.get('input[type="email"]').type('nadie@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()

      cy.wait('@solicitud')
      cy.contains(MENSAJE_GENERICO).should('be.visible')
    })
  })

  context('escenarios alternativos', () => {
    it('el back no envía mensaje: el front usa el texto genérico por defecto', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 200, body: {} }).as('solicitud')
      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.wait('@solicitud')
      cy.contains(MENSAJE_GENERICO).should('be.visible')
    })

    it('después de enviar, "Ir al inicio de sesión" vuelve al login', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 200, body: { message: MENSAJE_GENERICO } })
      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.contains('button', 'Ir al inicio de sesión').click()
      cy.location('pathname').should('eq', '/login')
    })

    it('mientras espera la respuesta muestra "Enviando..." y deshabilita el botón', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 200, body: { message: MENSAJE_GENERICO }, delay: 800 })
      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.contains('button', 'Enviando...').should('be.disabled')
    })
  })

  context('escenarios de error', () => {
    it('formato de correo inválido: no llama al back', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', cy.spy().as('solicitud'))
      cy.get('input[type="email"]').type('eva@sin-punto')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.contains('Por favor, ingresa un correo electrónico válido').should('be.visible')
      cy.get('@solicitud').should('not.have.been.called')
    })

    it('límite de intentos (429): muestra el mensaje del back y no confirma', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 429,
        body: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde' },
      }).as('solicitud')
      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.wait('@solicitud')
      cy.contains('Demasiadas solicitudes').should('be.visible')
      cy.contains('Solicitud enviada').should('not.exist')
    })

    it('falla del envío de correo (500): mensaje genérico de error', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', { statusCode: 500, body: {} }).as('solicitud')
      cy.get('input[type="email"]').type('eva@soyudemedellin.edu.co')
      cy.contains('button', 'Enviar enlace de recuperación').click()
      cy.wait('@solicitud')
      cy.contains('Error al enviar la solicitud de recuperación').should('be.visible')
    })
  })
})

export {}

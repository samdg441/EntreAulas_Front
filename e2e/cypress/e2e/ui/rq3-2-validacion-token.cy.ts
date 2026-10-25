/**
 * RQ3.2 — Validación del token de recuperación.
 * Al abrir /reset-password?token&email el front consulta GET /api/auth/validate-reset-token/:token?email=
 * y solo muestra el formulario si el back confirma que el token es válido.
 */
const TOKEN = 'a'.repeat(64)
const EMAIL = 'eva@soyudemedellin.edu.co'

describe('RQ3.2 — UI: validación del enlace de recuperación', () => {
  beforeEach(() => {
    cy.simularBackVacio()
  })

  it('token válido: consulta al back con token y correo y muestra el formulario', () => {
    cy.intercept('GET', '**/api/auth/validate-reset-token/*', { statusCode: 200, body: { message: 'Token válido' } }).as('validar')

    cy.visit(`/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)

    cy.wait('@validar').then(({ request }) => {
      expect(request.url).to.contain(`/validate-reset-token/${TOKEN}`)
      expect(new URL(request.url).searchParams.get('email')).to.eq(EMAIL)
    })
    cy.contains('Crear nueva contraseña').should('be.visible')
    cy.get('input[type="email"]').should('have.value', EMAIL).and('be.disabled')
  })

  it('mientras valida muestra "Validando el enlace de recuperación..."', () => {
    cy.intercept('GET', '**/api/auth/validate-reset-token/*', { statusCode: 200, body: {}, delay: 800 })
    cy.visit(`/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)
    cy.contains('Validando el enlace de recuperación...').should('be.visible')
  })

  it('token vencido o ya usado: muestra el error del back y ofrece pedir otro enlace', () => {
    cy.intercept('GET', '**/api/auth/validate-reset-token/*', {
      statusCode: 400,
      body: { error: 'Token inválido o expirado' },
    }).as('validar')

    cy.visit(`/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)

    cy.wait('@validar')
    cy.contains('Enlace no válido').should('be.visible')
    cy.contains('Token inválido o expirado').should('be.visible')
    cy.get('form').should('not.exist')
    cy.contains('button', 'Solicitar un nuevo enlace').click()
    cy.location('pathname').should('eq', '/forgot-password')
  })

  const incompletos = [
    ['sin token', `/reset-password?email=${encodeURIComponent(EMAIL)}`],
    ['sin correo', `/reset-password?token=${TOKEN}`],
    ['sin parámetros', '/reset-password'],
  ]
  incompletos.forEach(([caso, ruta]) => {
    it(`enlace ${caso}: no consulta al back y lo declara incompleto`, () => {
      cy.intercept('GET', '**/api/auth/validate-reset-token/*', cy.spy().as('validar'))
      cy.visit(ruta)
      cy.contains('El enlace de recuperación es inválido o está incompleto.').should('be.visible')
      cy.get('@validar').should('not.have.been.called')
    })
  })

  it('el token con caracteres especiales se codifica en la URL de la petición', () => {
    // Regex: el glob ** no coincide con un segmento que trae %2F codificado.
    cy.intercept({ method: 'GET', url: /\/api\/auth\/validate-reset-token\// }, { statusCode: 400, body: { error: 'Token inválido o expirado' } }).as('validar')
    cy.visit(`/reset-password?token=${encodeURIComponent('../x?y')}&email=${encodeURIComponent(EMAIL)}`)
    cy.wait('@validar').its('request.url').should('contain', '/validate-reset-token/..%2Fx%3Fy')
  })
})

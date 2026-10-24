import { usuarios } from '../../support/commands'

/**
 * RQ6 — Control de acceso por roles.
 * Sin sesión va al login, el estudiante entra a su panel y no administra usuarios.
 */
describe('RQ6 — Control de acceso por roles (E2E)', () => {
  it('sin sesión, usuarios del sistema vuelve al login', () => {
    cy.visit('/admin/users')

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('el estudiante entra a su dashboard', () => {
    cy.simularBackVacio()
    cy.intercept({ method: 'POST', pathname: '/api/auth/login' }, {
      token: 'token-e2e',
      user: usuarios.estudiante,
    }).as('login')

    cy.visit('/login')
    cy.get('input[type="email"]').type('eva.estudiante@soyudemedellin.edu.co')
    cy.get('input[type="password"]').type('Clave-Segura2026!', { log: false })
    cy.get('button[type="submit"]').click()

    cy.wait('@login').its('response.statusCode').should('eq', 200)
    cy.location('pathname').should('eq', '/dashboard-estudiante')
  })

  it('el estudiante no administra usuarios', () => {
    cy.simularBackVacio()
    cy.visitarConSesion('/admin/users', usuarios.estudiante)

    cy.location('pathname').should('eq', '/forbidden')
    cy.contains('h1', 'Acceso no permitido').should('be.visible')
  })
})

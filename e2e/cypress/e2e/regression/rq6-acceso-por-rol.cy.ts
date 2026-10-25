import { usuarios } from '../../support/commands'

/**
 * RQ6 — Regresión de acceso por rol (mismo estilo que RQ19).
 * Sesión simulada en localStorage + cy.intercept para el back.
 */
describe('RQ6 — Control de acceso por roles (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
  })

  it('sin sesión, /admin/users manda al login', () => {
    cy.visit('/admin/users')

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('un estudiante entra a /dashboard-estudiante', () => {
    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)

    cy.location('pathname').should('eq', '/dashboard-estudiante')
    cy.contains('Acceso no permitido').should('not.exist')
  })

  it('Regresión RQ6: un estudiante con sesión no administra usuarios', () => {
    cy.visitarConSesion('/admin/users', usuarios.estudiante)

    cy.location('pathname').should('eq', '/forbidden')
    cy.contains('h1', 'Acceso no permitido').should('be.visible')
  })

  it('Regresión RQ6: un usuario guardado corrupto no deja la pantalla en blanco', () => {
    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'token-e2e')
        win.localStorage.setItem('user', '{no es json')
      },
    })

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
  })
})

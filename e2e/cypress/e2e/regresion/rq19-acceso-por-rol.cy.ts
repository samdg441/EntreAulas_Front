import { usuarios } from '../../support/commands'

describe('RQ19 — Acceso al dashboard según el rol (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
  })

  it('sin sesión, /dashboard-admin manda al login', () => {
    cy.visit('/dashboard-admin')

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('un admin entra a /dashboard-admin', () => {
    cy.visitarConSesion('/dashboard-admin', usuarios.admin)

    cy.location('pathname').should('eq', '/dashboard-admin')
    cy.contains('Acceso no permitido').should('not.exist')
  })

  it('un usuario estudiante + admin llega al panel de admin desde /dashboard', () => {
    cy.visitarConSesion('/dashboard', usuarios.adminEstudiante)

    cy.location('pathname').should('eq', '/dashboard-admin')
  })

  it('Regresión RQ19: un estudiante con sesión no entra al panel de admin', () => {
    cy.visitarConSesion('/dashboard-admin', usuarios.estudiante)

    cy.location('pathname').should('eq', '/forbidden')
    cy.contains('h1', 'Acceso no permitido').should('be.visible')
  })

  it('Regresión RQ19: un usuario guardado corrupto no deja la pantalla en blanco', () => {
    cy.visit('/dashboard-admin', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'token-e2e')
        win.localStorage.setItem('user', '{no es json')
      },
    })

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
  })

  it('Brecha conocida: un estudiante abre /dashboard-coordinador, pero el back le niega los datos', () => {
    cy.intercept(
      { pathname: '/api/coordinador/dashboard-summary' },
      { statusCode: 403, body: { error: 'Solo coordinadores pueden acceder a esta información.' } }
    ).as('resumen')

    cy.visitarConSesion('/dashboard-coordinador', usuarios.estudiante)

    cy.wait('@resumen').its('response.statusCode').should('eq', 403)
    cy.contains('No se encontraron docentes para el filtro actual.').should('be.visible')
  })
})

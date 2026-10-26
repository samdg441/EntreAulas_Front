import { usuarios } from '../../support/commands'

/**
 * RQ27 — Relación estudiante–materia en el dashboard.
 * Fixture con la materia de Eva, igual que el dashboard del coordinador.
 */
describe('RQ27 — Relación estudiante–materia (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.fixture('materias-estudiante.json').then((datos) => {
      cy.intercept({ method: 'GET', pathname: '/api/teachers/student-stats' }, datos.stats).as('stats')
      cy.intercept(
        { method: 'GET', pathname: '/api/teachers/student-enrolled-subjects' },
        { materiasMatriculadas: datos.materias, total: datos.materias.length }
      ).as('materias')
    })
    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)
    cy.wait('@materias')
  })

  it('el estudiante ve el curso, el grupo y el docente de su materia', () => {
    cy.wait('@materias').its('response.statusCode').should('eq', 200)
    cy.contains('Relación estudiante–materia del periodo actual').should('be.visible')
    cy.contains('SIS-101 · Programación I').should('be.visible')
    cy.contains('Grupo 1 · Ana Pérez').should('be.visible')
    cy.contains('2026-1').should('be.visible')
  })
})

describe('RQ27 — Lista vacía y sin sesión (E2E)', () => {
  it('Regresión RQ27: sin materias matriculadas la lista queda vacía', () => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/teachers/student-stats' }, {
      evaluacionesCompletadas: 0,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 0,
      promedioGeneral: 0,
      progresoGeneral: 0,
    })
    cy.intercept(
      { method: 'GET', pathname: '/api/teachers/student-enrolled-subjects' },
      { materiasMatriculadas: [], total: 0 }
    ).as('materias')

    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)

    cy.wait('@materias').its('response.statusCode').should('eq', 200)
    cy.contains('No tienes materias matriculadas este semestre.').should('be.visible')
    cy.contains('SIS-101 · Programación I').should('not.exist')
  })

  it('Regresión RQ27: sin sesión no muestra las materias', () => {
    cy.visit('/dashboard-estudiante')

    cy.location('pathname').should('eq', '/login')
    cy.contains('Relación estudiante–materia del periodo actual').should('not.exist')
  })
})

describe('RQ27 — Materias cuando el back falla (E2E)', () => {
  it('un 500 deja la lista vacía y no inventa una materia', () => {
    cy.simularBackVacio()
    cy.intercept(
      { method: 'GET', pathname: '/api/teachers/student-enrolled-subjects' },
      { statusCode: 500, body: { error: 'fallo' } }
    ).as('materias')

    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)

    cy.wait('@materias').its('response.statusCode').should('eq', 500)
    cy.contains('No tienes materias matriculadas este semestre.').should('be.visible')
    cy.contains('SIS-101').should('not.exist')
  })
})

import { usuarios } from '../../support/commands'

const materiaDeEva = {
  id: 11,
  grupo: {
    numeroGrupo: 1,
    horario: 'Lun 8-10',
    aula: 'A-101',
    curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
    profesor: { nombre: 'Ana Pérez' },
    periodo: { codigo: '2026-1', nombre: '2026-I' },
  },
}

/**
 * RQ27 — Relación estudiante–materia.
 * Con materia, sin materias y cuando el back falla.
 */
describe('RQ27 — Relación estudiante–materia (E2E)', () => {
  const abrirConMaterias = (materias: unknown[]) => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/teachers/student-stats' }, {
      evaluacionesCompletadas: 0,
      evaluacionesPendientes: 0,
      materiasMatriculadas: materias.length,
      promedioGeneral: 0,
      progresoGeneral: 0,
    }).as('stats')
    cy.intercept(
      { method: 'GET', pathname: '/api/teachers/student-enrolled-subjects' },
      { materiasMatriculadas: materias, total: materias.length }
    ).as('materias')
    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)
  }

  it('el estudiante ve la relación con su materia', () => {
    abrirConMaterias([materiaDeEva])

    cy.wait('@materias').its('response.statusCode').should('eq', 200)
    cy.contains('Relación estudiante–materia del periodo actual').should('be.visible')
    cy.contains('SIS-101 · Programación I').should('be.visible')
    cy.contains('Ana Pérez').should('be.visible')
  })

  it('sin materias matriculadas la lista queda vacía', () => {
    abrirConMaterias([])

    cy.wait('@materias').its('response.statusCode').should('eq', 200)
    cy.contains('No tienes materias matriculadas este semestre.').should('be.visible')
    cy.contains('SIS-101 · Programación I').should('not.exist')
  })

  it('sin sesión no muestra las materias', () => {
    cy.visit('/dashboard-estudiante')

    cy.location('pathname').should('eq', '/login')
    cy.contains('Relación estudiante–materia del periodo actual').should('not.exist')
  })

  it('si el back falla, no inventa una materia', () => {
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

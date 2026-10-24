import { usuarios } from '../../support/commands'

/**
 * Flujo de referencia para Cypress Studio.
 * El estudiante ve su materia. Sirve para compararlo con una grabación.
 */
describe('Flujo de referencia para Cypress Studio — RQ27', () => {
  it('abre el panel y comprueba la materia del estudiante', () => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/teachers/student-stats' }, {
      evaluacionesCompletadas: 1,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 1,
      promedioGeneral: 4,
      progresoGeneral: 0,
    })
    cy.intercept({ method: 'GET', pathname: '/api/teachers/student-enrolled-subjects' }, {
      materiasMatriculadas: [
        {
          id: 11,
          grupo: {
            numeroGrupo: 1,
            horario: 'Lun 8-10',
            aula: 'A-101',
            curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
            profesor: { nombre: 'Ana Pérez' },
            periodo: { codigo: '2026-1', nombre: '2026-I' },
          },
        },
      ],
      total: 1,
    }).as('materias')

    cy.visitarConSesion('/dashboard-estudiante', usuarios.estudiante)
    cy.wait('@materias')

    cy.contains('SIS-101 · Programación I').should('be.visible')
    cy.contains('Relación estudiante–materia del periodo actual').should('be.visible')
  })
})

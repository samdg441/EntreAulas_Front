import { usuarios } from '../../support/commands'

/**
 * RQ15 — UI del formulario de generación de QR (estilo CYPRESS-ENTERPRISE/ui).
 * Valida el front sin llegar al back: fechas vacías y controles visibles.
 */
describe('RQ15 — UI: validación de la generación de QR', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/users/academic-structure' }, { facultades: [] })
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, cy.spy().as('lote'))
    cy.intercept({ method: 'PUT', pathname: '/api/periodos/evaluacion' }, cy.spy().as('ventana'))
    cy.visitarConSesion('/admin/qr', usuarios.admin)
  })

  it('sin fechas informa el faltante y no llama al back', () => {
    cy.contains('button', 'Confirmar generación').click()

    cy.contains('Completa Fecha de inicio, Fecha de cierre y Período.').should('be.visible')
    cy.location('pathname').should('eq', '/admin/qr')
    cy.get('@lote').should('not.have.been.called')
    cy.get('@ventana').should('not.have.been.called')
  })

  it('muestra período, fechas y el botón de confirmación', () => {
    cy.contains('Generación de QR').should('be.visible')
    cy.get('#admin-qr-periodo').should('have.attr', 'placeholder', '2026-1')
    cy.get('#admin-qr-inicio').should('have.attr', 'type', 'date')
    cy.get('#admin-qr-cierre').should('have.attr', 'type', 'date')
    cy.contains('button', 'Confirmar generación').should('be.visible')
  })
})

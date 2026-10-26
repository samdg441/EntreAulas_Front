import { usuarios } from '../../support/commands'

const qrValido = {
  profesorId: 13,
  profesorNombre: 'Ana Pérez',
  cursoId: 12,
  cursoNombre: 'Programación I',
  cursoCodigo: 'SIS-101',
  grupoId: 63,
}

/**
 * RQ14 — Auto-inscripción por QR. RQ17 — El token se resuelve o se rechaza.
 * El back se simula con cy.intercept, igual que RQ18.
 */
describe('RQ14 y RQ17 — Entrada por QR (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
  })

  it('RQ17: un QR sin token no abre la evaluación y no llama al back', () => {
    cy.intercept({ method: 'GET', pathname: '/api/qr-evaluaciones/**' }, cy.spy().as('consulta'))
    cy.visit('/qr-evaluacion')

    cy.contains('No se pudo abrir la encuesta').should('be.visible')
    cy.contains('No se encontró token en el QR.').should('be.visible')
    cy.location('pathname').should('eq', '/qr-evaluacion')
    cy.get('@consulta').should('not.have.been.called')
  })

  it('RQ17: con token y sin sesión vuelve al login y no resuelve el QR', () => {
    cy.intercept({ method: 'GET', pathname: '/api/qr-evaluaciones/tok-14' }, cy.spy().as('consulta'))
    cy.visit('/qr-evaluacion?token=tok-14')

    cy.location('pathname').should('eq', '/login')
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('@consulta').should('not.have.been.called')
  })

  it('RQ14: el estudiante se inscribe con un QR válido', () => {
    cy.intercept({ method: 'GET', pathname: '/api/qr-evaluaciones/tok-14' }, qrValido).as('qr')
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/tok-14/auto-enroll' },
      { statusCode: 201, body: { enrolled: true, created: true, grupoId: 63 } }
    ).as('inscripcion')

    cy.visitarConSesion('/qr-evaluacion?token=tok-14', usuarios.estudiante)

    cy.wait('@qr').its('request.url').should('include', '/api/qr-evaluaciones/tok-14')
    cy.wait('@inscripcion').its('response.statusCode').should('eq', 201)
    cy.location('pathname', { timeout: 15000 }).should('eq', '/evaluate/form')
  })

  it('Regresión RQ14: si el back rechaza el QR, la encuesta no se abre', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/qr-evaluaciones/tok-malo' },
      { statusCode: 404, body: { error: 'QR inválido o expirado.' } }
    ).as('qr')
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/tok-malo/auto-enroll' }, cy.spy().as('inscripcion'))

    cy.visitarConSesion('/qr-evaluacion?token=tok-malo', usuarios.estudiante)

    cy.wait('@qr').its('response.statusCode').should('eq', 404)
    cy.contains('No se pudo abrir la encuesta').should('be.visible')
    cy.contains('QR inválido o expirado.').should('be.visible')
    cy.location('pathname').should('eq', '/qr-evaluacion')
    cy.get('@inscripcion').should('not.have.been.called')
  })
})

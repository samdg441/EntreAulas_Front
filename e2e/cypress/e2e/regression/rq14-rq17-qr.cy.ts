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
 * RQ14, RQ15, RQ16 y RQ17 — QR de evaluación.
 * Exitoso, alternativo y de error, con el back simulado.
 */
describe('RQ14 y RQ17 — Entrada por QR (E2E)', () => {
  it('RQ17: un QR sin token no abre la evaluación', () => {
    cy.visit('/qr-evaluacion')

    cy.contains('No se pudo abrir la encuesta').should('be.visible')
    cy.contains('No se encontró token en el QR.').should('be.visible')
    cy.location('pathname').should('eq', '/qr-evaluacion')
  })

  it('RQ17: con token y sin sesión vuelve al login', () => {
    cy.visit('/qr-evaluacion?token=tok-14')

    cy.location('pathname').should('eq', '/login')
  })

  it('RQ14: el estudiante se inscribe con un QR válido', () => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/qr-evaluaciones/tok-14' }, qrValido).as('qr')
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/tok-14/auto-enroll' },
      { statusCode: 201, body: { enrolled: true, created: true, grupoId: 63 } }
    ).as('inscripcion')

    cy.visitarConSesion('/qr-evaluacion?token=tok-14', usuarios.estudiante)

    cy.wait('@qr').its('response.statusCode').should('eq', 200)
    cy.wait('@inscripcion').its('response.statusCode').should('eq', 201)
    cy.location('pathname', { timeout: 15000 }).should('eq', '/evaluate/form')
  })

  it('RQ14: un QR que no inscribe no abre la encuesta', () => {
    cy.simularBackVacio()
    cy.intercept(
      { method: 'GET', pathname: '/api/qr-evaluaciones/tok-malo' },
      { statusCode: 404, body: { error: 'QR inválido o expirado.' } }
    ).as('qr')

    cy.visitarConSesion('/qr-evaluacion?token=tok-malo', usuarios.estudiante)

    cy.wait('@qr').its('response.statusCode').should('eq', 404)
    cy.contains('No se pudo abrir la encuesta').should('be.visible')
    cy.contains('QR inválido o expirado.').should('be.visible')
    cy.location('pathname').should('eq', '/qr-evaluacion')
  })
})

describe('RQ15 y RQ16 — Generación y correo de QR (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/users/academic-structure' }, { facultades: [] })
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, cy.spy().as('lote'))
    cy.visitarConSesion('/admin/qr', usuarios.admin)
  })

  it('RQ15: el administrador abre la generación de QR', () => {
    cy.contains('Generación de QR').should('be.visible')
    cy.contains('button', 'Confirmar generación').should('be.visible')
  })

  it('RQ15: sin fechas ni grupos no genera el QR', () => {
    cy.contains('button', 'Confirmar generación').click()

    cy.contains('Completa Fecha de inicio, Fecha de cierre y Período.').should('be.visible')
    cy.get('@lote').should('not.have.been.called')
  })

  it('RQ15: con fechas y sin grupos avisa y tampoco llama al back', () => {
    cy.get('input[type="date"]').eq(0).type('2026-02-01')
    cy.get('input[type="date"]').eq(1).type('2026-06-01')
    cy.get('#admin-qr-periodo').type('2026-1')
    cy.contains('button', 'Confirmar generación').click()

    cy.contains('Selecciona al menos un curso/grupo.').should('be.visible')
    cy.get('@lote').should('not.have.been.called')
  })

  it('RQ16: sin grupos no se puede compartir el QR por correo', () => {
    cy.contains('Generación de QR').should('be.visible')
    cy.contains('Compartir QRs por correo').should('not.exist')
  })
})

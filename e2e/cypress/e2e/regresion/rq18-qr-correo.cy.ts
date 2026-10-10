import { usuarios } from '../../support/commands'

/**
 * RQ18 — Generar QR de grupos y compartirlos por correo desde /admin/qr.
 */
describe('RQ18 — QR por correo (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.fixture('qr-admin.json').then((datos) => {
      cy.intercept({ method: 'GET', pathname: '/api/users/academic-structure' }, datos.estructura)
      cy.intercept({ method: 'GET', pathname: '/api/users/grupos-by-career/7' }, datos.grupos).as('grupos')
      cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, datos.lote).as('lote')
    })
    cy.visitarConSesion('/admin/qr', usuarios.admin)

    cy.get('#admin-qr-carrera').select('Ingenierías · Ingeniería de Sistemas')
    cy.contains('button', 'Cargar cursos').click()
    cy.wait('@grupos')
  })

  function generarQrDeLosGruposDeCalculo() {
    cy.contains('td', 'MAT101').should('have.length.at.least', 1)
    cy.get('tbody tr').eq(0).find('input[type="checkbox"]').check()
    cy.get('tbody tr').eq(1).find('input[type="checkbox"]').check()
    cy.contains('button', 'Generar QR').click()
    cy.wait('@lote').its('request.body').should('deep.equal', { grupoIds: [63, 64] })
    cy.contains('2 grupo(s) seleccionados').should('be.visible')
  }

  function abrirCorreo() {
    cy.contains('button', 'Compartir email').click()
    cy.contains('h3', 'Compartir QRs por correo').should('be.visible')
  }

  it('RQ18: con grupos, destinatario y asunto, envía solo los grupos con QR', () => {
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/share-email' }, { message: 'Correo enviado correctamente', totalLinks: 2 }).as('correo')
    generarQrDeLosGruposDeCalculo()
    abrirCorreo()

    cy.get('input[placeholder="Destinatario"]').type('ana@udemedellin.edu.co')
    cy.contains('button', 'Enviar').click()

    cy.wait('@correo').its('request.body').should('include', { to: 'ana@udemedellin.edu.co' })
    cy.get('@correo').its('request.body.grupoIds').should('deep.equal', [63, 64])
    cy.contains('Correo enviado correctamente.').should('be.visible')
    cy.contains('h3', 'Compartir QRs por correo').should('not.exist')
  })

  it('Regresión RQ18: sin destinatario no se llama al back', () => {
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/share-email' }, cy.spy().as('envio'))
    generarQrDeLosGruposDeCalculo()
    abrirCorreo()

    cy.contains('button', 'Enviar').click()

    cy.contains('Completa correo/asunto y genera QRs antes de enviar.').should('be.visible')
    cy.get('@envio').should('not.have.been.called')
  })

  it('Regresión RQ18: si el back rechaza el correo, el usuario ve el motivo y el modal sigue abierto', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/share-email' },
      { statusCode: 400, body: { error: 'Correo de destino inválido.' } }
    ).as('correo')
    generarQrDeLosGruposDeCalculo()
    abrirCorreo()

    cy.get('input[placeholder="Destinatario"]').type('no-es-un-correo')
    cy.contains('button', 'Enviar').click()

    cy.wait('@correo')
    cy.contains('Correo de destino inválido.').should('be.visible')
    cy.contains('h3', 'Compartir QRs por correo').should('be.visible')
  })

  it('Regresión RQ18: sin grupos seleccionados no se generan QR', () => {
    cy.contains('button', 'Generar QR').should('be.disabled')
  })
})

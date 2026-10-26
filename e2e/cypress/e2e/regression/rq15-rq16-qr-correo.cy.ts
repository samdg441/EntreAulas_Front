import { usuarios } from '../../support/commands'

/**
 * RQ15 — Generar QR en lote desde /admin/qr.
 * RQ16 — Compartirlos por correo.
 * Mismo montaje que RQ18: fixture, carrera, cursos y cy.intercept.
 */
describe('RQ15 y RQ16 — Generación de QR y correo (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.fixture('qr-admin.json').then((datos) => {
      cy.intercept({ method: 'GET', pathname: '/api/users/academic-structure' }, datos.estructura)
      cy.intercept({ method: 'GET', pathname: '/api/users/grupos-by-career/7' }, datos.grupos).as('grupos')
      cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, datos.lote).as('lote')
      cy.intercept({ method: 'PUT', pathname: '/api/periodos/evaluacion' }, {
        periodoId: 4,
        ano: 2026,
        semestre: 1,
        fechaInicio: '2026-02-01',
        fechaFin: '2026-06-01',
      }).as('ventana')
    })
    cy.visitarConSesion('/admin/qr', usuarios.admin)

    cy.get('#admin-qr-carrera').select('Ingenierías · Ingeniería de Sistemas')
    cy.contains('button', 'Cargar cursos').click()
    cy.wait('@grupos')
  })

  function marcarGruposDeCalculo() {
    cy.contains('td', 'MAT101').should('have.length.at.least', 1)
    cy.get('tbody tr').eq(0).find('input[type="checkbox"]').check()
    cy.get('tbody tr').eq(1).find('input[type="checkbox"]').check()
  }

  function llenarPeriodo() {
    cy.get('#admin-qr-inicio').type('2026-02-01')
    cy.get('#admin-qr-cierre').type('2026-06-01')
    cy.get('#admin-qr-periodo').type('2026-1')
  }

  function abrirCorreo() {
    marcarGruposDeCalculo()
    cy.contains('button', 'Generar QR').click()
    cy.wait('@lote').its('request.body').should('deep.equal', { grupoIds: [63, 64] })
    cy.contains('2 grupo(s) seleccionados').should('be.visible')
    cy.contains('button', 'Compartir email').click()
    cy.contains('h3', 'Compartir QRs por correo').should('be.visible')
  }

  it('RQ15: con fechas, período y grupos, guarda la ventana y genera solo esos QR', () => {
    marcarGruposDeCalculo()
    llenarPeriodo()
    cy.contains('button', 'Confirmar generación').click()

    cy.wait('@ventana').its('request.body').should('deep.equal', {
      periodo: '2026-1',
      fechaInicio: '2026-02-01',
      fechaFin: '2026-06-01',
    })
    cy.wait('@lote').its('request.body').should('deep.equal', { grupoIds: [63, 64] })
    cy.contains('QR generados y fechas de evaluación guardadas en el calendario.').should('be.visible')
  })

  it('Regresión RQ15: sin fechas no se llama al back', () => {
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, cy.spy().as('loteVacio'))
    cy.intercept({ method: 'PUT', pathname: '/api/periodos/evaluacion' }, cy.spy().as('ventanaVacia'))
    marcarGruposDeCalculo()
    cy.contains('button', 'Confirmar generación').click()

    cy.contains('Completa Fecha de inicio, Fecha de cierre y Período.').should('be.visible')
    cy.get('@loteVacio').should('not.have.been.called')
    cy.get('@ventanaVacia').should('not.have.been.called')
  })

  it('Regresión RQ15: con fechas y sin grupos no genera el QR', () => {
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/batch' }, cy.spy().as('loteVacio'))
    cy.intercept({ method: 'PUT', pathname: '/api/periodos/evaluacion' }, cy.spy().as('ventanaVacia'))
    llenarPeriodo()
    cy.contains('button', 'Confirmar generación').click()

    cy.contains('Selecciona al menos un curso/grupo.').should('be.visible')
    cy.get('@loteVacio').should('not.have.been.called')
    cy.get('@ventanaVacia').should('not.have.been.called')
  })

  it('Regresión RQ15: si el back rechaza el lote, el usuario ve el motivo', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/batch' },
      { statusCode: 400, body: { error: 'grupoIds inválidos.' } }
    ).as('loteMal')
    marcarGruposDeCalculo()
    llenarPeriodo()
    cy.contains('button', 'Confirmar generación').click()

    cy.wait('@ventana')
    cy.wait('@loteMal')
    cy.contains('grupoIds inválidos.').should('be.visible')
    cy.contains('QR generados y fechas de evaluación guardadas en el calendario.').should('not.exist')
  })

  it('Regresión RQ15: sin grupos seleccionados no se generan posters', () => {
    cy.contains('button', 'Generar QR').should('be.disabled')
  })

  it('RQ16: con grupos, destinatario y asunto, envía solo los grupos con QR', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/share-email' },
      { message: 'Correo enviado correctamente', totalLinks: 2 }
    ).as('correo')
    abrirCorreo()

    cy.get('input[placeholder="Destinatario"]').type('ana@udemedellin.edu.co')
    cy.contains('button', 'Enviar').click()

    cy.wait('@correo').its('request.body').should('include', { to: 'ana@udemedellin.edu.co' })
    cy.get('@correo').its('request.body.grupoIds').should('deep.equal', [63, 64])
    cy.contains('Correo enviado correctamente.').should('be.visible')
    cy.contains('h3', 'Compartir QRs por correo').should('not.exist')
  })

  it('Regresión RQ16: sin destinatario no se llama al back', () => {
    cy.intercept({ method: 'POST', pathname: '/api/qr-evaluaciones/share-email' }, cy.spy().as('envio'))
    abrirCorreo()

    cy.contains('button', 'Enviar').click()

    cy.contains('Completa correo/asunto y genera QRs antes de enviar.').should('be.visible')
    cy.get('@envio').should('not.have.been.called')
  })

  it('Regresión RQ16: si el back rechaza el correo, el usuario ve el motivo y el modal sigue abierto', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/qr-evaluaciones/share-email' },
      { statusCode: 400, body: { error: 'Correo de destino inválido.' } }
    ).as('correo')
    abrirCorreo()

    cy.get('input[placeholder="Destinatario"]').type('no-es-un-correo')
    cy.contains('button', 'Enviar').click()

    cy.wait('@correo')
    cy.contains('Correo de destino inválido.').should('be.visible')
    cy.contains('h3', 'Compartir QRs por correo').should('be.visible')
  })
})

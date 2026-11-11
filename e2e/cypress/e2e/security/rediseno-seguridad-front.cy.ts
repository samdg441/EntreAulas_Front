import { usuarios } from '../../support/commands'
import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/**
 * Seguridad del front de las pantallas nuevas (OWASP Top 10 2021):
 * A03 Inyección (XSS almacenado en la auditoría y reflejado en búsquedas), A01 Control de acceso roto,
 * A05 Configuración de seguridad (cabeceras/CSP) y A08 Integridad (CSV injection).
 */
describe('Rediseño — Seguridad del front (OWASP A01, A03, A05, A08)', () => {
  const xss = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'

  beforeEach(() => simularBackCoordinador())

  it('A03: un detalle de auditoría con HTML/JS se muestra como texto y no se ejecuta', () => {
    simularBackCoordinador({
      auditoria: {
        disponible: true,
        eventos: [{ id: 1, actorId: 'u', actorNombre: xss, actorRol: 'coordinador', accion: 'generar_qr', entidad: 'qr', entidadId: null, detalle: xss, creadoEn: '2026-11-09T10:00:00.000Z' }],
        resumen: { total: 1, porAccion: { generar_qr: 1 }, ultimoEvento: '2026-11-09T10:00:00.000Z' },
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      },
    })
    cy.visitarConSesion('/auditoria', coordinador)
    cy.wait('@auditoria')

    cy.get('table tbody').should('contain.text', '<script>')
    cy.get('table tbody img, table tbody script').should('not.exist')
    cy.window().its('__xss').should('be.undefined')
  })

  it('A03: un texto con <script> en los buscadores no ejecuta nada', () => {
    const alerta = cy.stub().as('alerta')
    cy.on('window:alert', alerta)
    cy.visitarConSesion('/auditoria', coordinador)
    cy.wait('@auditoria')

    cy.get('#au-buscar').type(xss, { parseSpecialCharSequences: false })

    cy.get('@alerta').should('not.have.been.called')
    cy.window().its('__xss').should('be.undefined')
  })

  it('A03: la búsqueda viaja codificada en la URL (no rompe la consulta)', () => {
    cy.visitarConSesion('/auditoria', coordinador)
    cy.wait('@auditoria')

    cy.get('#au-buscar').type('a&accion=generar_qr#')

    // React StrictMode duplica la petición inicial: se mira la última.
    cy.get('@auditoria.all').should((llamadas: unknown) => {
      const lista = llamadas as Array<{ request: { query: Record<string, string> } }>
      expect(lista.at(-1)!.request.query).to.deep.include({ search: 'a&accion=generar_qr#' })
    })
  })

  it('A01: un estudiante, un profesor y un decano no abren la auditoría ni la gestión de profesores', () => {
    cy.simularBackVacio()
    ;[usuarios.estudiante, { ...usuarios.estudiante, tipo_usuario: 'profesor', roles: ['profesor'] }, { ...usuarios.estudiante, tipo_usuario: 'decano', roles: ['decano'] }].forEach((u) => {
      ;['/auditoria', '/profesores/gestionar'].forEach((ruta) => {
        cy.visitarConSesion(ruta, u)
        cy.location('pathname').should('eq', '/forbidden')
      })
    })
  })

  it('A01: sin sesión la auditoría redirige al login y no pide datos', () => {
    cy.intercept({ pathname: '/api/coordinador/auditoria' }, cy.spy().as('pedido'))
    cy.visit('/auditoria')

    cy.location('pathname').should('eq', '/login')
    cy.get('@pedido').should('not.have.been.called')
  })

  it('A05: el HTML servido no permite scripts en línea (la CSP de index.html se mantiene)', () => {
    cy.request('/').then((r) => {
      expect(r.body).to.contain('Content-Security-Policy')
      expect(r.body).to.contain("object-src 'none'")
      expect(r.body).not.to.match(/<script>[^<]*localStorage/)
    })
  })

  it('A08: las preferencias guardadas con valores manipulados se ignoran', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.window().then((w) => w.localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: '<b>x</b>', idioma: 'fr', tamano: '9999' })))
    cy.reload()

    cy.get('html').should('have.attr', 'lang', 'es').and('not.have.attr', 'data-text-size')
    cy.contains('h2', 'Resumen de docentes').should('be.visible')
  })

  it('A08: el CSV exportado neutraliza las fórmulas (CSV injection)', () => {
    cy.task('limpiarDescargas', null, { log: false })
    cy.visitarConSesion('/auditoria', coordinador)
    cy.wait('@auditoria')

    cy.contains('button', 'Exportar CSV').click()

    const hoy = new Date().toISOString().slice(0, 10)
    cy.readFile(`cypress/downloads/auditoria-${hoy}.csv`, { timeout: 15_000 }).should('contain', "'=HYPERLINK")
  })
})

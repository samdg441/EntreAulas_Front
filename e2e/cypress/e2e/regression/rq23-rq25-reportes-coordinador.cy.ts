import { usuarios } from '../../support/commands'

/**
 * RQ23 (periodo → datos) y RQ25 (exportar Excel) en /reports.
 */
describe('RQ23 y RQ25 — Reportes del coordinador (E2E)', () => {
  const archivo = 'cypress/downloads/reporte-coordinador-2026-1.xlsx'

  beforeEach(() => {
    cy.task('limpiarDescargas', null, { log: false })
    cy.simularBackVacio()
    cy.intercept({ method: 'GET', pathname: '/api/coordinador/reports-overview' }, { fixture: 'reports-overview.json' }).as(
      'reportes'
    )
    cy.visitarConSesion('/reports', usuarios.coordinador)
  })

  it('RQ23: al abrir, pide el periodo 2026-1 sin filtros de curso ni grupo', () => {
    cy.wait('@reportes').its('request.query').should('deep.equal', { period: '2026-1' })
  })

  it('Regresión RQ23: cambiar de periodo pide ese periodo y reinicia curso y grupo', () => {
    cy.wait('@reportes')

    cy.get('select[aria-label="Periodo"]').select('2025-2')

    cy.get('@reportes.all').should((llamadas: unknown) => {
      const lista = llamadas as Array<{ request: { query: Record<string, string> } }>
      expect(lista.at(-1)!.request.query).to.deep.equal({ period: '2025-2' })
    })
  })

  it('RQ25: "Datos Excel" descarga el libro del coordinador con las filas del reporte', () => {
    cy.wait('@reportes')

    cy.contains('button', 'Datos Excel').click()

    cy.readFile(archivo, 'binary', { timeout: 15_000 }).should('have.length.greaterThan', 1000)
    cy.task('leerExcel', archivo).then((libro: unknown) => {
      const data = libro as { hojas: string[]; filas: unknown[][] }
      expect(data.hojas).to.deep.equal(['Evaluaciones', 'Consulta', 'Docentes'])
      expect(data.filas[0]).to.include.members(['DOCENTE', 'ASIGNATURA', 'GRUPO', 'PROMEDIO'])
      expect(data.filas[1][0]).to.equal('Ana Pérez')
    })
  })

  it('Regresión RQ25: un nombre que parece fórmula llega al Excel como texto', () => {
    cy.wait('@reportes')

    cy.contains('button', 'Datos Excel').click()

    cy.readFile(archivo, 'binary', { timeout: 15_000 }).should('exist')
    cy.task('leerExcel', archivo).then((libro: unknown) => {
      const data = libro as { filas: unknown[][] }
      expect(data.filas[2][0]).to.equal('=HYPERLINK("http://evil.example","clic")')
    })
  })
})

describe('RQ23 — Reportes cuando el back falla (E2E)', () => {
  it('las tarjetas muestran "Error" en vez de cifras', () => {
    cy.simularBackVacio()
    cy.intercept({ pathname: '/api/coordinador/reports-overview' }, { statusCode: 500, body: { error: 'fallo' } }).as(
      'reportes'
    )

    cy.visitarConSesion('/reports', usuarios.coordinador)

    cy.wait('@reportes')
    cy.get('div.text-red-600').filter(':contains("Error")').should('have.length.at.least', 1)
    cy.contains('Cargando...').should('not.exist')
  })
})

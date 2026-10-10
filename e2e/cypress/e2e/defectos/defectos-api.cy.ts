import { cargarTokenCoordinadorOSaltar, pedir, pedirComoCoordinador } from '../../support/api'

/**
 * Registro de defectos abiertos en el back (mismo criterio que EntreAulas_Back/src/test/defects):
 * cada prueba describe el comportamiento CORRECTO y falla mientras el defecto siga abierto.
 * No forman parte de la suite de regresión: se corren con `npm run cy:defectos`.
 */
describe('Defectos abiertos de la API — con sesión de coordinador', function () {
  before(function () {
    cargarTokenCoordinadorOSaltar(this)
  })

  it('DEF-API-01: un id de docente no numérico → 400 sin filtrar el error de PostgreSQL', () => {
    pedirComoCoordinador('/api/coordinador/profesor-stats/abc?period=2026-1').then((r) => {
      expect(r.status).to.eq(400)
      expect(JSON.stringify(r.body)).not.to.match(/bigint|syntax|postgres|relation/i)
    })
  })

  it('DEF-API-02 (RQ23): un periodo inexistente (2026-9) → 400, no datos de todos los periodos', () => {
    pedirComoCoordinador('/api/coordinador/reports-overview?period=2026-9').its('status').should('eq', 400)
  })

  it("DEF-API-03 (RQ23): un periodo con inyección (2026-1' OR '1'='1) → 400", () => {
    pedirComoCoordinador(`/api/coordinador/reports-overview?period=${encodeURIComponent("2026-1' OR '1'='1")}`)
      .its('status')
      .should('eq', 400)
  })
})

describe('Defectos abiertos de la API — sin sesión', () => {
  it('DEF-API-04: el back envía cabeceras de seguridad básicas (helmet)', () => {
    pedir('/health').then((r) => {
      expect(r.headers).to.have.property('x-content-type-options', 'nosniff')
      expect(r.headers).to.have.property('strict-transport-security')
      expect(r.headers).to.have.property('x-frame-options')
    })
  })
})

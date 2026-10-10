import { jwtConOtraClave, jwtSinFirma, pedir } from '../../support/api'

/**
 * RQ19 contra el back real: el front puede mostrar una pantalla, pero los datos
 * solo salen con un token válido. No necesita credenciales.
 */
describe('RQ19 — Seguridad de la API real', () => {
  const coordinadorFalso = { userId: 'd253d25e-e6c4-445e-acad-3357ce2eb23a', tipo_usuario: 'coordinador' }

  before(() => {
    // Render apaga el servicio gratuito sin tráfico: la primera petición lo despierta.
    pedir('/health', { timeout: 120_000 })
  })

  it('health responde 200 en menos de 2 s con el servicio despierto', () => {
    pedir('/health').then((r) => {
      expect(r.status).to.eq(200)
      expect(r.body.ok).to.eq(true)
      expect(r.duration).to.be.lessThan(2000)
    })
  })

  const protegidos: Array<[string, string]> = [
    ['GET', '/api/coordinador/dashboard-summary'],
    ['GET', '/api/coordinador/reports-overview?period=2026-1'],
    ['GET', '/api/coordinador/profesor-stats/13?period=2026-1'],
    ['POST', '/api/qr-evaluaciones/batch'],
    ['POST', '/api/qr-evaluaciones/share-email'],
  ]

  protegidos.forEach(([method, ruta]) => {
    it(`${method} ${ruta} sin token → 401 NO_TOKEN`, () => {
      pedir(ruta, { method, body: method === 'POST' ? { grupoIds: [63] } : undefined }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.equal({ error: 'Token de acceso requerido', code: 'NO_TOKEN' })
      })
    })
  })

  it('un token mal formado → 401 sin detalles internos', () => {
    pedir('/api/coordinador/dashboard-summary', { headers: { Authorization: 'Bearer abc.def.ghi' } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.have.all.keys('error', 'code')
      expect(JSON.stringify(r.body)).not.to.match(/stack|at \w+ \(|jsonwebtoken/i)
    })
  })

  it('un token sin firma (alg none) que dice ser coordinador → 401', () => {
    pedir('/api/coordinador/dashboard-summary', { headers: { Authorization: `Bearer ${jwtSinFirma(coordinadorFalso)}` } }).then((r) => {
      expect(r.status).to.eq(401)
    })
  })

  it('un token firmado con otra clave → 401', () => {
    cy.wrap(jwtConOtraClave(coordinadorFalso)).then((token) => {
      pedir('/api/coordinador/dashboard-summary', { headers: { Authorization: `Bearer ${token}` } }).its('status').should('eq', 401)
    })
  })

  it('CORS: el front oficial recibe permiso y un origen ajeno no', () => {
    const preflight = (origen: string) =>
      pedir('/api/coordinador/dashboard-summary', {
        method: 'OPTIONS',
        headers: { Origin: origen, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' },
      })

    preflight('https://entre-aulas-front.vercel.app')
      .its('headers')
      .should('have.property', 'access-control-allow-origin', 'https://entre-aulas-front.vercel.app')
    preflight('https://evil.example').its('headers').should('not.have.property', 'access-control-allow-origin')
  })

  it('no anuncia la tecnología del servidor (x-powered-by)', () => {
    pedir('/health').its('headers').should('not.have.property', 'x-powered-by')
  })
})

import { jwtConOtraClave, jwtSinFirma, pedir } from '../../support/api'

/**
 * RQ6, RQ15, RQ16 y RQ17 — Seguridad contra el back real (estilo RQ19).
 * No necesita credenciales: prueba tokens falsos sobre las rutas de estos requisitos.
 */
describe('RQ6, RQ15, RQ16 y RQ17 — Seguridad de la API real', () => {
  const adminFalso = { userId: 'u-admin', tipo_usuario: 'admin' }

  before(() => {
    // Render apaga el plan gratuito sin tráfico: la primera petición lo despierta.
    pedir('/health', { timeout: 120_000 })
  })

  const protegidos: Array<[string, string]> = [
    ['GET', '/api/users'],
    ['POST', '/api/qr-evaluaciones/batch'],
    ['POST', '/api/qr-evaluaciones/share-email'],
    ['POST', '/api/qr-evaluaciones/tok-14/auto-enroll'],
    ['GET', '/api/teachers/student-enrolled-subjects'],
  ]

  protegidos.forEach(([method, ruta]) => {
    it(`${method} ${ruta} sin token → 401 NO_TOKEN`, () => {
      pedir(ruta, {
        method,
        body: method === 'POST' ? { grupoIds: [63], to: 'ana@udemedellin.edu.co', subject: 'QR' } : undefined,
      }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.equal({ error: 'Token de acceso requerido', code: 'NO_TOKEN' })
      })
    })
  })

  it('un token mal formado → 401 sin detalles internos', () => {
    pedir('/api/users', { headers: { Authorization: 'Bearer abc.def.ghi' } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.have.all.keys('error', 'code')
      expect(JSON.stringify(r.body)).not.to.match(/stack|at \w+ \(|jsonwebtoken/i)
    })
  })

  it('RQ6: un token sin firma (alg none) que dice ser admin → 401', () => {
    pedir('/api/users', { headers: { Authorization: `Bearer ${jwtSinFirma(adminFalso)}` } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.not.have.property('users')
    })
  })

  it('RQ15: un token firmado con otra clave no genera QR', () => {
    cy.wrap(jwtConOtraClave(adminFalso)).then((jwt) => {
      pedir('/api/qr-evaluaciones/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: { grupoIds: [63] },
      }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.not.have.property('created')
      })
    })
  })

  it('RQ17: un token que no es UUID → 404 y no devuelve el grupo', () => {
    pedir('/api/qr-evaluaciones/token-que-no-existe-123').then((r) => {
      expect(r.status).to.eq(404)
      expect(r.body).to.deep.equal({ error: 'QR inválido o expirado.' })
      expect(JSON.stringify(r.body)).not.to.match(/stack|jsonwebtoken/i)
    })
  })
})

import { pedir } from '../../support/api'

/**
 * RQ6, RQ14, RQ15, RQ16, RQ17 y RQ27 contra el back real (estilo RQ18).
 * Sin credenciales: rechazos exactos. No crea usuarios ni QR.
 */
describe('RQ6, RQ14–RQ17 y RQ27 — API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  it('RQ17: un token que no es UUID → 404 (no 500)', () => {
    pedir('/api/qr-evaluaciones/token-que-no-existe-123').then((r) => {
      expect(r.status).to.eq(404)
      expect(r.body).to.deep.equal({ error: 'QR inválido o expirado.' })
    })
  })

  const protegidos: Array<[string, string, object | undefined]> = [
    ['GET', '/api/users', undefined],
    ['POST', '/api/qr-evaluaciones/batch', { grupoIds: [63] }],
    ['POST', '/api/qr-evaluaciones/share-email', { to: 'ana@udemedellin.edu.co', subject: 'QR', grupoIds: [63] }],
    ['POST', '/api/qr-evaluaciones/tok-14/auto-enroll', {}],
    ['GET', '/api/teachers/student-enrolled-subjects', undefined],
  ]

  protegidos.forEach(([method, ruta, body]) => {
    it(`${method} ${ruta} sin token → 401 NO_TOKEN`, () => {
      pedir(ruta, { method, body }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.equal({ error: 'Token de acceso requerido', code: 'NO_TOKEN' })
      })
    })
  })
})

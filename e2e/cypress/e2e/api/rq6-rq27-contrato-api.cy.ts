import { pedir } from '../../support/api'

/**
 * RQ6, RQ14, RQ15, RQ16, RQ17 y RQ27 contra el back real.
 * Sin credenciales: rechazos. No crea usuarios ni QR.
 */
describe('RQ6, RQ14–RQ17 y RQ27 — Contrato de la API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
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
        expect(r.body).to.not.have.property('users')
        expect(r.body).to.not.have.property('materiasMatriculadas')
        expect(r.body).to.not.have.property('created')
      })
    })
  })

  it('RQ17: un token inexistente no abre la encuesta', () => {
    pedir('/api/qr-evaluaciones/00000000-0000-4000-8000-000000000000').then((r) => {
      expect(r.status).to.not.eq(200)
      expect(r.body).to.not.have.property('grupoId')
      expect(r.body).to.not.have.property('cursoCodigo')
      expect(JSON.stringify(r.body)).to.not.match(/stack|at \w+ \(/i)
    })
  })
})

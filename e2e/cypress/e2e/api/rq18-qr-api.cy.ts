import { pedir } from '../../support/api'

/**
 * RQ18 — Validación del token QR contra el back real (sin UI).
 * Un token inexistente bien formado → 404; uno inválido → 404 (ya no 500).
 */
describe('RQ18 — API real de QR', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  it('un UUID inexistente → 404 QR inválido o expirado', () => {
    pedir('/api/qr-evaluaciones/00000000-0000-4000-8000-000000000000').then((r) => {
      expect(r.status).to.eq(404)
      expect(r.body).to.deep.equal({ error: 'QR inválido o expirado.' })
    })
  })

  it('un token que no es UUID → 404 (no 500)', () => {
    pedir('/api/qr-evaluaciones/token-que-no-existe-123').then((r) => {
      expect(r.status).to.eq(404)
      expect(r.body).to.deep.equal({ error: 'QR inválido o expirado.' })
    })
  })

  it('batch y share-email sin token → 401', () => {
    pedir('/api/qr-evaluaciones/batch', { method: 'POST', body: { grupoIds: [63] } }).its('status').should('eq', 401)
    pedir('/api/qr-evaluaciones/share-email', {
      method: 'POST',
      body: { to: 'ana@udemedellin.edu.co', grupoIds: [63] },
    })
      .its('status')
      .should('eq', 401)
  })
})

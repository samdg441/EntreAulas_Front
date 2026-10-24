import { jwtConOtraClave, jwtSinFirma, pedir } from '../../support/api'

/**
 * RQ6, RQ15 y RQ17 — Un token falso no lista usuarios, no genera QR y no resuelve la encuesta.
 */
describe('RQ6, RQ15 y RQ17 — Seguridad de la API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  it('RQ6: un token sin firma que dice ser admin no lista usuarios', () => {
    pedir('/api/users', {
      headers: { Authorization: `Bearer ${jwtSinFirma({ userId: 'u-admin', tipo_usuario: 'admin' })}` },
    }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.not.have.property('users')
    })
  })

  it('RQ15: un token firmado con otra clave no genera QR', () => {
    cy.wrap(jwtConOtraClave({ userId: 'u-admin', tipo_usuario: 'admin' })).then((jwt) => {
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

  it('RQ16: sin token, el correo no se envía y la respuesta no repite el destinatario', () => {
    pedir('/api/qr-evaluaciones/share-email', {
      method: 'POST',
      body: { to: 'ana@udemedellin.edu.co', subject: 'QR', grupoIds: [63] },
    }).then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body.code).to.eq('NO_TOKEN')
      expect(JSON.stringify(r.body)).to.not.include('ana@udemedellin.edu.co')
    })
  })

  it('RQ17: un token mal formado no devuelve el grupo ni un 200', () => {
    pedir('/api/qr-evaluaciones/token-que-no-existe', { timeout: 20_000 }).then((r) => {
      expect(r.status).to.not.eq(200)
      expect(r.body).to.not.have.property('grupoId')
      expect(JSON.stringify(r.body)).to.not.match(/stack|jsonwebtoken/i)
    })
  })
})

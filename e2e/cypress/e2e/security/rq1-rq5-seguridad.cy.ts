import { jwtConOtraClave, jwtSinFirma, pedir } from '../../support/api'

/**
 * RQ1–RQ5 — Seguridad de la autenticación contra el back real.
 * No necesita credenciales. Los casos marcados con [DEF-xx] fallaban en la línea base
 * y verifican la corrección después de la refactorización.
 */
const adminFalso = { userId: '00000000-0000-4000-8000-000000000001', email: 'x@udemedellin.edu.co', tipo_usuario: 'admin' }
const CLAVE = 'Clave-E2e-2026!'

describe('RQ1–RQ5 — Seguridad de la API de autenticación', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  context('RQ1 — create-user exige un admin autenticado', () => {
    it('JWT sin firma (alg none) que dice ser admin → 401', () => {
      pedir('/api/auth/create-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtSinFirma(adminFalso)}` },
        body: { email: 'intruso@udemedellin.edu.co', password: CLAVE, nombre: 'X', apellido: 'Y', tipo_usuario: 'admin' },
      }).its('status').should('eq', 401)
    })

    it('JWT firmado con otra clave → 401', () => {
      cy.wrap(jwtConOtraClave(adminFalso)).then((jwt) => {
        pedir('/api/auth/create-user', {
          method: 'POST',
          headers: { Authorization: `Bearer ${jwt}` },
          body: { email: 'intruso@udemedellin.edu.co', password: CLAVE, nombre: 'X', apellido: 'Y', tipo_usuario: 'admin' },
        }).its('status').should('eq', 401)
      })
    })

    it('GET /api/auth/me con JWT falso → 401 sin detalles internos', () => {
      pedir('/api/auth/me', { headers: { Authorization: `Bearer ${jwtSinFirma(adminFalso)}` } }).then((r) => {
        expect(r.status).to.eq(401)
        expect(JSON.stringify(r.body)).not.to.match(/stack|jsonwebtoken|at \w+ \(/i)
      })
    })
  })

  context('RQ2 — login robusto ante entradas hostiles', () => {
    it('inyección NoSQL en el correo ({"$ne": null}) → 400, nunca 200 ni 500', () => {
      pedir('/api/auth/login', { method: 'POST', body: { email: { $ne: null }, password: { $ne: null } } }).its('status').should('eq', 400)
    })

    it("inyección SQL en el correo → 400/401 sin mensajes de la base de datos", () => {
      pedir('/api/auth/login', { method: 'POST', body: { email: "' OR 1=1 --@x.co", password: "' OR '1'='1" } }).then((r) => {
        expect(r.status).to.be.oneOf([400, 401])
        expect(JSON.stringify(r.body)).not.to.match(/syntax|postgres|supabase|relation|PGRST/i)
      })
    })

    it('la respuesta de error no revela si la cuenta existe (mismo cuerpo para cualquier correo)', () => {
      pedir('/api/auth/login', { method: 'POST', body: { email: 'nadie.1@udemedellin.edu.co', password: CLAVE } }).then((a) => {
        pedir('/api/auth/login', { method: 'POST', body: { email: 'nadie.2@soyudemedellin.edu.co', password: CLAVE } }).then((b) => {
          expect(a.status).to.eq(b.status)
          expect(a.body).to.deep.equal(b.body)
        })
      })
    })

    it('[DEF-34] intentos fallidos repetidos terminan en 429', () => {
      const email = `fuerza.bruta.${Date.now()}@udemedellin.edu.co`
      const estados: number[] = []
      Cypress._.times(15, (i) => {
        pedir('/api/auth/login', { method: 'POST', body: { email, password: `Mala-${i}-2026!` }, log: false }).then((r) => estados.push(r.status))
      })
      cy.wrap(estados).should('include', 429)
    })
  })

  context('RQ3.1 / RQ3.2 / RQ5 — recuperación', () => {
    it('el token de recuperación nunca aparece en la respuesta de forgot-password', () => {
      pedir('/api/auth/forgot-password', { method: 'POST', body: { email: 'nadie.e2e@udemedellin.edu.co' } }).then((r) => {
        expect(r.body).not.to.have.any.keys('resetToken', 'resetLink', 'token')
      })
    })

    it('path traversal en el token → 400/404, nunca 500', () => {
      pedir('/api/auth/validate-reset-token/..%2F..%2Fetc%2Fpasswd?email=eva@soyudemedellin.edu.co').its('status').should('be.oneOf', [400, 404])
    })

    it('[DEF-43] validar tokens al azar repetidamente termina en 429', () => {
      const estados: number[] = []
      Cypress._.times(25, (i) => {
        pedir(`/api/auth/validate-reset-token/${String(i).padStart(64, '0')}?email=eva@soyudemedellin.edu.co`, { log: false }).then((r) =>
          estados.push(r.status)
        )
      })
      cy.wrap(estados).should('include', 429)
    })
  })

  context('transversal — cabeceras y formato de errores', () => {
    it('[DEF-35] envía cabeceras de seguridad (nosniff, frame-options) y oculta X-Powered-By', () => {
      pedir('/health').then((r) => {
        expect(r.headers).to.have.property('x-content-type-options', 'nosniff')
        expect(r.headers).to.have.property('x-frame-options')
        expect(r.headers).not.to.have.property('x-powered-by')
      })
    })

    it('[DEF-38] JSON malformado → 400 en JSON (no una página HTML con la traza)', () => {
      pedir('/api/auth/login', { method: 'POST', body: '{"email": ', headers: { 'Content-Type': 'application/json' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(String(r.headers['content-type'])).to.contain('application/json')
        expect(JSON.stringify(r.body)).not.to.match(/<pre>|at JSON\.parse|node_modules/)
      })
    })

    it('CORS: un origen desconocido no recibe Access-Control-Allow-Origin con credenciales', () => {
      pedir('/api/auth/login', { method: 'OPTIONS', headers: { Origin: 'https://atacante.example', 'Access-Control-Request-Method': 'POST' } }).then((r) => {
        const origen = r.headers['access-control-allow-origin']
        expect(origen === 'https://atacante.example' && r.headers['access-control-allow-credentials'] === 'true').to.eq(false)
      })
    })
  })
})

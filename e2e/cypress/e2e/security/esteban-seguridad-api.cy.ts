import { jwtConOtraClave, jwtSinFirma, pedir } from '../../support/api'

/**
 * Punto 13 — Análisis dinámico (DAST) de la API de encuestas contra el servidor en ejecución.
 * Sin credenciales: cada ataque se corta antes de la base (401/400/413). No escribe nada.
 * Correr contra el back local: API_URL=http://localhost:3000.
 */
const RUTA = '/api/evaluations/questions'

describe('Punto 13 — DAST de la API de encuestas', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 }).its('status').should('eq', 200)
  })

  context('A05 — Cabeceras y configuración', () => {
    it('SEC-D-01 las respuestas llevan las cabeceras de helmet y no anuncian Express', () => {
      pedir(RUTA).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.headers).to.have.property('x-content-type-options', 'nosniff')
        expect(r.headers).to.have.property('x-frame-options')
        expect(r.headers).to.have.property('strict-transport-security')
        expect(r.headers).to.not.have.property('x-powered-by')
      })
    })

    it('SEC-D-02 CORS frente a un origen extraño (se registra lo que responde el servidor)', () => {
      pedir(`${RUTA}/8`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'PUT' },
      }).then((r) => {
        const permitido = r.headers['access-control-allow-origin']
        cy.log(`access-control-allow-origin: ${permitido ?? '(ninguno)'}`)
        // Nunca debe reflejar el origen del atacante junto con credenciales.
        if (permitido === 'https://evil.example') expect(r.headers['access-control-allow-credentials']).to.not.eq('true')
        expect(permitido).to.be.oneOf([undefined, '*', 'http://localhost:3001', 'https://entre-aulas-front.vercel.app'])
      })
    })

    it('SEC-D-03 un JSON mal formado responde 400 en JSON y sin stack', () => {
      pedir(RUTA, { method: 'POST', body: '{"texto_pregunta":', headers: { 'Content-Type': 'application/json' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.headers['content-type']).to.match(/application\/json/)
        expect(JSON.stringify(r.body)).to.not.match(/stack|SyntaxError|node_modules/)
      })
    })

    it('SEC-D-04 un cuerpo de más de 100 KB se rechaza con 413 y sin stack', () => {
      pedir(RUTA, { method: 'POST', body: { texto_pregunta: 'a'.repeat(120_000) } }).then((r) => {
        expect(r.status).to.eq(413)
        expect(JSON.stringify(r.body)).to.not.match(/stack|PayloadTooLargeError|node_modules/)
      })
    })
  })

  context('A07 — Tokens falsificados', () => {
    it('SEC-D-05 alg none, otra clave y basura en Authorization → 401 sin detalles de la librería', () => {
      cy.wrap(jwtConOtraClave({ userId: 'x', tipo_usuario: 'admin' })).then((otraClave) => {
        const tokens = [jwtSinFirma({ userId: 'x', tipo_usuario: 'admin' }), String(otraClave), 'a.b.c', "' OR 1=1 --"]
        tokens.forEach((token) => {
          pedir(`${RUTA}/8`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: { texto_pregunta: 'x' } }).then((r) => {
            expect(r.status).to.eq(401)
            expect(JSON.stringify(r.body)).to.not.match(/jsonwebtoken|JsonWebTokenError|stack/i)
          })
        })
      })
    })
  })

  context('A03 — Inyección en la ruta sin sesión', () => {
    ;["8 OR 1=1", "8;DROP TABLE preguntas_evaluacion", "../../users", "%00"].forEach((id) => {
      it(`SEC-D-06 PUT ${RUTA}/${id} sin token → 401 o 404, sin filtrar errores de base`, () => {
        pedir(`${RUTA}/${encodeURIComponent(id)}`, { method: 'PUT', body: { texto_pregunta: 'x' } }).then((r) => {
          expect(r.status).to.be.oneOf([401, 404])
          expect(JSON.stringify(r.body)).to.not.match(/postgres|syntax error|relation|stack/i)
        })
      })
    })
  })
})

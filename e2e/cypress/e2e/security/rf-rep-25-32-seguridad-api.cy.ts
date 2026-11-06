import { jwtSinFirma, pedir } from '../../support/api'

/**
 * RF-REP-25, RF-REP-26 y RF-IA-32 — Análisis dinámico contra la API real.
 * No usa cuentas: cubre acceso sin token, token sin firma e inyección en la consulta.
 */
export {}

const SIN_TOKEN = { error: 'Token de acceso requerido', code: 'NO_TOKEN' }
const RUTAS = [
  '/api/resultados',
  '/api/resultados/estadisticas',
  '/api/ai/summarize/by-professor?profesor_id=7',
  '/api/ai/summarize/by-career',
  '/api/ai/summarize/by-faculty',
]

describe('RF-REP-25, RF-REP-26 y RF-IA-32 — Seguridad de la API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  RUTAS.forEach((ruta) => {
    it(`A01: GET ${ruta} sin token → 401`, () => {
      pedir(ruta).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.equal(SIN_TOKEN)
        expect(JSON.stringify(r.body)).not.to.match(/stack|jsonwebtoken/i)
      })
    })
  })

  it('A02: un token sin firma no abre los resultados crudos', () => {
    pedir('/api/resultados', { headers: { Authorization: `Bearer ${jwtSinFirma({ userId: '7', tipo_usuario: 'profesor' })}` } }).then((r) => {
      expect(r.status).to.eq(401)
      expect(JSON.stringify(r.body)).not.to.match(/stack|jsonwebtoken/i)
    })
  })

  it('A03: SQL en el periodo no devuelve filas', () => {
    pedir("/api/resultados?periodo_id=8%3B%20DROP%20TABLE%20evaluaciones&grupo_id=%3Cscript%3E").then((r) => {
      // 401 lo pone la API. 403 lo pone el borde de Render cuando ve DROP TABLE.
      expect(r.status).to.be.oneOf([401, 403])
      expect(JSON.stringify(r.body)).not.to.match(/respuestas_evaluacion|stack|jsonwebtoken/i)
    })
  })

  it('A05: el preflight de un origen ajeno no autoriza estos GET', () => {
    pedir('/api/resultados', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    }).then((r) => {
      expect(r.headers).not.to.have.property('access-control-allow-origin', 'https://evil.example')
    })
  })
})

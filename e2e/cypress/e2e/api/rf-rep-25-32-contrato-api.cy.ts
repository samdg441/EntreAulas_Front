import { cargarTokenCoordinadorOSaltar, jwtSinFirma, pedir, pedirComoCoordinador } from '../../support/api'

export {}

/**
 * RF-REP-25, RF-REP-26 y RF-IA-32 contra el back real (estilo rq22-rq25-contrato-api).
 * Los rechazos no necesitan credenciales. Los 200 usan CYPRESS_TOKEN_COORDINADOR y se omiten si no está.
 */
const SIN_TOKEN = { error: 'Token de acceso requerido', code: 'NO_TOKEN' }

describe('RF-REP-25, RF-REP-26 y RF-IA-32 — API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  context('error — sin sesión', () => {
    const protegidos = [
      '/api/resultados',
      '/api/resultados/estadisticas',
      '/api/ai/summarize/by-professor?profesor_id=7',
      '/api/ai/summarize/by-career',
      '/api/ai/summarize/by-faculty',
    ]

    protegidos.forEach((ruta) => {
      it(`GET ${ruta} sin token → 401 NO_TOKEN`, () => {
        pedir(ruta).then((r) => {
          expect(r.status, ruta).to.eq(401)
          expect(r.body).to.deep.equal(SIN_TOKEN)
        })
      })
    })

    it('un token sin firma no abre los resultados crudos', () => {
      pedir('/api/resultados', {
        headers: { Authorization: `Bearer ${jwtSinFirma({ userId: 'u-1', tipo_usuario: 'profesor' })}` },
      }).then((r) => {
        expect(r.status).to.eq(401)
        expect(JSON.stringify(r.body)).not.to.match(/stack|jsonwebtoken/i)
      })
    })
  })

  context('exitoso y alternativo — coordinador', () => {
    before(function () {
      cargarTokenCoordinadorOSaltar(this)
    })

    it('RF-REP-25: GET /api/resultados responde 200 con un listado', () => {
      pedirComoCoordinador('/api/resultados').then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body).to.be.an('array')
        expect(r.duration).to.be.lessThan(8000)
        r.body.forEach((fila: { completada: boolean }) => {
          expect(fila.completada).to.eq(true)
          expect(fila).to.include.keys('estudiante', 'profesor', 'grupo', 'respuestas_evaluacion')
        })
      })
    })

    it('RF-REP-25: un periodo que no es número no tumba la consulta', () => {
      pedirComoCoordinador('/api/resultados?periodo_id=abc&grupo_id=').then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body).to.be.an('array')
      })
    })

    it('RF-REP-26: las estadísticas traen total, promedio, mínima, máxima y meses, en escala', () => {
      pedirComoCoordinador('/api/resultados/estadisticas').then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body).to.include.all.keys(
          'total_evaluaciones',
          'calificacion_promedio',
          'calificacion_minima',
          'calificacion_maxima',
          'evaluaciones_por_mes'
        )
        expect(r.body.total_evaluaciones).to.be.a('number')
        expect(r.body.calificacion_promedio).to.be.within(0, 5)
        expect(r.body.calificacion_minima).to.be.within(0, 5)
        expect(r.body.calificacion_maxima).to.be.within(0, 5)
        expect(r.body.evaluaciones_por_mes).to.be.an('object')
      })
    })

    it('RF-IA-32: by-professor sin profesor_id → 400', () => {
      pedirComoCoordinador('/api/ai/summarize/by-professor').then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('profesor_id es requerido')
      })
    })

    it('RF-IA-32: el coordinador no pide el resumen de la facultad → 403', () => {
      pedirComoCoordinador('/api/ai/summarize/by-faculty').then((r) => {
        expect(r.status).to.eq(403)
        expect(r.body).to.deep.equal({ error: 'Permisos insuficientes', code: 'FORBIDDEN_ROLE' })
      })
    })
  })
})

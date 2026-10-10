import { cargarTokenCoordinadorOSaltar, pedirComoCoordinador } from '../../support/api'

/**
 * Contrato de los endpoints del coordinador contra el back real.
 * Requiere CYPRESS_TOKEN_COORDINADOR; sin él la suite se omite (no falla).
 */
describe('RQ22–RQ25 — Contrato de la API real del coordinador', function () {
  before(function () {
    cargarTokenCoordinadorOSaltar(this)
  })

  const enEscala = (n: number) => n >= 0 && n <= 5

  it('RQ24: dashboard-summary cumple el contrato y responde en menos de 3 s', () => {
    pedirComoCoordinador('/api/coordinador/dashboard-summary?page=1&pageSize=8').then((r) => {
      expect(r.status).to.eq(200)
      expect(r.duration).to.be.lessThan(3000)
      expect(r.body).to.have.all.keys('stats', 'teachers', 'pagination')
      expect(r.body.stats).to.include.all.keys('totalProfesores', 'promedioEvaluaciones', 'profesoresEnRiesgo', 'totalEvaluaciones')
      expect(r.body.teachers.length).to.be.at.most(8)
      r.body.teachers.forEach((d: any) => {
        expect(d).to.include.all.keys('profesorId', 'nombre', 'email', 'totalEvaluaciones', 'promedio')
        expect(enEscala(d.promedio), `${d.nombre}: ${d.promedio}`).to.eq(true)
      })
    })
  })

  it('RQ24: un pageSize enorme se limita a 50 (no se puede volcar la tabla completa)', () => {
    pedirComoCoordinador('/api/coordinador/dashboard-summary?pageSize=100000').then((r) => {
      expect(r.status).to.eq(200)
      expect(r.body.pagination.pageSize).to.eq(50)
      expect(r.body.teachers.length).to.be.at.most(50)
    })
  })

  it('Regresión RQ24: una página negativa se normaliza a la 1', () => {
    pedirComoCoordinador('/api/coordinador/dashboard-summary?page=-5').its('body.pagination.page').should('eq', 1)
  })

  it('Regresión RQ24: una búsqueda con comillas y comodines no rompe la consulta', () => {
    pedirComoCoordinador(`/api/coordinador/dashboard-summary?search=${encodeURIComponent("%' OR '1'='1")}`).then((r) => {
      expect(r.status).to.eq(200)
      expect(r.body.teachers).to.deep.equal([])
    })
  })

  it('RQ23/RQ25: reports-overview del periodo trae filas exportables y promedios en escala', () => {
    pedirComoCoordinador('/api/coordinador/reports-overview?period=2026-1').then((r) => {
      expect(r.status).to.eq(200)
      expect(r.duration).to.be.lessThan(8000)
      expect(r.body).to.include.all.keys('summary', 'categoryStats', 'reportRows', 'trend', 'distribution')
      expect(enEscala(r.body.summary.calificacionPromedio)).to.eq(true)
      r.body.reportRows.forEach((fila: any) => {
        expect(fila).to.include.all.keys('DOCENTE', 'ASIGNATURA', 'GRUPO', 'PROMEDIO')
        expect(enEscala(Number(fila.PROMEDIO)), `${fila.DOCENTE}: ${fila.PROMEDIO}`).to.eq(true)
      })
    })
  })

  it('RQ22: un docente fuera de la carrera del coordinador → 404 sin datos', () => {
    pedirComoCoordinador('/api/coordinador/profesor-stats/999999?period=2026-1').then((r) => {
      expect(r.status).to.eq(404)
      expect(r.body).to.deep.equal({ error: 'Docente no encontrado en la carrera del coordinador' })
    })
  })

  it('RQ19: el token de coordinador no abre endpoints de admin → 403', () => {
    pedirComoCoordinador('/api/users').its('status').should('eq', 403)
  })
})

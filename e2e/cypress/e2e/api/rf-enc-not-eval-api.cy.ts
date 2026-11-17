import { cargarTokenCoordinadorOSaltar, jwtConOtraClave, jwtSinFirma, pedir, pedirComoCoordinador } from '../../support/api'

/**
 * RF-ENC-32, RF-ENC-33, RF-EVAL-11/12, RF-ACA-27 y RF-NOT-34 contra el back real (cy.request).
 *
 * No escribe en la base:
 *  - los rechazos (401, 400) se cortan antes del repositorio;
 *  - con el token del coordinador solo se lee o se envían datos que el back debe rechazar.
 *
 * DEF-48 y DEF-49 solo pasan contra un back con la corrección (local: API_URL=http://localhost:3000).
 */
describe('RF-ENC / RF-EVAL / RF-NOT — API real', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 }).its('status').should('eq', 200)
  })

  context('sin credenciales', () => {
    const protegidas: Array<[string, string, object | undefined]> = [
      ['GET', '/api/evaluations/questions', undefined],
      ['GET', '/api/evaluations/categories', undefined],
      ['POST', '/api/evaluations/questions', { categoria_id: 1, texto_pregunta: 'x', tipo_pregunta: 'likert', orden: 1 }],
      ['PUT', '/api/evaluations/questions/1', { texto_pregunta: 'x' }],
      ['DELETE', '/api/evaluations/questions/1', undefined],
      ['POST', '/api/evaluations/categories', { nombre: 'x', orden: 1 }],
      ['GET', '/api/teachers', undefined],
      ['GET', '/api/periodos/evaluacion', undefined],
    ]

    protegidas.forEach(([method, ruta, body]) => {
      it(`${method} ${ruta} → 401 NO_TOKEN`, () => {
        pedir(ruta, { method, body }).then((r) => {
          expect(r.status).to.eq(401)
          expect(r.body).to.deep.equal({ error: 'Token de acceso requerido', code: 'NO_TOKEN' })
        })
      })
    })
  })

  context('con un token falsificado', () => {
    it('RF-ENC-33: un JWT sin firma (alg none) no puede corregir preguntas', () => {
      pedir('/api/evaluations/questions/1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwtSinFirma({ userId: 'x', tipo_usuario: 'admin' })}` },
        body: { texto_pregunta: 'inyectado' },
      }).then((r) => {
        expect(r.status).to.be.oneOf([401, 403])
        expect(JSON.stringify(r.body)).to.not.contain('inyectado')
      })
    })

    it('RF-ENC-33: un JWT firmado con otra clave no puede retirar preguntas', () => {
      cy.wrap(jwtConOtraClave({ userId: 'x', tipo_usuario: 'admin' })).then((token) => {
        pedir('/api/evaluations/questions/1', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).its('status').should('be.oneOf', [401, 403])
      })
    })
  })

  context('con el coordinador de pruebas (CYPRESS_TOKEN_COORDINADOR)', () => {
    before(function () {
      cargarTokenCoordinadorOSaltar(this)
    })

    it('RF-ENC-32: lista preguntas activas con el contrato { success, data[] }', () => {
      pedirComoCoordinador('/api/evaluations/questions').then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body).to.have.property('success', true)
        expect(r.body.data).to.be.an('array')
        r.body.data.forEach((p: Record<string, unknown>) => {
          expect(p).to.include.all.keys('id', 'categoria_id', 'texto_pregunta', 'tipo_pregunta', 'orden')
          expect(p.activa).to.eq(true)
        })
      })
    })

    it('RF-ENC-32: lista las encuestas (categorías)', () => {
      pedirComoCoordinador('/api/evaluations/categories').then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.categories).to.be.an('array')
      })
    })

    it('RF-ENC-32: crear sin texto ni orden → 400 Datos incompletos', () => {
      pedirComoCoordinador('/api/evaluations/questions', {
        method: 'POST',
        body: { categoria_id: 1, tipo_pregunta: 'likert' },
      }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body).to.include({ success: false, error: 'Datos incompletos' })
      })
    })

    it('DEF-48: corregir con texto en blanco → 400 y no se guarda', () => {
      pedirComoCoordinador('/api/evaluations/questions/1', {
        method: 'PUT',
        body: { texto_pregunta: '   ' },
      }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body).to.include({ message: 'El texto de la pregunta es obligatorio.' })
      })
    })

    it('DEF-49: un id que no es entero positivo → 400', () => {
      pedirComoCoordinador('/api/evaluations/questions/abc', {
        method: 'PUT',
        body: { texto_pregunta: 'x' },
      }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body).to.include({ message: 'La pregunta no es válida.' })
      })
    })

    it('RF-NOT-34: las ventanas de evaluación traen fechas ISO para armar el aviso', () => {
      pedirComoCoordinador('/api/periodos/evaluacion').then((r) => {
        expect(r.status).to.eq(200)
        const ventanas = Array.isArray(r.body) ? r.body : r.body.ventanas ?? r.body.data ?? []
        expect(ventanas).to.be.an('array')
        ventanas.forEach((v: Record<string, string>) => {
          expect(v).to.include.all.keys('fechaInicio', 'fechaFin')
          expect(v.fechaInicio).to.match(/^\d{4}-\d{2}-\d{2}/)
        })
      })
    })
  })
})

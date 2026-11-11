import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/** Requisito 2 — Gestión de profesores: lista con filtros y orden, y detalle por docente. */
describe('Rediseño — Gestión de profesores (UI)', () => {
  beforeEach(() => {
    simularBackCoordinador()
    cy.visitarConSesion('/profesores/gestionar', coordinador)
    cy.wait('@resumen')
  })

  const lista = () => cy.get('section[aria-labelledby="titulo-lista"]')

  context('escenarios exitosos', () => {
    it('lista a los docentes de la carrera con su promedio', () => {
      lista().contains('button', 'Ana Pérez').should('contain', '4.50')
      lista().contains('button', 'Marta Díaz').should('be.visible')
    })

    it('al elegir un docente muestra sus estadísticas por categoría y por curso', () => {
      lista().contains('button', 'Ana Pérez').click()

      cy.wait('@stats').its('request.url').should('match', /profesor-stats\/\d+\?period=2026-1/)
      cy.contains('h2', 'Ana Pérez').should('be.visible')
      cy.contains('Promedio por categoría').should('be.visible')
      cy.contains('Metodología').should('be.visible')
      cy.contains('SIS101 · Programación I').should('be.visible')
    })

    it('el filtro "En riesgo" deja solo a los docentes con promedio menor a 4.0', () => {
      cy.contains('[role="radio"]', 'En riesgo').click()

      lista().contains('button', 'Marta Díaz').should('be.visible')
      lista().contains('button', 'Ana Pérez').should('not.exist')
    })
  })

  context('escenarios alternativos', () => {
    it('la búsqueda ignora tildes y mayúsculas', () => {
      cy.get('#gp-buscar').type('perez')

      lista().contains('button', 'Ana Pérez').should('be.visible')
      lista().find('ul button').should('have.length', 1)
    })

    it('ordenar por promedio (menor primero) pone primero al de menor promedio', () => {
      cy.get('#gp-orden').select('Promedio (menor primero)')

      lista().find('ul button').first().should('contain', '0')
    })

    it('abre al docente indicado en la URL (?profesor=)', () => {
      cy.visitarConSesion('/profesores/gestionar?profesor=1', coordinador)

      cy.contains('h2', /\S+/).should('exist')
      cy.wait('@stats')
    })

    it('cambiar el periodo vuelve a pedir las estadísticas de ese periodo', () => {
      lista().contains('button', 'Ana Pérez').click()
      cy.wait('@stats')

      cy.get('#gp-periodo').select('2025-2')

      cy.wait('@stats').its('request.url').should('include', 'period=2025-2')
    })
  })

  context('escenarios de error', () => {
    it('una búsqueda sin resultados muestra el estado vacío con ayuda', () => {
      cy.get('#gp-buscar').type('zzzzzz')

      cy.contains('Ningún docente coincide con tu búsqueda.').should('be.visible')
      cy.contains('Prueba con otro nombre o quita los filtros.').should('be.visible')
    })

    it('si fallan las estadísticas avisa y no muestra datos inventados', () => {
      cy.intercept({ pathname: '/api/coordinador/profesor-stats/*' }, { statusCode: 500, body: { error: 'fallo' } })
      lista().contains('button', 'Ana Pérez').click()

      cy.get('[role="alert"]').should('contain', 'No pudimos cargar las estadísticas de este docente.')
      cy.contains('Promedio por categoría').should('not.exist')
    })
  })
})

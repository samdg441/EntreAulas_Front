import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/**
 * Requisito 3 — Rediseño del dashboard: indicadores en el dashboard, accesos en la barra lateral por
 * secciones y calendario con las fechas de las evaluaciones programadas.
 */
describe('Rediseño — Dashboard del coordinador (UI)', () => {
  beforeEach(() => {
    simularBackCoordinador()
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.wait('@resumen')
  })

  context('escenarios exitosos', () => {
    it('muestra los cuatro indicadores de la carrera', () => {
      cy.get('section[aria-label="Indicadores de la carrera"]').within(() => {
        cy.contains('dt', 'Profesores').should('be.visible')
        cy.contains('dt', 'Cursos activos').should('be.visible')
        cy.contains('dt', 'Promedio general').parent().should('contain', '4.50')
        cy.contains('dt', 'Docentes en riesgo').should('be.visible')
      })
    })

    it('la barra lateral agrupa las rutas del coordinador por secciones', () => {
      cy.get('nav[aria-label="Navegación principal"]').within(() => {
        ;['Principal', 'Docentes', 'Encuestas', 'Reportes y resultados', 'Control', 'Mi cuenta'].forEach((s) => cy.contains(s).should('be.visible'))
        cy.contains('a', 'Gestión de profesores').should('have.attr', 'href', '/profesores/gestionar')
        cy.contains('a', 'Auditoría').should('have.attr', 'href', '/auditoria')
        cy.contains('a', 'Inicio').should('have.attr', 'aria-current', 'page')
      })
    })

    it('el calendario marca la apertura y el cierre de la evaluación programada', () => {
      cy.wait('@ventanas')
      cy.contains('h2', 'Calendario de evaluaciones').should('be.visible')
      cy.get('[role="gridcell"][aria-label*="apertura de la evaluación"]').should('have.length', 1)
      cy.get('[role="gridcell"][aria-label*="cierre de la evaluación"]').should('have.length', 1)
      cy.contains('Evaluación abierta · Cierra').should('be.visible')
    })

    it('desde la barra lateral se llega a la auditoría y la opción queda activa', () => {
      cy.contains('nav a', 'Auditoría').click()

      cy.location('pathname').should('eq', '/auditoria')
      cy.contains('nav a', 'Auditoría').should('have.attr', 'aria-current', 'page')
    })

    it('el nombre del docente enlaza a su detalle', () => {
      cy.contains('a', 'Ana Pérez').click()

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/profesores/gestionar')
        expect(loc.search).to.match(/profesor=/)
      })
    })
  })

  context('escenarios alternativos', () => {
    it('ya no hay tarjetas de "Acciones rápidas": viven en la barra lateral', () => {
      cy.contains(/Acciones R[aá]pidas/i).should('not.exist')
    })

    it('en móvil la barra lateral se abre con el botón de menú y se cierra con Escape', () => {
      cy.viewport(390, 844)
      cy.get('nav[aria-label="Navegación principal"]').should('not.be.visible')

      cy.get('button[aria-label="Abrir menú de navegación"]').click()
      cy.get('nav[aria-label="Navegación principal"]').should('be.visible')
      cy.get('body').type('{esc}')

      cy.get('nav[aria-label="Navegación principal"]').should('not.be.visible')
    })

    it('un solo clic en "Hoy" del calendario vuelve al mes actual', () => {
      cy.get('button[aria-label="Mes siguiente"]').click()
      cy.contains('button', 'Hoy').click()

      cy.get('[role="gridcell"][aria-current="date"]').should('exist')
    })
  })

  context('escenarios de error', () => {
    it('si el servidor falla, muestra una alerta y deja la pantalla usable', () => {
      cy.intercept({ pathname: '/api/coordinador/dashboard-summary' }, { statusCode: 500, body: { error: 'fallo' } }).as('falla')
      cy.visitarConSesion('/dashboard-coordinador', coordinador)

      cy.wait('@falla')
      cy.get('[role="alert"]').should('contain', 'No pudimos cargar la información')
      cy.contains('a', 'Auditoría').should('be.visible')
    })

    it('si falla el calendario avisa sin interrumpir y el resto sigue disponible', () => {
      cy.intercept({ pathname: '/api/periodos/evaluacion' }, { statusCode: 500, body: {} }).as('sinFechas')
      cy.visitarConSesion('/dashboard-coordinador', coordinador)

      cy.wait('@sinFechas')
      cy.get('output').should('contain', 'No pudimos cargar las fechas de evaluación')
      cy.contains('dt', 'Profesores').should('be.visible')
    })
  })
})

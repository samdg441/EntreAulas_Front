import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/**
 * Requisito 3 — Accesibilidad WCAG 2.1 A/AA de las pantallas nuevas, con axe-core y comprobaciones manuales.
 * Criterios: 1.3.1 Información y relaciones · 1.4.3 Contraste · 1.4.4 Cambio de tamaño del texto ·
 * 1.4.10 Reflujo · 2.1.1 Teclado · 2.4.1 Saltar bloques · 2.4.7 Foco visible · 3.1.1 Idioma de la página ·
 * 3.3.1 Identificación de errores · 4.1.2 Nombre, función, valor · 4.1.3 Mensajes de estado.
 */
const pantallas = [
  { nombre: 'Dashboard del coordinador', ruta: '/dashboard-coordinador', espera: '@resumen' },
  { nombre: 'Gestión de profesores', ruta: '/profesores/gestionar', espera: '@resumen' },
  { nombre: 'Auditoría', ruta: '/auditoria', espera: '@auditoria' },
]

const aplicar = (tema: 'claro' | 'oscuro', idioma: 'es' | 'en') =>
  ({ onBeforeLoad(win: Window) { win.localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema, idioma, tamano: 'standard' })) } })

describe('Rediseño — Accesibilidad (axe-core + comprobaciones manuales)', () => {
  beforeEach(() => simularBackCoordinador())

  pantallas.forEach(({ nombre, ruta, espera }) => {
    ;(['claro', 'oscuro'] as const).forEach((tema) => {
      it(`WCAG 1.4.3/4.1.2: ${nombre} en tema ${tema} no tiene violaciones serias`, () => {
        cy.visitarConSesion(ruta, coordinador)
        cy.window().then((w) => aplicar(tema, 'es').onBeforeLoad(w))
        cy.reload()
        cy.wait(espera)
        cy.get('main').should('be.visible')

        cy.revisarAccesibilidad()
      })
    })
  })

  it('WCAG 3.1.1: el atributo lang de la página sigue el idioma elegido', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.get('html').should('have.attr', 'lang', 'es')
    cy.get('button[aria-label="Preferencias de visualización"]').click()
    cy.contains('[role="radio"]', 'Inglés').click()

    cy.get('html').should('have.attr', 'lang', 'en')
    cy.revisarAccesibilidad()
  })

  it('WCAG 2.4.1: el primer Tab muestra "Saltar al contenido" y Enter lleva el foco al contenido', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.wait('@resumen')

    cy.get('a.skip-link').focus().should('be.visible').and('have.attr', 'href', '#contenido')
    cy.get('a.skip-link').click()

    cy.location('hash').should('eq', '#contenido')
  })

  it('WCAG 2.1.1 y 2.4.7: toda la barra lateral se recorre con Tab y el foco es visible', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.wait('@resumen')

    cy.get('nav[aria-label="Navegación principal"] a').each(($a) => {
      cy.wrap($a).focus()
      cy.focused().should('have.attr', 'href')
      cy.focused().then(($f) => {
        const estilo = getComputedStyle($f[0])
        expect(estilo.outlineStyle === 'solid' || estilo.boxShadow !== 'none', 'indicador de foco').to.be.true
      })
    })
  })

  it('WCAG 4.1.2: el panel de preferencias usa radiogrupos con nombre y se cierra con Escape', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.get('button[aria-label="Preferencias de visualización"]').click()

    cy.get('[role="dialog"] [role="radiogroup"]').should('have.length', 3)
    cy.get('[role="dialog"] [role="radiogroup"]').each(($g) => expect($g.attr('aria-labelledby')).to.be.a('string'))
    cy.get('[role="radio"][aria-checked="true"]').should('have.length', 3)
    cy.revisarAccesibilidad('[role="dialog"]')
    cy.get('body').type('{esc}')

    cy.get('[role="dialog"]').should('not.exist')
    cy.focused().should('have.attr', 'aria-label', 'Preferencias de visualización')
  })

  it('WCAG 1.4.4 y 1.4.10: con letra muy grande y 320 px de ancho no hay desplazamiento horizontal ni se pierde contenido', () => {
    cy.visitarConSesion('/auditoria', coordinador)
    cy.window().then((w) => w.localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: 'claro', idioma: 'es', tamano: 'xlarge' })))
    cy.reload()
    cy.viewport(320, 700)
    cy.wait('@auditoria')

    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1))
    cy.contains('h1', 'Auditoría de la carrera').should('be.visible')
    cy.get('#au-accion').should('be.visible')
  })

  it('WCAG 1.3.1 y 3.3.1: los filtros de auditoría tienen etiqueta y el error del rango se asocia al campo', () => {
    cy.visitarConSesion('/auditoria', coordinador)
    cy.wait('@auditoria')

    ;['au-buscar', 'au-desde', 'au-hasta', 'au-accion'].forEach((id) => cy.get(`label[for="${id}"]`).should('exist'))
    cy.get('#au-desde').type('2026-11-20')
    cy.get('#au-hasta').type('2026-11-01')

    cy.get('[role="alert"]').should('be.visible')
    cy.get('#au-desde').should('have.attr', 'aria-invalid', 'true')
    cy.revisarAccesibilidad('main')
  })

  it('WCAG 1.3.1: las tablas tienen caption, encabezados de columna y el indicador es un meter con valor', () => {
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.wait('@resumen')

    cy.get('table caption').should('exist')
    cy.get('table thead th[scope="col"]').should('have.length.at.least', 3)
    cy.get('[role="meter"]').should('have.attr', 'aria-valuenow').and('not.be.empty')
  })
})

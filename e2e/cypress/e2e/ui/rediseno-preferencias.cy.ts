import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/** Requisito 3 — Accesibilidad: modo noche, idioma y tamaño de texto estandarizado. */
describe('Rediseño — Preferencias de visualización (UI)', () => {
  const abrirPanel = () => cy.get('button[aria-label="Preferencias de visualización"]').click()

  beforeEach(() => {
    simularBackCoordinador()
    cy.visitarConSesion('/dashboard-coordinador', coordinador)
    cy.wait('@resumen')
  })

  it('modo noche: aplica la clase dark, cambia el fondo y se recuerda al recargar', () => {
    abrirPanel()
    cy.contains('[role="radio"]', 'Noche').click()

    cy.get('html').should('have.class', 'dark')
    cy.get('body').should('have.css', 'background-color', 'rgb(11, 18, 32)')
    cy.reload()
    cy.get('html').should('have.class', 'dark')
  })

  it('idioma: pasa a inglés (menú, indicadores y calendario) y recarga conservando la elección', () => {
    abrirPanel()
    cy.contains('[role="radio"]', 'Inglés').click()

    cy.get('html').should('have.attr', 'lang', 'en')
    cy.contains('nav a', 'Teacher management').should('be.visible')
    cy.contains('dt', 'Teachers at risk').should('be.visible')
    cy.contains('h2', 'Evaluation calendar').should('be.visible')
    cy.reload()
    cy.get('html').should('have.attr', 'lang', 'en')
  })

  it('tamaño de texto: cada nivel cambia el tamaño de letra base y "Estándar" lo restablece', () => {
    const base = () => cy.get('html').then(($h) => parseFloat(getComputedStyle($h[0]).fontSize))
    abrirPanel()

    cy.contains('[role="radio"]', 'Muy grande').click()
    base().should('eq', 20)
    cy.contains('[role="radio"]', 'Pequeño').click()
    base().should('eq', 14)
    cy.contains('[role="radio"]', 'Estándar').click()
    base().should('eq', 16)
  })

  it('tipografía estándar: los títulos, subtítulos y textos usan solo cinco tamaños', () => {
    cy.get('main *:visible').then(($els) => {
      const tamanos = new Set<string>()
      $els.each((_, el) => {
        if (el.childNodes.length && Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim())) {
          tamanos.add(getComputedStyle(el).fontSize)
        }
      })
      // título 28 · subtítulo 20 · texto 16 · pequeño 14 · display 36 (con la letra estándar de 16 px).
      const permitidos = ['14px', '16px', '20px', '28px', '36px']
      expect([...tamanos].filter((t) => !permitidos.includes(t)), 'tamaños fuera de la escala').to.deep.equal([])
      expect(tamanos.size).to.be.at.most(5)
    })
  })

  it('la elección de noche, inglés y letra grande sobrevive a navegar a otra pantalla', () => {
    abrirPanel()
    cy.contains('[role="radio"]', 'Noche').click()
    cy.contains('[role="radio"]', 'Grande').click()
    cy.contains('[role="radio"]', 'Inglés').click()
    cy.get('body').type('{esc}')

    cy.contains('nav a', 'Audit log').click()

    cy.get('html').should('have.class', 'dark').and('have.attr', 'lang', 'en').and('have.attr', 'data-text-size', 'large')
  })

  it('en móvil (390 px) no hay desplazamiento horizontal con letra muy grande', () => {
    cy.viewport(390, 844)
    abrirPanel()
    cy.contains('[role="radio"]', 'Muy grande').click()
    cy.get('body').type('{esc}')

    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1)
    })
  })
})

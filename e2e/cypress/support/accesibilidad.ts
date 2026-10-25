/**
 * Auditoría de accesibilidad con axe-core (WCAG 2.1 A/AA) sin cypress-axe:
 * cypress-axe no declara compatibilidad con Cypress 16, así que se inyecta axe directamente.
 */
import type { AxeResults, Result } from 'axe-core'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Falla si axe encuentra violaciones serias o críticas en el contexto dado. */
      revisarAccesibilidad(contexto?: string): Chainable<AxeResults>
    }
  }
}

const resumir = (v: Result) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`

/** framer-motion anima la opacidad al montar: axe mediría el contraste a media transición. */
function esperarFinDeAnimaciones(contexto: string) {
  cy.document({ log: false }).should((doc) => {
    const objetivo = doc.querySelector(contexto) ?? doc.body
    // Solo cuentan los elementos que envuelven o están dentro de lo que se audita (no fondos con opacidad fija).
    const enTransicion = Array.from(doc.querySelectorAll<HTMLElement>('[style*="opacity"], [style*="transform"]')).filter(
      (el) =>
        (el.contains(objetivo) || objetivo.contains(el)) &&
        ((el.style.opacity !== '' && el.style.opacity !== '1') || /scale\((?!1\))/.test(el.style.transform))
    )
    expect(enTransicion, 'elementos animándose').to.have.length(0)
  })
}

Cypress.Commands.add('revisarAccesibilidad', (contexto = 'body') => {
  esperarFinDeAnimaciones(contexto)
  cy.readFile('node_modules/axe-core/axe.min.js', { log: false }).then((fuente: string) => {
    cy.window({ log: false }).then((win) => {
      win.eval(fuente)
    })
  })
  return cy.window({ log: false }).then((win) => {
    const axe = (win as unknown as { axe: typeof import('axe-core') }).axe
    return cy
      .wrap(axe.run(win.document.querySelector(contexto) ?? win.document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }), { log: false })
      .then((resultado) => {
        const r = resultado as AxeResults
        const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
        graves.forEach((v) => Cypress.log({ name: 'a11y', message: resumir(v) }))
        expect(graves.map(resumir), 'violaciones serias o críticas de WCAG').to.deep.equal([])
        return r
      })
  })
})

export {}

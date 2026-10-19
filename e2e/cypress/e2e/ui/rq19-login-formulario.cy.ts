/**
 * RQ19 — UI del formulario de login (estilo CYPRESS-ENTERPRISE/ui).
 * Valida el front sin llegar al back: correo inválido y campos vacíos.
 */
describe('RQ19 — UI: validación del login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('informa que el correo no es válido y no llama al back', () => {
    cy.intercept({ method: 'POST', pathname: '/api/auth/login' }, cy.spy().as('login'))

    cy.get('input[type="email"]').type('correo-sin-arroba')
    cy.get('input[type="password"]').type('Clave-Segura2026!', { log: false })
    cy.get('button[type="submit"]').click()

    cy.contains('Por favor, ingresa un correo electrónico válido').should('be.visible')
    cy.location('pathname').should('eq', '/login')
    cy.get('@login').should('not.have.been.called')
  })

  it('con correo vacío el navegador bloquea el envío (HTML required)', () => {
    cy.get('input[type="password"]').type('Clave-Segura2026!', { log: false })
    cy.get('button[type="submit"]').click()

    cy.get('input[type="email"]').then(($el) => {
      const input = $el[0] as HTMLInputElement
      expect(input.checkValidity()).to.eq(false)
      expect(input.validationMessage).to.match(/completa|fill|rellene/i)
    })
    cy.location('pathname').should('eq', '/login')
  })

  it('muestra el selector de tipo de usuario y el botón de envío', () => {
    cy.get('form button[type="button"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain.text', 'Iniciar sesión')
  })
})

/**
 * Cypress Studio / cy.prompt para RQ6 y RQ17.
 * No entra en `npm run test:e2e`: cy.prompt llama a Cypress Cloud (plan Starter gratuito)
 * y solo corre en Chrome o Edge, con sesión iniciada en la app o con --record --key.
 *
 * Con el front en :3001:
 *   npm run cy:prompt
 */
describe('cy.prompt — RQ6 y RQ17', () => {
  it('RQ6: sin sesión, usuarios del sistema vuelve al login', () => {
    cy.prompt([
      'visit /admin/users',
      'verify the URL path is /login',
      'verify the button "Iniciar sesión" is visible',
    ])
  })

  it('RQ17: un QR sin token no abre la evaluación', () => {
    cy.prompt([
      'visit /qr-evaluacion',
      'verify the text "No se pudo abrir la encuesta" is visible',
      'verify the text "No se encontró token en el QR." is visible',
    ])
  })
})

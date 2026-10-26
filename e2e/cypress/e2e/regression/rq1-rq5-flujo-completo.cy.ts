/**
 * RQ1–RQ5 — Regresión del flujo completo de autenticación, de punta a punta por la UI:
 * el admin crea al usuario (RQ1) → el usuario inicia sesión (RQ2) → olvida su clave y pide el enlace (RQ3.1)
 * → el back "envía" el correo con el enlace (RQ4) → abre el enlace y se valida el token (RQ3.2)
 * → define una nueva clave (RQ5) → la clave anterior deja de servir y la nueva funciona.
 *
 * El back se simula con un estado en memoria (usuarios, tokens y correos enviados) para que el flujo sea
 * determinista y se pueda repetir en cada cambio: si un paso deja de enviar o validar lo que debe, la cadena se rompe.
 */
import { usuarios } from '../../support/commands'
import { levantarBackEnMemoria } from '../../support/back-en-memoria'

const CLAVE_INICIAL = 'Clave-Inicial2026!'
const CLAVE_NUEVA = 'Clave-Nueva2026!'
const EMAIL = 'flujo.e2e@soyudemedellin.edu.co'

function iniciarSesion(email: string, clave: string) {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(clave, { log: false })
  cy.get('button[type="submit"]').click()
  return cy.wait('@login')
}

function cerrarSesion() {
  cy.clearLocalStorage()
}

describe('RQ1–RQ5 — Regresión: ciclo de vida de una cuenta', () => {
  it('alta → login → recuperación → nueva clave → login con la clave nueva', () => {
    cy.simularBackVacio()
    const back = levantarBackEnMemoria()

    // RQ1: el admin crea la cuenta
    cy.visitarConSesion('/admin/users', usuarios.admin)
    cy.contains('button', 'Agregar usuario').click()
    cy.get('#nombre').type('flujo')
    cy.get('#apellido').type('completo')
    cy.get('#correo-institucional').type('flujo.e2e')
    cy.get('#contraseña').type(CLAVE_INICIAL, { log: false })
    cy.contains('button[type="submit"]', 'Crear').click()
    cy.wait('@crear').its('response.statusCode').should('eq', 201)
    cy.contains('td', EMAIL).should('be.visible')
    cerrarSesion()

    // RQ2: el usuario entra con la clave inicial
    iniciarSesion(EMAIL, CLAVE_INICIAL).its('response.statusCode').should('eq', 200)
    cy.location('pathname').should('eq', '/dashboard-estudiante')
    cerrarSesion()

    // RQ3.1 + RQ4: pide el enlace y "recibe" el correo
    cy.visit('/forgot-password')
    cy.get('input[type="email"]').type(EMAIL)
    cy.contains('button', 'Enviar enlace de recuperación').click()
    cy.wait('@solicitud')
    cy.contains('Solicitud enviada').should('be.visible')
    cy.wrap(back.correos).should('have.length', 1).its('0.para').should('eq', EMAIL)

    // RQ3.2: abre el enlace del correo y el token se valida
    cy.then(() => cy.visit(back.correos[0].enlace))
    cy.wait('@validar').its('response.statusCode').should('eq', 200)

    // RQ5: define la nueva clave
    cy.get('#nueva-contraseña').type(CLAVE_NUEVA, { log: false })
    cy.get('#confirmar-nueva-contraseña').type(CLAVE_NUEVA, { log: false })
    cy.contains('button', 'Actualizar contraseña').click()
    cy.wait('@reset').its('response.statusCode').should('eq', 200)
    cy.contains('Contraseña actualizada').should('be.visible')

    // El enlace es de un solo uso (en dev, StrictMode valida dos veces: se mira la UI, no el orden de las peticiones)
    cy.wrap(back.tokens).its('0.usado').should('eq', true)
    cy.then(() => cy.visit(back.correos[0].enlace))
    cy.contains('Enlace no válido').should('be.visible')
    cy.contains('Token inválido o ya utilizado').should('be.visible')

    // La clave anterior ya no sirve; la nueva sí
    iniciarSesion(EMAIL, CLAVE_INICIAL).its('response.statusCode').should('eq', 401)
    cy.contains('Credenciales inválidas').should('be.visible')
    iniciarSesion(EMAIL, CLAVE_NUEVA).its('response.statusCode').should('eq', 200)
    cy.location('pathname').should('eq', '/dashboard-estudiante')
  })

  it('un correo no registrado no genera token ni correo, pero la UI responde igual', () => {
    cy.simularBackVacio()
    const back = levantarBackEnMemoria()
    cy.visit('/forgot-password')
    cy.get('input[type="email"]').type('desconocido@soyudemedellin.edu.co')
    cy.contains('button', 'Enviar enlace de recuperación').click()
    cy.wait('@solicitud')
    cy.contains('Solicitud enviada').should('be.visible')
    cy.wrap(back.correos).should('have.length', 0)
    cy.wrap(back.tokens).should('have.length', 0)
  })

  it('el alta duplicada se rechaza y la cuenta original sigue intacta', () => {
    cy.simularBackVacio()
    const back = levantarBackEnMemoria()
    cy.visitarConSesion('/admin/users', usuarios.admin)
    Cypress._.times(2, () => {
      cy.contains('button', 'Agregar usuario').click()
      cy.get('#nombre').type('dup')
      cy.get('#apellido').type('licado')
      cy.get('#correo-institucional').type('dup.e2e')
      cy.get('#contraseña').type(CLAVE_INICIAL, { log: false })
      cy.contains('button[type="submit"]', 'Crear').click()
      cy.wait('@crear')
    })
    cy.contains('El email ya está registrado').should('be.visible')
    cy.wrap(back.cuentas).should('have.length', 1)
  })
})

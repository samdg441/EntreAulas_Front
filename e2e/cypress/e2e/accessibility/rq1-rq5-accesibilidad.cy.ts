/**
 * RQ1–RQ5 — Accesibilidad (WCAG 2.1 AA) de las pantallas de autenticación con axe-core,
 * más comprobaciones de teclado y lector de pantalla que axe no cubre por sí solo.
 */
import { usuarios } from '../../support/commands'

const TOKEN = 'c'.repeat(64)
const EMAIL = 'eva@soyudemedellin.edu.co'

describe('RQ1–RQ5 — Accesibilidad de autenticación', () => {
  beforeEach(() => {
    cy.simularBackVacio()
  })

  it('RQ2: el login no tiene violaciones serias de WCAG', () => {
    cy.visit('/login')
    cy.get('form').should('be.visible')
    cy.revisarAccesibilidad('form')
  })

  it('RQ2 [DEF-FE-11]: con una sola tabulación desde la contraseña se llega al botón de envío', () => {
    cy.visit('/login')
    cy.get('input[type="password"]').focus()
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('have.attr', 'type', 'submit')
  })

  it('RQ2 [DEF-FE-09]: el error de credenciales se anuncia (role="alert" o aria-live)', () => {
    cy.intercept('POST', '**/api/auth/login', { statusCode: 401, body: { error: 'Credenciales inválidas' } })
    cy.visit('/login')
    cy.get('input[type="email"]').type(EMAIL)
    cy.get('input[type="password"]').type('Mala-Clave2026!')
    cy.get('button[type="submit"]').click()
    cy.contains('Credenciales inválidas').closest('[role="alert"], [aria-live]').should('exist')
  })

  it('RQ3.1 / RQ4: la solicitud de recuperación no tiene violaciones serias', () => {
    cy.visit('/forgot-password')
    cy.get('form').should('be.visible')
    cy.revisarAccesibilidad('form')
  })

  it('RQ3.1 [DEF-FE-10]: el campo con error declara aria-invalid y se une a su mensaje', () => {
    cy.visit('/forgot-password')
    cy.get('input[type="email"]').type('sin-punto@dominio')
    cy.contains('button', 'Enviar enlace de recuperación').click()
    cy.get('input[type="email"]').should('have.attr', 'aria-invalid', 'true').and('have.attr', 'aria-describedby')
  })

  it('RQ3.2: el aviso de enlace no válido no tiene violaciones serias', () => {
    cy.visit('/reset-password')
    cy.contains('El enlace de recuperación es inválido').should('be.visible')
    cy.revisarAccesibilidad()
  })

  it('RQ5 [DEF-FE-08]: el formulario de nueva contraseña no tiene violaciones serias (botones del ojo con nombre)', () => {
    cy.intercept('GET', '**/api/auth/validate-reset-token/*', { statusCode: 200, body: { message: 'Token válido' } })
    cy.visit(`/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)
    cy.get('form').should('be.visible')
    cy.revisarAccesibilidad('form')
  })

  it('RQ1: el formulario de alta de usuarios no tiene violaciones serias', () => {
    cy.intercept('GET', '**/api/users', { fixture: 'auth/usuarios.json' })
    cy.visitarConSesion('/admin/users', usuarios.admin)
    cy.contains('button', 'Agregar usuario').click()
    cy.get('form').should('be.visible')
    cy.revisarAccesibilidad('form')
  })
})

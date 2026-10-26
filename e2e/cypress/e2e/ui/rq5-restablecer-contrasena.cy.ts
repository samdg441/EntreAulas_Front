/**
 * RQ5 — Restablecer contraseña: con un token válido el usuario define una nueva contraseña.
 */
const TOKEN = 'b'.repeat(64)
const EMAIL = 'eva@soyudemedellin.edu.co'
const NUEVA = 'Nueva-Clave2026!'

function abrirEnlaceValido() {
  cy.intercept('GET', '**/api/auth/validate-reset-token/*', { statusCode: 200, body: { message: 'Token válido' } }).as('validar')
  cy.visit(`/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)
  cy.wait('@validar')
}

function escribirClaves(nueva: string, confirmacion: string) {
  if (nueva) cy.get('#nueva-contraseña').type(nueva, { log: false })
  if (confirmacion) cy.get('#confirmar-nueva-contraseña').type(confirmacion, { log: false })
  cy.contains('button', 'Actualizar contraseña').click()
}

describe('RQ5 — UI: restablecer la contraseña', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    abrirEnlaceValido()
  })

  context('escenarios exitosos', () => {
    it('envía token, correo y nueva clave; confirma y permite volver al login', () => {
      cy.intercept('POST', '**/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'Tu contraseña ha sido actualizada exitosamente' },
      }).as('reset')

      escribirClaves(NUEVA, NUEVA)

      cy.wait('@reset').its('request.body').should('deep.include', { token: TOKEN, email: EMAIL, newPassword: NUEVA })
      cy.contains('Contraseña actualizada').should('be.visible')
      cy.contains('button', 'Ir al inicio de sesión').click()
      cy.location('pathname').should('eq', '/login')
    })
  })

  context('escenarios alternativos', () => {
    it('el ojo muestra y oculta la contraseña escrita', () => {
      cy.get('#nueva-contraseña').type(NUEVA, { log: false }).should('have.attr', 'type', 'password')
      cy.get('#nueva-contraseña').parent().find('button[type="button"]').click()
      cy.get('#nueva-contraseña').should('have.attr', 'type', 'text')
    })

    it('al corregir el campo desaparece el error anterior', () => {
      escribirClaves('corta', 'corta')
      cy.contains('al menos 8 caracteres').should('be.visible')
      cy.get('#nueva-contraseña').type('X')
      cy.contains('al menos 8 caracteres').should('not.exist')
    })
  })

  context('escenarios de error', () => {
    it('las contraseñas no coinciden: no llama al back', () => {
      cy.intercept('POST', '**/api/auth/reset-password', cy.spy().as('reset'))
      escribirClaves(NUEVA, 'Otra-Clave2026!')
      cy.contains('Las contraseñas no coinciden').should('be.visible')
      cy.get('@reset').should('not.have.been.called')
    })

    const politica = [
      ['menos de 8 caracteres', 'Ab1!', 'al menos 8 caracteres'],
      ['sin mayúscula', 'nueva-clave2026!', 'al menos una letra mayúscula'],
      ['sin minúscula', 'NUEVA-CLAVE2026!', 'al menos una letra minúscula'],
      ['sin número', 'Nueva-Clave!!', 'al menos un número'],
      ['sin carácter especial', 'NuevaClave2026', 'al menos un carácter especial'],
    ]
    politica.forEach(([caso, clave, mensaje]) => {
      it(`política de clave: ${caso}`, () => {
        cy.intercept('POST', '**/api/auth/reset-password', cy.spy().as('reset'))
        escribirClaves(clave, clave)
        cy.contains(mensaje).should('be.visible')
        cy.get('@reset').should('not.have.been.called')
      })
    })

    it('campos vacíos: pide la nueva contraseña (el navegador bloquea el envío)', () => {
      cy.contains('button', 'Actualizar contraseña').click()
      cy.get('#nueva-contraseña').then(($el) => expect(($el[0] as HTMLInputElement).checkValidity()).to.eq(false))
    })

    it('el token caducó entre la validación y el envío: muestra el error del back', () => {
      cy.intercept('POST', '**/api/auth/reset-password', { statusCode: 400, body: { error: 'Token inválido o expirado' } }).as('reset')
      escribirClaves(NUEVA, NUEVA)
      cy.wait('@reset')
      cy.contains('Token inválido o expirado').should('be.visible')
      cy.contains('Contraseña actualizada').should('not.exist')
    })
  })
})

export {}

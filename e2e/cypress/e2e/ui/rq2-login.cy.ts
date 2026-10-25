/**
 * RQ2 — Login: el usuario inicia sesión y obtiene un token según su rol.
 * Back simulado con cy.intercept: se valida lo que hace el front con cada respuesta.
 */
const CLAVE = 'Clave-Segura2026!'

function elegirTipo(etiqueta: string) {
  cy.get('form button[type="button"]').first().click()
  cy.contains('form button[type="button"]', etiqueta).click()
}

function enviarCredenciales(email: string, clave = CLAVE) {
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(clave, { log: false })
  cy.get('button[type="submit"]').click()
}

describe('RQ2 — UI: inicio de sesión', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.visit('/login')
  })

  context('escenarios exitosos', () => {
    it('estudiante entra a su panel y el token queda guardado', () => {
      cy.intercept('POST', '**/api/auth/login', { fixture: 'auth/login-estudiante.json' }).as('login')

      enviarCredenciales('eva@soyudemedellin.edu.co')

      cy.wait('@login').its('request.body').should('deep.equal', { email: 'eva@soyudemedellin.edu.co', password: CLAVE })
      cy.location('pathname').should('eq', '/dashboard-estudiante')
      cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'token-e2e-estudiante')
      cy.window()
        .its('localStorage')
        .invoke('getItem', 'user')
        .then((u) => expect(JSON.parse(String(u))).to.include({ tipo_usuario: 'estudiante' }))
    })

    it('administrador elige su tipo y llega al panel de administración', () => {
      cy.intercept('POST', '**/api/auth/login', { fixture: 'auth/login-admin.json' }).as('login')

      elegirTipo('Administrador')
      cy.get('button[type="submit"]').should('contain.text', 'Iniciar sesión como Administrador')
      enviarCredenciales('ada@udemedellin.edu.co')

      cy.wait('@login')
      cy.location('pathname').should('eq', '/dashboard-admin')
    })
  })

  context('escenarios alternativos', () => {
    it('cuenta con varios roles: el tipo elegido define la sesión (login-with-role)', () => {
      cy.intercept('POST', '**/api/auth/login', { fixture: 'auth/login-multirol.json' }).as('login')
      cy.intercept('POST', '**/api/auth/login-with-role', (req) => {
        expect(req.body).to.include({ email: 'mia@udemedellin.edu.co', selectedRole: 'coordinador' })
        req.reply({
          token: 'token-e2e-coord',
          user: {
            id: 'u-multi',
            email: 'mia@udemedellin.edu.co',
            nombre: 'MIA',
            apellido: 'MULTIROL',
            tipo_usuario: 'coordinador',
            roles: ['coordinador'],
            selected_role: 'coordinador',
          },
        })
      }).as('conRol')

      elegirTipo('Coordinador')
      enviarCredenciales('mia@udemedellin.edu.co')

      cy.wait(['@login', '@conRol'])
      cy.location('pathname').should('eq', '/dashboard-coordinador')
    })

    it('el enlace "¿Olvidaste tu contraseña?" lleva a la recuperación', () => {
      cy.contains('button', '¿Olvidaste tu contraseña?').click()
      cy.location('pathname').should('eq', '/forgot-password')
    })
  })

  context('escenarios de error', () => {
    it('credenciales inválidas: muestra el mensaje del back y no guarda token', () => {
      cy.intercept('POST', '**/api/auth/login', { statusCode: 401, body: { error: 'Credenciales inválidas' } }).as('login')

      enviarCredenciales('eva@soyudemedellin.edu.co', 'Incorrecta-2026!')

      cy.wait('@login')
      cy.contains('Credenciales inválidas').should('be.visible')
      cy.location('pathname').should('eq', '/login')
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
    })

    it('tipo de usuario distinto al de la cuenta: avisa qué tipo seleccionar', () => {
      cy.intercept('POST', '**/api/auth/login', { fixture: 'auth/login-estudiante.json' }).as('login')

      elegirTipo('Docente')
      enviarCredenciales('eva@soyudemedellin.edu.co')

      cy.wait('@login')
      cy.contains('El tipo de usuario seleccionado no coincide con tu cuenta').should('contain.text', 'Estudiante')
      cy.location('pathname').should('eq', '/login')
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
    })

    it('cuenta inactiva: el 403 del back se muestra tal cual', () => {
      cy.intercept('POST', '**/api/auth/login', { statusCode: 403, body: { error: 'Usuario inactivo' } }).as('login')

      enviarCredenciales('eva@soyudemedellin.edu.co')

      cy.wait('@login')
      cy.contains('Usuario inactivo').should('be.visible')
    })

    it('error de red o 500 sin mensaje: usa el texto genérico', () => {
      cy.intercept('POST', '**/api/auth/login', { statusCode: 500, body: {} }).as('login')

      enviarCredenciales('eva@soyudemedellin.edu.co')

      cy.wait('@login')
      cy.contains('Error en la autenticación').should('be.visible')
    })

    it('correo sin @: no llama al back', () => {
      cy.intercept('POST', '**/api/auth/login', cy.spy().as('login'))

      enviarCredenciales('eva-sin-arroba')

      cy.contains('Por favor, ingresa un correo electrónico válido').should('be.visible')
      cy.get('@login').should('not.have.been.called')
    })
  })
})

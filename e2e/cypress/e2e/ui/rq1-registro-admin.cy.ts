/**
 * RQ1 — Registro de usuarios desde admin: el admin crea usuarios con contraseña.
 * Back simulado: se verifica el payload enviado a POST /api/auth/create-user y la reacción del front.
 */
import { usuarios } from '../../support/commands'

const CLAVE = 'Clave-Segura2026!'

function abrirFormulario() {
  cy.contains('button', 'Agregar usuario').click()
  cy.contains('h2', 'Agregar usuario').should('be.visible')
}

function llenarFormulario(datos: { nombre: string; apellido: string; usuario: string; clave: string; tipo?: string }) {
  cy.get('#nombre').type(datos.nombre)
  cy.get('#apellido').type(datos.apellido)
  if (datos.tipo) cy.get('#tipo-usuario').select(datos.tipo)
  cy.get('#correo-institucional').type(datos.usuario)
  cy.get('#contraseña').type(datos.clave, { log: false })
}

describe('RQ1 — UI: registro de usuarios desde el administrador', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/users', { fixture: 'auth/usuarios.json' }).as('lista')
  })

  context('escenarios exitosos', () => {
    beforeEach(() => {
      cy.visitarConSesion('/admin/users', usuarios.admin)
      cy.wait('@lista')
    })

    it('crea un estudiante: correo con dominio de estudiante, nombre en mayúsculas y fila nueva', () => {
      cy.intercept('POST', '**/api/auth/create-user', (req) => {
        req.reply({ statusCode: 201, body: { message: 'Usuario creado', user: { id: 'u-nuevo' } } })
      }).as('crear')

      abrirFormulario()
      cy.contains('@soyudemedellin.edu.co').should('be.visible')
      llenarFormulario({ nombre: 'luis', apellido: 'pérez', usuario: 'luis.perez', clave: CLAVE })
      cy.contains('button[type="submit"]', 'Crear').click()

      cy.wait('@crear')
        .its('request.body')
        .should('deep.include', {
          email: 'luis.perez@soyudemedellin.edu.co',
          nombre: 'LUIS',
          apellido: 'PÉREZ',
          tipo_usuario: 'estudiante',
          password: CLAVE,
        })
      cy.contains('h2', 'Agregar usuario').should('not.exist')
      cy.contains('td', 'luis.perez@soyudemedellin.edu.co').should('be.visible')
    })

    it('crea un profesor: el dominio cambia a udemedellin.edu.co', () => {
      cy.intercept('POST', '**/api/auth/create-user', { statusCode: 201, body: { user: { id: 'u-prof' } } }).as('crear')

      abrirFormulario()
      llenarFormulario({ nombre: 'ana', apellido: 'gómez', usuario: 'ana.gomez', clave: CLAVE, tipo: 'profesor' })
      cy.contains('@udemedellin.edu.co').should('be.visible')
      cy.contains('button[type="submit"]', 'Crear').click()

      cy.wait('@crear').its('request.body').should('deep.include', { email: 'ana.gomez@udemedellin.edu.co', tipo_usuario: 'profesor' })
    })
  })

  context('escenarios alternativos', () => {
    beforeEach(() => {
      cy.visitarConSesion('/admin/users', usuarios.admin)
      cy.wait('@lista')
    })

    // DEF-FE-12: al teclear la «@» el valor se recorta, pero el dominio que sigue se pegaba al usuario.
    it('si se escribe el correo completo, el front se queda solo con el usuario [DEF-FE-12]', () => {
      abrirFormulario()
      cy.get('#correo-institucional').type('Carla.Ruiz@gmail.com').should('have.value', 'carla.ruiz')
    })

    it('cancelar cierra el formulario sin llamar al back', () => {
      cy.intercept('POST', '**/api/auth/create-user', cy.spy().as('crear'))
      abrirFormulario()
      cy.contains('button', 'Cancelar').click()
      cy.contains('h2', 'Agregar usuario').should('not.exist')
      cy.get('@crear').should('not.have.been.called')
    })
  })

  context('escenarios de error', () => {
    beforeEach(() => {
      cy.visitarConSesion('/admin/users', usuarios.admin)
      cy.wait('@lista')
    })

    it('correo duplicado: el mensaje del back se muestra y el modal sigue abierto', () => {
      cy.intercept('POST', '**/api/auth/create-user', { statusCode: 409, body: { error: 'El email ya está registrado' } }).as('crear')

      abrirFormulario()
      llenarFormulario({ nombre: 'eva', apellido: 'estudiante', usuario: 'eva', clave: CLAVE })
      cy.contains('button[type="submit"]', 'Crear').click()

      cy.wait('@crear')
      cy.contains('El email ya está registrado').should('be.visible')
      cy.contains('h2', 'Agregar usuario').should('be.visible')
    })

    const clavesDebiles = [
      ['sin mayúscula', 'clave-segura2026!', 'al menos una letra mayúscula'],
      ['sin número', 'Clave-Segura!!', 'al menos un número'],
      ['sin carácter especial', 'ClaveSegura2026', 'al menos un carácter especial'],
    ]
    clavesDebiles.forEach(([caso, clave, mensaje]) => {
      it(`contraseña ${caso}: se rechaza antes de llamar al back`, () => {
        cy.intercept('POST', '**/api/auth/create-user', cy.spy().as('crear'))
        abrirFormulario()
        llenarFormulario({ nombre: 'leo', apellido: 'díaz', usuario: 'leo.diaz', clave })
        cy.contains('button[type="submit"]', 'Crear').click()
        cy.contains(mensaje).should('be.visible')
        cy.get('@crear').should('not.have.been.called')
      })
    })
  })

  context('control de acceso', () => {
    it('un estudiante no puede entrar a la administración de usuarios', () => {
      cy.visitarConSesion('/admin/users', usuarios.estudiante)
      cy.location('pathname').should('eq', '/forbidden')
      cy.contains('Acceso no permitido').should('be.visible')
    })

    it('sin sesión, /admin/users redirige al login', () => {
      cy.visit('/admin/users')
      cy.location('pathname').should('eq', '/login')
    })
  })
})

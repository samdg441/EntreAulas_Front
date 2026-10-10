export const usuarios = {
  admin: { id: 'u-admin', nombre: 'Ada', apellido: 'Admin', email: 'admin@udem.edu.co', tipo_usuario: 'admin', roles: ['admin'] },
  adminEstudiante: {
    id: 'u-multi',
    nombre: 'Mia',
    apellido: 'Multirol',
    email: 'mia@udem.edu.co',
    tipo_usuario: 'estudiante',
    roles: ['estudiante', 'admin'],
  },
  estudiante: { id: 'u-est', nombre: 'Eva', apellido: 'Estudiante', email: 'eva@udem.edu.co', tipo_usuario: 'estudiante', roles: ['estudiante'] },
  coordinador: {
    id: 'u-coord',
    nombre: 'Carlos',
    apellido: 'Coordinador',
    email: 'carlos@udem.edu.co',
    tipo_usuario: 'coordinator',
    roles: ['coordinador'],
  },
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Abre la ruta con una sesión ya guardada en el navegador (sin pasar por el login real). */
      visitarConSesion(ruta: string, usuario: Record<string, unknown>): Chainable<AUTWindow>
      /** Responde 200 {} a cualquier llamada al back que la prueba no haya simulado. */
      simularBackVacio(): Chainable<null>
    }
  }
}

Cypress.Commands.add('visitarConSesion', (ruta, usuario) =>
  cy.visit(ruta, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'token-e2e')
      win.localStorage.setItem('user', JSON.stringify(usuario))
    },
  })
)

// Solo peticiones a /api/ fuera del servidor de Vite: Vite también sirve /src/api/*.ts.
const LLAMADA_AL_BACK = /^https?:\/\/(?!localhost:3001\/)[^/]+\/api\//

Cypress.Commands.add('simularBackVacio', () => cy.intercept({ url: LLAMADA_AL_BACK }, { statusCode: 200, body: {} }))

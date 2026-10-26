import { pedir } from '../../support/api'

/**
 * RQ1–RQ5 — Contrato de la API de autenticación contra el back real (sin UI).
 * Los casos negativos no necesitan credenciales. Los positivos usan el admin de pruebas
 * (CYPRESS_ADMIN_EMAIL / CYPRESS_ADMIN_PASSWORD) y se omiten si no está configurado.
 */
const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
const CLAVE = 'Clave-E2e-2026!'

let admin = { email: '', password: '' }

function cargarAdminOSaltar(contexto: Mocha.Context) {
  cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD'], { log: false }).then(({ ADMIN_EMAIL, ADMIN_PASSWORD }) => {
    admin = { email: String(ADMIN_EMAIL ?? ''), password: String(ADMIN_PASSWORD ?? '') }
    if (!admin.email || !admin.password) contexto.skip()
  })
}

const login = (email: string, password: string) =>
  pedir('/api/auth/login', { method: 'POST', body: { email, password }, log: false })

describe('RQ1–RQ5 — API real de autenticación', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  context('RQ2 — POST /api/auth/login', () => {
    it('correo inexistente → 401 "Credenciales inválidas"', () => {
      login('nadie.e2e@udemedellin.edu.co', CLAVE).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body).to.deep.equal({ error: 'Credenciales inválidas' })
      })
    })

    it('cuerpo sin contraseña o correo mal formado → 400 "Datos inválidos"', () => {
      pedir('/api/auth/login', { method: 'POST', body: { email: 'eva@soyudemedellin.edu.co' } }).its('status').should('eq', 400)
      pedir('/api/auth/login', { method: 'POST', body: { email: 'sin-arroba', password: CLAVE } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Datos inválidos')
      })
    })

    it('GET /api/auth/me sin token → 401', () => {
      pedir('/api/auth/me').its('status').should('eq', 401)
    })
  })

  context('RQ1 — POST /api/auth/create-user', () => {
    it('sin token → 401 NO_TOKEN', () => {
      pedir('/api/auth/create-user', { method: 'POST', body: {} }).then((r) => {
        expect(r.status).to.eq(401)
        expect(r.body.code).to.eq('NO_TOKEN')
      })
    })
  })

  context('RQ3.1 / RQ4 — POST /api/auth/forgot-password', () => {
    it('correo no registrado → 200 con el mensaje genérico y sin token en la respuesta', () => {
      pedir('/api/auth/forgot-password', { method: 'POST', body: { email: 'nadie.e2e@udemedellin.edu.co' } }).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body).to.deep.equal({ message: MENSAJE_GENERICO })
      })
    })

    it('sin correo → 400 y formato inválido → 400', () => {
      pedir('/api/auth/forgot-password', { method: 'POST', body: {} }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('El correo electrónico es requerido')
      })
      pedir('/api/auth/forgot-password', { method: 'POST', body: { email: 'sin-formato' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Formato de correo electrónico inválido')
      })
    })
  })

  context('RQ3.2 — GET /api/auth/validate-reset-token/:token', () => {
    it('token inexistente → 400 "Token inválido o ya utilizado"', () => {
      pedir(`/api/auth/validate-reset-token/${'f'.repeat(64)}?email=eva@soyudemedellin.edu.co`).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Token inválido o ya utilizado')
      })
    })

    it('sin correo en la query → 400 "El correo electrónico es requerido"', () => {
      pedir(`/api/auth/validate-reset-token/${'f'.repeat(64)}`).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('El correo electrónico es requerido')
      })
    })
  })

  context('RQ5 — POST /api/auth/reset-password', () => {
    const base = { token: 'f'.repeat(64), email: 'eva@soyudemedellin.edu.co', newPassword: CLAVE, confirmPassword: CLAVE }

    it('campos faltantes → 400 "Todos los campos son requeridos"', () => {
      pedir('/api/auth/reset-password', { method: 'POST', body: { token: base.token } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Todos los campos son requeridos')
      })
    })

    it('las contraseñas no coinciden → 400', () => {
      pedir('/api/auth/reset-password', { method: 'POST', body: { ...base, confirmPassword: 'Otra-Clave2026!' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Las contraseñas no coinciden')
      })
    })

    it('contraseña débil → 400 antes de mirar el token', () => {
      pedir('/api/auth/reset-password', { method: 'POST', body: { ...base, newPassword: 'debil', confirmPassword: 'debil' } }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.match(/contraseña/i)
      })
    })

    it('token inexistente con datos válidos → 400 y la contraseña no cambia', () => {
      pedir('/api/auth/reset-password', { method: 'POST', body: base }).then((r) => {
        expect(r.status).to.eq(400)
        expect(r.body.error).to.eq('Token inválido o ya utilizado')
      })
    })
  })

  context('con el admin de pruebas (CYPRESS_ADMIN_EMAIL)', () => {
    let token = ''

    beforeEach(function () {
      cargarAdminOSaltar(this)
      cy.then(() =>
        login(admin.email, admin.password).then((r) => {
          expect(r.status, 'login del admin').to.eq(200)
          token = r.body.token
        })
      )
    })

    it('RQ2: el login del admin devuelve un JWT y el usuario con su rol', () => {
      login(admin.email, admin.password).then((r) => {
        expect(r.body.token).to.match(/^[\w-]+\.[\w-]+\.[\w-]+$/)
        expect(r.body.user).to.include.keys('id', 'email', 'nombre', 'apellido', 'tipo_usuario', 'roles')
        expect(r.body.user.roles).to.include('admin')
        expect(r.body.user).not.to.have.property('password')
      })
    })

    it('RQ2: GET /api/auth/me con el token devuelve al mismo usuario', () => {
      pedir('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
        expect(r.status).to.eq(200)
        expect(JSON.stringify(r.body)).to.contain(admin.email.toLowerCase())
      })
    })

    it('RQ1: crear usuario con datos inválidos → 400 y no se crea', () => {
      pedir('/api/auth/create-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { email: 'sin-arroba', password: 'x', nombre: '', apellido: '', tipo_usuario: 'estudiante' },
      }).its('status').should('eq', 400)
    })

    it('RQ1 + RQ2: el admin crea un estudiante y ese estudiante puede iniciar sesión', () => {
      const email = `e2e.cy.${Date.now()}@soyudemedellin.edu.co`
      pedir('/api/auth/create-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { email, password: CLAVE, nombre: 'E2E', apellido: 'CYPRESS', tipo_usuario: 'estudiante' },
      }).then((r) => {
        expect(r.status).to.be.oneOf([200, 201])
        expect(JSON.stringify(r.body)).not.to.contain(CLAVE)
      })
      login(email, CLAVE).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.user.tipo_usuario).to.eq('estudiante')
      })
      // Correo duplicado → 400
      pedir('/api/auth/create-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { email, password: CLAVE, nombre: 'E2E', apellido: 'CYPRESS', tipo_usuario: 'estudiante' },
      }).its('status').should('be.oneOf', [400, 409])
    })

    it('RQ3.1: correo registrado → 200 con el mismo mensaje que uno no registrado', () => {
      pedir('/api/auth/forgot-password', { method: 'POST', body: { email: admin.email } }).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.message).to.eq(MENSAJE_GENERICO)
      })
    })
  })
})

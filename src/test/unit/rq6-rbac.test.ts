import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta, usuarioTieneRol } from '../helpers/dashboard'
import { mockEstudiante } from '../fixtures/users'

class RQ6Rbac {
  C1_sinToken() {
    expect(decidirAccesoRuta({ token: null, savedUser: null, user: null, allowedRoles: ['admin'] })).toBe(
      'login'
    )
  }

  C2_tokenSinUser() {
    expect(
      decidirAccesoRuta({
        token: 'jwt',
        savedUser: JSON.stringify({ id: 'u1' }),
        user: null,
        allowedRoles: ['admin'],
      })
    ).toBe('login')
  }

  C3_sinRolAdmin() {
    const estudiante = {
      tipo_usuario: 'estudiante',
      roles: ['estudiante'],
    }
    expect(
      decidirAccesoRuta({
        token: 'jwt',
        savedUser: JSON.stringify(estudiante),
        user: estudiante,
        allowedRoles: ['admin'],
      })
    ).toBe('forbidden')
    expect(usuarioTieneRol(estudiante, 'admin')).toBe(false)
  }

  C4_conRolAdmin() {
    const admin = { tipo_usuario: 'admin', roles: ['admin'] }
    expect(
      decidirAccesoRuta({
        token: 'jwt',
        savedUser: JSON.stringify(admin),
        user: admin,
        allowedRoles: ['admin'],
      })
    ).toBe('ok')
    expect(usuarioTieneRol(admin, 'admin')).toBe(true)
    expect(mockEstudiante.tipo_usuario).toBe('estudiante')
  }
}

const pruebas = new RQ6Rbac()

describe('RQ6 — Control de acceso (frontend)', () => {
  it('C1: sin token → login', () => pruebas.C1_sinToken())
  it('C2: token pero sin user → login', () => pruebas.C2_tokenSinUser())
  it('C3: autenticado sin rol admin → forbidden', () => pruebas.C3_sinRolAdmin())
  it('C4: autenticado con rol admin → ok', () => pruebas.C4_conRolAdmin())
})

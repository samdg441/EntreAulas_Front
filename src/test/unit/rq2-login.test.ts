import { describe, expect, it } from 'vitest'
import { destinoTrasLogin, validarCredencialesLogin } from '../helpers/auth'

class RQ2Login {
  C1_datosInvalidos() {
    expect(validarCredencialesLogin({ email: 'no-es-email', password: 'x' }).ok).toBe(false)
    expect(validarCredencialesLogin({ email: 'ana@uni.edu' }).ok).toBe(false)
  }

  C2_loginExitoso() {
    expect(validarCredencialesLogin({ email: 'ana@uni.edu', password: 'password123' }).ok).toBe(true)
    expect(destinoTrasLogin({ dashboard: '/dashboard-estudiante' })).toBe('/dashboard-estudiante')
  }

  C3_multiplesRoles() {
    expect(destinoTrasLogin({ requires_role_selection: true })).toBe('/login')
  }

  FALLA_C1_emailInvalidoSeAcepta() {
    expect(validarCredencialesLogin({ email: 'no-es-email', password: 'x' }).ok).toBe(true)
  }

  FALLA_C3_multiplesRolesVanAlAdmin() {
    expect(destinoTrasLogin({ requires_role_selection: true })).toBe('/dashboard-admin')
  }
}

const pruebas = new RQ2Login()

describe('RQ2 — Login', () => {
  it('C1: datos inválidos', () => pruebas.C1_datosInvalidos())
  it('C2: login exitoso redirige al dashboard', () => pruebas.C2_loginExitoso())
  it('C3: múltiples roles se queda en login', () => pruebas.C3_multiplesRoles())
  it('FALLA C1: email inválido — se espera (mal) ok', () => pruebas.FALLA_C1_emailInvalidoSeAcepta())
  it('FALLA C3: múltiples roles — se espera (mal) /dashboard-admin', () =>
    pruebas.FALLA_C3_multiplesRolesVanAlAdmin())
})

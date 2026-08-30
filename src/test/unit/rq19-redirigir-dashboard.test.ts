import { describe, expect, it } from 'vitest'
import { dashboardParaUsuario, decidirAccesoRuta } from '../helpers/dashboard'

class RQ19RedirigirDashboard {
  C1_usaDashboardDelBack() {
    expect(dashboardParaUsuario({ dashboard: '/dashboard-admin' })).toBe('/dashboard-admin')
  }

  C2_prioridadDeRoles() {
    expect(dashboardParaUsuario({ roles: ['estudiante', 'coordinador'] })).toBe('/dashboard-coordinador')
  }

  C3_rolesSinMatchUsaTipo() {
    expect(dashboardParaUsuario({ roles: ['otro'], tipo_usuario: 'profesor' })).toBe('/dashboard-profesor')
  }

  C4_sinRolesUsaTipo() {
    expect(dashboardParaUsuario({ tipo_usuario: 'decano' })).toBe('/dashboard-decano')
  }

  C4b_tipoDesconocido() {
    expect(dashboardParaUsuario({ tipo_usuario: 'desconocido' })).toBe('/dashboard')
  }

  C5_estudianteEnRutaAdmin() {
    expect(
      decidirAccesoRuta({
        token: 'jwt',
        savedUser: '{}',
        user: { tipo_usuario: 'estudiante', roles: ['estudiante'] },
        allowedRoles: ['admin'],
      })
    ).toBe('forbidden')
  }

  FALLA_C4b_desconocidoVaAAdmin() {
    expect(dashboardParaUsuario({ tipo_usuario: 'desconocido' })).toBe('/dashboard-admin')
  }
}

const pruebas = new RQ19RedirigirDashboard()

describe('RQ19 — Redirigir dashboard (frontend)', () => {
  it('C1: usa dashboard del back', () => pruebas.C1_usaDashboardDelBack())
  it('C2: prioridad de roles', () => pruebas.C2_prioridadDeRoles())
  it('C3: roles sin match → tipo_usuario', () => pruebas.C3_rolesSinMatchUsaTipo())
  it('C4: sin roles → tipo_usuario', () => pruebas.C4_sinRolesUsaTipo())
  it('C4b: tipo desconocido → /dashboard', () => pruebas.C4b_tipoDesconocido())
  it('C5: estudiante en ruta admin → forbidden', () => pruebas.C5_estudianteEnRutaAdmin())
  it('FALLA C4b: tipo desconocido — se espera (mal) /dashboard-admin', () =>
    pruebas.FALLA_C4b_desconocidoVaAAdmin())
})

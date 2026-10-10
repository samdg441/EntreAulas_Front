import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCoordinatorDashboardSummary } from '../../api/coordinador.api'
import { sembrarSesion } from '../helpers/render'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * RQ19 — Cómo reacciona el cliente HTTP a las respuestas de autorización del back.
 * 401 = la sesión ya no vale: se limpia. 403 = la sesión vale pero el rol no: se conserva.
 */
describe('RQ19 — API: respuestas 401 y 403', () => {
  let api: ReturnType<typeof montarApiFalsa>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.pushState({}, '', '/qr-evaluacion/token')
  })
  afterEach(() => api?.restaurar())

  it('200: la sesión se usa y se conserva', async () => {
    sembrarSesion({ roles: ['coordinador'] }, 'jwt-ok')
    api = montarApiFalsa(() => ({ status: 200, data: { teachers: [], total: 0 } }))

    await fetchCoordinatorDashboardSummary()

    expect(api.peticiones[0].authorization).toBe('Bearer jwt-ok')
    expect(window.localStorage.getItem('token')).toBe('jwt-ok')
  })

  it('Regresión RQ19: un 401 (token vencido) borra token y usuario', async () => {
    sembrarSesion({ roles: ['coordinador'] }, 'jwt-vencido')
    api = montarApiFalsa(() => ({ status: 401, data: { error: 'Token expirado', code: 'TOKEN_EXPIRED' } }))

    await expect(fetchCoordinatorDashboardSummary()).rejects.toThrow('Error al cargar el resumen del coordinador')

    expect(window.localStorage.getItem('token')).toBeNull()
    expect(window.localStorage.getItem('user')).toBeNull()
  })

  it('Regresión RQ19: un 403 (rol sin permiso) no cierra la sesión', async () => {
    sembrarSesion({ roles: ['estudiante'] }, 'jwt-estudiante')
    api = montarApiFalsa(() => ({ status: 403, data: { error: 'Solo coordinadores pueden acceder a esta información.' } }))

    await expect(fetchCoordinatorDashboardSummary()).rejects.toThrow('Error al cargar el resumen del coordinador')

    expect(window.localStorage.getItem('token')).toBe('jwt-estudiante')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../api/auth'
import { requestPasswordReset, resetPassword, validateResetToken } from '../../api/passwordReset'
import { usersApi } from '../../api/users'
import { apiClient } from '../../api/client'
import { sembrarSesion } from '../helpers/render'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * Contrato del CLIENTE con el back (RQ1, RQ2, RQ3.1, RQ3.4, RQ5): qué petición construye cada función
 * (método, URL, cuerpo, cabecera Authorization) y cómo traduce las respuestas. Es el espejo de
 * EntreAulas_Back/src/test/api/rq*.api.test.ts: si el back cambia una ruta o el front manda otro cuerpo,
 * una de las dos suites falla.
 */
describe('RQ1–RQ5 — Contrato del cliente HTTP (front → back)', () => {
  let api: ReturnType<typeof montarApiFalsa>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.pushState({}, '', '/login')
  })
  afterEach(() => api?.restaurar())

  describe('RQ2 — login', () => {
    it('RQ2·A-P1: login → POST /api/auth/login con { email, password } y SIN cabecera Authorization', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { token: 't', user: { id: '1' } } }))

      const r = await authApi.login({ email: 'ana@udemedellin.edu.co', password: 'Abcdef1!' })

      expect(api.peticiones).toHaveLength(1)
      expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/auth/login', body: { email: 'ana@udemedellin.edu.co', password: 'Abcdef1!' }, authorization: undefined })
      expect(r.token).toBe('t')
    })

    it('RQ2·A-P2: loginWithRole → POST /api/auth/login-with-role con { email, password, selectedRole }', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { token: 't', user: { id: '1' } } }))

      await authApi.loginWithRole({ email: 'ana@udemedellin.edu.co', password: 'Abcdef1!', selectedRole: 'coordinador' })

      expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/auth/login-with-role', body: { email: 'ana@udemedellin.edu.co', password: 'Abcdef1!', selectedRole: 'coordinador' } })
    })

    it('RQ2·A-P3: getProfile → GET /api/auth/profile con el token de la sesión', async () => {
      sembrarSesion({ id: '1' }, 'jwt-ok')
      api = montarApiFalsa(() => ({ status: 200, data: { id: '1' } }))

      await authApi.getProfile()

      expect(api.peticiones[0]).toMatchObject({ metodo: 'GET', url: '/api/auth/profile', authorization: 'Bearer jwt-ok' })
    })

    it('RQ2·A-N1: un 401 al iniciar sesión rechaza la promesa con el mensaje del servidor y no deja sesión', async () => {
      api = montarApiFalsa(() => ({ status: 401, data: { error: 'Credenciales inválidas' } }))

      await expect(authApi.login({ email: 'ana@udemedellin.edu.co', password: 'mala' })).rejects.toMatchObject({
        response: { status: 401, data: { error: 'Credenciales inválidas' } },
      })

      expect(window.localStorage.getItem('token')).toBeNull()
    })

    it.each([
      ['400', { status: 400, data: { error: 'Datos inválidos' } }],
      ['500', { status: 500, data: { error: 'Error interno del servidor' } }],
    ])('RQ2·A-N2: un %s del back se propaga como error (no se confunde con éxito)', async (_c, respuesta) => {
      api = montarApiFalsa(() => respuesta)

      await expect(authApi.login({ email: 'a@b.co', password: 'x' })).rejects.toBeTruthy()
    })

    it.each([['timeout' as const], ['red' as const]])('RQ2·A-N3: fallo de %s → la promesa se rechaza', async (error) => {
      api = montarApiFalsa(() => ({ error }))

      await expect(authApi.login({ email: 'a@b.co', password: 'x' })).rejects.toBeTruthy()
    })
  })

  describe('RQ1 — alta de usuarios', () => {
    const payload = { email: 'nuevo@udemedellin.edu.co', password: 'Abcdef1!', nombre: 'NUEVO', apellido: 'DOCENTE', tipo_usuario: 'profesor' }

    it('RQ1·A-P1: create → POST /api/auth/create-user con el payload íntegro y el token del admin', async () => {
      sembrarSesion({ id: 'a' }, 'jwt-admin')
      api = montarApiFalsa(() => ({ status: 201, data: { message: 'Usuario creado exitosamente', user: { id: 'n-1' } } }))

      const r = await usersApi.create(payload)

      expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/auth/create-user', body: payload, authorization: 'Bearer jwt-admin' })
      expect(r).toMatchObject({ user: { id: 'n-1' } })
    })

    it('RQ1·A-P2: la ruta del cliente coincide con la que expone el back (/api/auth/create-user)', async () => {
      api = montarApiFalsa(() => ({ status: 201, data: {} }))

      await usersApi.create(payload)

      expect(api.peticiones[0].url).toBe('/api/auth/create-user')
    })

    it('RQ1·A-N1: 403 (no es admin) se propaga y NO cierra la sesión', async () => {
      sembrarSesion({ id: 'e' }, 'jwt-estudiante')
      api = montarApiFalsa(() => ({ status: 403, data: { error: 'Acceso denegado', code: 'FORBIDDEN_ROLE' } }))

      await expect(usersApi.create(payload)).rejects.toMatchObject({ response: { status: 403 } })

      expect(window.localStorage.getItem('token')).toBe('jwt-estudiante')
    })

    it('RQ1·A-N2: 401 (token vencido) se propaga y SÍ limpia la sesión', async () => {
      sembrarSesion({ id: 'a' }, 'jwt-vencido')
      api = montarApiFalsa(() => ({ status: 401, data: { error: 'Token expirado', code: 'TOKEN_EXPIRED' } }))

      await expect(usersApi.create(payload)).rejects.toMatchObject({ response: { status: 401 } })

      expect(window.localStorage.getItem('token')).toBeNull()
      expect(window.localStorage.getItem('user')).toBeNull()
    })

    it('RQ1·A-N3: 400 por correo duplicado llega con el mensaje del servidor', async () => {
      api = montarApiFalsa(() => ({ status: 400, data: { error: 'El email ya está registrado' } }))

      await expect(usersApi.create(payload)).rejects.toMatchObject({ response: { data: { error: 'El email ya está registrado' } } })
    })
  })

  describe('RQ3.1 — solicitud de recuperación', () => {
    it('RQ3.1·A-P1: POST /api/auth/forgot-password con { email } y resultado success con el mensaje del servidor', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { message: 'Si el correo existe, recibirás un enlace' } }))

      const r = await requestPasswordReset({ email: 'ana@soyudemedellin.edu.co' })

      expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/auth/forgot-password', body: { email: 'ana@soyudemedellin.edu.co' } })
      expect(r).toEqual({ success: true, message: 'Si el correo existe, recibirás un enlace' })
    })

    it('RQ3.1·A-P2: sin mensaje del servidor usa el texto genérico de respaldo', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: {} }))

      const r = await requestPasswordReset({ email: 'ana@soyudemedellin.edu.co' })

      expect(r.success).toBe(true)
      expect(r.message).toMatch(/si el correo electrónico existe/i)
    })

    it.each([
      ['400', { status: 400, data: { error: 'Formato de correo electrónico inválido' } }, 'Formato de correo electrónico inválido'],
      ['500', { status: 500, data: { error: 'Error interno del servidor' } }, 'Error interno del servidor'],
      ['timeout', { error: 'timeout' as const }, 'Error al enviar la solicitud de recuperación'],
      ['red caída', { error: 'red' as const }, 'Error al enviar la solicitud de recuperación'],
    ])('RQ3.1·A-N1: %s → success false y mensaje legible, sin lanzar', async (_c, respuesta, mensaje) => {
      api = montarApiFalsa(() => respuesta)

      const r = await requestPasswordReset({ email: 'ana@soyudemedellin.edu.co' })

      expect(r).toEqual({ success: false, message: mensaje })
    })
  })

  describe('RQ3.4 — validación del token', () => {
    it('RQ3.4·A-P1: GET /api/auth/validate-reset-token/<token> con ?email= y success', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { message: 'Token válido', valid: true } }))
      // axios guarda ?email= en config.params (no en la URL): se lee con un interceptor de solo lectura.
      let params: unknown
      const id = apiClient.interceptors.request.use((config) => ((params = config.params), config))

      const r = await validateResetToken('tok-123', 'ana@soyudemedellin.edu.co')
      apiClient.interceptors.request.eject(id)

      expect(api.peticiones[0]).toMatchObject({ metodo: 'GET', url: '/api/auth/validate-reset-token/tok-123' })
      expect(params).toEqual({ email: 'ana@soyudemedellin.edu.co' })
      expect(r).toEqual({ success: true, message: 'Token válido' })
    })

    it('RQ3.4·A-P2: el token se codifica en la URL (no puede escapar de la ruta)', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: {} }))

      await validateResetToken('a/b?c=d&e', 'ana@soyudemedellin.edu.co')

      expect(api.peticiones[0].url).toBe('/api/auth/validate-reset-token/a%2Fb%3Fc%3Dd%26e')
    })

    it.each([
      ['expirado', { status: 400, data: { error: 'El token ha expirado. Solicita uno nuevo.' } }, 'El token ha expirado. Solicita uno nuevo.'],
      ['usado', { status: 400, data: { error: 'Token inválido o ya utilizado' } }, 'Token inválido o ya utilizado'],
      ['sin respuesta', { error: 'red' as const }, 'Token inválido o expirado'],
    ])('RQ3.4·A-N1: token %s → success false con el motivo', async (_c, respuesta, mensaje) => {
      api = montarApiFalsa(() => respuesta)

      const r = await validateResetToken('tok', 'ana@soyudemedellin.edu.co')

      expect(r).toEqual({ success: false, message: mensaje })
    })
  })

  describe('RQ5 — restablecer contraseña', () => {
    const datos = { token: 'tok-123', email: 'ana@soyudemedellin.edu.co', newPassword: 'Nueva-Clave2026!', confirmPassword: 'Nueva-Clave2026!' }

    it('RQ5·A-P1: POST /api/auth/reset-password con token, correo y ambas contraseñas', async () => {
      api = montarApiFalsa(() => ({ status: 200, data: { message: 'Contraseña actualizada exitosamente' } }))

      const r = await resetPassword(datos as Parameters<typeof resetPassword>[0])

      expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/auth/reset-password', body: datos })
      expect(r).toEqual({ success: true, message: 'Contraseña actualizada exitosamente' })
    })

    it.each([
      ['400 token usado', { status: 400, data: { error: 'Token inválido o ya utilizado' } }, 'Token inválido o ya utilizado'],
      ['400 política', { status: 400, data: { error: 'La contraseña debe contener al menos un número' } }, 'La contraseña debe contener al menos un número'],
      ['500', { status: 500, data: { error: 'Error al actualizar la contraseña' } }, 'Error al actualizar la contraseña'],
      ['timeout', { error: 'timeout' as const }, 'Error al actualizar la contraseña'],
    ])('RQ5·A-N1: %s → success false y mensaje, sin lanzar', async (_c, respuesta, mensaje) => {
      api = montarApiFalsa(() => respuesta)

      const r = await resetPassword(datos as Parameters<typeof resetPassword>[0])

      expect(r).toEqual({ success: false, message: mensaje })
    })

    it('RQ5·A-N2: un 401 en el flujo público de recuperación NO redirige al login ni borra nada', async () => {
      window.history.pushState({}, '', '/reset-password')
      window.localStorage.setItem('token', 'otra-sesion')
      api = montarApiFalsa(() => ({ status: 401, data: { error: 'No autorizado' } }))

      const r = await resetPassword(datos as Parameters<typeof resetPassword>[0])

      expect(r.success).toBe(false)
      expect(window.location.pathname).toBe('/reset-password')
    })
  })
})

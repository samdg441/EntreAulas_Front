import { test as base, Page, Route } from '@playwright/test'

/**
 * Back de autenticación en memoria para Playwright (mismas reglas que e2e/cypress/support/back-en-memoria.ts):
 * cuentas sembradas, login 401 genérico, forgot-password con mensaje único, tokens de un solo uso y buzón de correos.
 */
export type Cuenta = { email: string; password: string; nombre: string; apellido: string; tipo_usuario: string; activo?: boolean }
type Token = { token: string; email: string; usado: boolean; vencido: boolean }

export const CLAVE = 'Clave#2026a'
export const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
export const CUENTAS: Record<string, Cuenta> = {
  admin: { email: 'ada@udemedellin.edu.co', password: CLAVE, nombre: 'ADA', apellido: 'ADMIN', tipo_usuario: 'admin' },
  estudiante: { email: 'eva@soyudemedellin.edu.co', password: CLAVE, nombre: 'EVA', apellido: 'ESTUDIANTE', tipo_usuario: 'estudiante' },
  profesor: { email: 'pablo@udemedellin.edu.co', password: CLAVE, nombre: 'PABLO', apellido: 'PROFESOR', tipo_usuario: 'profesor' },
  inactivo: { email: 'inactivo@soyudemedellin.edu.co', password: CLAVE, nombre: 'INA', apellido: 'ACTIVO', tipo_usuario: 'estudiante', activo: false },
}

export class BackSimulado {
  cuentas: Cuenta[] = Object.values(CUENTAS).map((c) => ({ ...c }))
  tokens: Token[] = []
  correos: Array<{ para: string; enlace: string }> = []
  llamadas: Array<{ metodo: string; ruta: string }> = []

  emitirToken(email: string, vencido = false) {
    const token = String(this.tokens.length + 1).padStart(64, 'e')
    this.tokens.push({ token, email, usado: false, vencido })
    const enlace = `/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    this.correos.push({ para: email, enlace })
    return enlace
  }

  /** Inicia sesión sin pasar por la UI (deja token y usuario en localStorage). */
  async sesionDe(page: Page, cuenta: Cuenta) {
    await page.addInitScript((u) => {
      localStorage.setItem('token', `jwt-${u.email}`)
      localStorage.setItem('user', JSON.stringify({ id: 'u-x', ...u, password: undefined, roles: [u.tipo_usuario] }))
    }, cuenta)
  }

  async instalar(page: Page) {
    const json = (route: Route, status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const rechazo = (t?: Token) => (!t || t.usado ? 'Token inválido o ya utilizado' : t.vencido ? 'El token ha expirado. Solicita uno nuevo.' : null)

    await page.route(/^https?:\/\/(?!localhost:3001\/)[^/]+\/api\//, async (route) => {
      const req = route.request()
      const url = new URL(req.url())
      const ruta = url.pathname
      const cuerpo = req.postDataJSON?.() ?? {}
      this.llamadas.push({ metodo: req.method(), ruta })

      if (req.method() === 'POST' && ruta === '/api/auth/login') {
        const c = this.cuentas.find((x) => x.email === cuerpo.email && x.password === cuerpo.password && x.activo !== false)
        if (!c) return json(route, 401, { error: 'Credenciales inválidas' })
        return json(route, 200, { token: `jwt-${c.email}`, user: { id: 'u-1', ...c, password: undefined, roles: [c.tipo_usuario] } })
      }
      if (req.method() === 'POST' && ruta === '/api/auth/create-user') {
        if (this.cuentas.some((x) => x.email === cuerpo.email)) return json(route, 400, { error: 'El email ya está registrado' })
        this.cuentas.push({ ...cuerpo })
        return json(route, 201, { message: 'Usuario creado', user: { id: `u-${this.cuentas.length}` } })
      }
      if (req.method() === 'GET' && ruta === '/api/users') {
        return json(route, 200, { users: this.cuentas.map((c, i) => ({ id: `u-${i}`, ...c, password: undefined, activo: c.activo !== false, roles: [c.tipo_usuario] })) })
      }
      if (req.method() === 'POST' && ruta === '/api/auth/forgot-password') {
        if (this.cuentas.some((x) => x.email === cuerpo.email && x.activo !== false)) this.emitirToken(cuerpo.email)
        return json(route, 200, { message: MENSAJE_GENERICO })
      }
      if (req.method() === 'GET' && ruta.startsWith('/api/auth/validate-reset-token/')) {
        const token = decodeURIComponent(ruta.split('/validate-reset-token/')[1])
        const error = rechazo(this.tokens.find((t) => t.token === token && t.email === url.searchParams.get('email')))
        return error ? json(route, 400, { error }) : json(route, 200, { message: 'Token válido', valid: true })
      }
      if (req.method() === 'POST' && ruta === '/api/auth/reset-password') {
        const t = this.tokens.find((x) => x.token === cuerpo.token && x.email === cuerpo.email)
        const error = rechazo(t)
        if (error) return json(route, 400, { error })
        t!.usado = true
        this.cuentas.find((x) => x.email === t!.email)!.password = cuerpo.newPassword
        return json(route, 200, { message: 'Contraseña actualizada exitosamente' })
      }
      if (ruta.startsWith('/api/teachers/teacher-courses/')) return json(route, 200, [])
      return json(route, 200, {})
    })
  }
}

export const test = base.extend<{ back: BackSimulado }>({
  back: async ({ page }, use) => {
    const back = new BackSimulado()
    await back.instalar(page)
    await use(back)
  },
})

export { expect } from '@playwright/test'

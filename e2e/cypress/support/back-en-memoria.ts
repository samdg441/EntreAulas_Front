/**
 * Back de autenticación simulado con estado en memoria (cuentas, tokens de recuperación y correos enviados).
 * Reproduce las reglas del back real de RQ1–RQ5 para que los flujos E2E sean deterministas y repetibles:
 * - create-user rechaza correos duplicados (400).
 * - login responde 401 «Credenciales inválidas» igual para correo inexistente, clave errónea o cuenta inactiva.
 * - forgot-password responde siempre el mismo mensaje; solo genera token y «envía» correo si la cuenta existe (RQ4).
 * - validate-reset-token y reset-password aceptan el token una sola vez y rechazan los vencidos.
 */
export type Cuenta = {
  email: string
  password: string
  nombre: string
  apellido: string
  tipo_usuario: string
  activo?: boolean
}
export type TokenDeRecuperacion = { token: string; email: string; usado: boolean; vencido: boolean }
export type CorreoEnviado = { para: string; enlace: string }

export const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'

export interface BackEnMemoria {
  cuentas: Cuenta[]
  tokens: TokenDeRecuperacion[]
  correos: CorreoEnviado[]
  sembrar(cuenta: Cuenta): void
  emitirToken(email: string, opciones?: { vencido?: boolean }): CorreoEnviado
}

const tokenNumero = (n: number) => String(n).padStart(64, 'e')
const enlaceDe = (token: string, email: string) => `/reset-password?token=${token}&email=${encodeURIComponent(email)}`

export function levantarBackEnMemoria(): BackEnMemoria {
  const back: BackEnMemoria = {
    cuentas: [],
    tokens: [],
    correos: [],
    sembrar(cuenta) {
      back.cuentas.push({ activo: true, ...cuenta })
    },
    emitirToken(email, opciones = {}) {
      const token = tokenNumero(back.tokens.length + 1)
      back.tokens.push({ token, email, usado: false, vencido: Boolean(opciones.vencido) })
      const correo = { para: email, enlace: enlaceDe(token, email) }
      back.correos.push(correo)
      return correo
    },
  }

  // El panel del profesor espera un arreglo de cursos (con {} se rompe al montar).
  cy.intercept('GET', '**/api/teachers/teacher-courses/*', [])

  cy.intercept('GET', '**/api/users', (req) => {
    req.reply({ users: back.cuentas.map((c, i) => ({ id: `u-${i + 1}`, ...c, password: undefined, activo: c.activo !== false, roles: [c.tipo_usuario] })) })
  }).as('lista')

  cy.intercept('POST', '**/api/auth/create-user', (req) => {
    const c = req.body as Cuenta
    if (back.cuentas.some((x) => x.email === c.email)) return req.reply(400, { error: 'El email ya está registrado' })
    back.sembrar(c)
    req.reply(201, { message: 'Usuario creado', user: { id: `u-${back.cuentas.length}` } })
  }).as('crear')

  cy.intercept('POST', '**/api/auth/login', (req) => {
    const c = back.cuentas.find((x) => x.email === req.body.email && x.password === req.body.password && x.activo !== false)
    if (!c) return req.reply(401, { error: 'Credenciales inválidas' })
    req.reply({
      token: `jwt-${c.email}`,
      user: { id: 'u-1', email: c.email, nombre: c.nombre, apellido: c.apellido, tipo_usuario: c.tipo_usuario, roles: [c.tipo_usuario] },
    })
  }).as('login')

  cy.intercept('POST', '**/api/auth/forgot-password', (req) => {
    if (back.cuentas.some((x) => x.email === req.body.email && x.activo !== false)) back.emitirToken(req.body.email)
    req.reply({ message: MENSAJE_GENERICO })
  }).as('solicitud')

  const buscarToken = (token: string, email: string | null) => back.tokens.find((x) => x.token === token && x.email === email)
  const rechazo = (t: TokenDeRecuperacion | undefined) => {
    if (!t || t.usado) return 'Token inválido o ya utilizado'
    if (t.vencido) return 'El token ha expirado. Solicita uno nuevo.'
    return null
  }

  cy.intercept({ method: 'GET', url: /\/api\/auth\/validate-reset-token\// }, (req) => {
    const token = decodeURIComponent(req.url.split('/validate-reset-token/')[1].split('?')[0])
    const error = rechazo(buscarToken(token, new URL(req.url).searchParams.get('email')))
    if (error) return req.reply(400, { error })
    req.reply({ message: 'Token válido', valid: true })
  }).as('validar')

  cy.intercept('POST', '**/api/auth/reset-password', (req) => {
    const t = buscarToken(req.body.token, req.body.email)
    const error = rechazo(t)
    if (error) return req.reply(400, { error })
    t!.usado = true
    back.cuentas.find((x) => x.email === t!.email)!.password = req.body.newPassword
    req.reply({ message: 'Contraseña actualizada exitosamente' })
  }).as('reset')

  return back
}

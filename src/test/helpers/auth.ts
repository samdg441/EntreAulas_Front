import { dashboardParaUsuario } from './dashboard'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarCamposCreacionUsuario(body: {
  email?: string
  password?: string
  nombre?: string
  apellido?: string
  tipo_usuario?: string
}): { ok: boolean; error?: string } {
  if (!body.email || !body.password || !body.nombre || !body.apellido || !body.tipo_usuario) {
    return { ok: false, error: 'Todos los campos son requeridos' }
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return { ok: false, error: 'Correo inválido' }
  }
  if (body.password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }
  return { ok: true }
}

export function validarCredencialesLogin(body: { email?: string; password?: string }): {
  ok: boolean
  error?: string
} {
  if (!body.email || !body.password) {
    return { ok: false, error: 'Datos inválidos' }
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return { ok: false, error: 'Datos inválidos' }
  }
  return { ok: true }
}

export function destinoTrasLogin(params: {
  requires_role_selection?: boolean
  dashboard?: string
  roles?: string[]
  tipo_usuario?: string
}): string {
  if (params.requires_role_selection) return '/login'
  return dashboardParaUsuario({
    dashboard: params.dashboard,
    roles: params.roles,
    tipo_usuario: params.tipo_usuario,
  })
}

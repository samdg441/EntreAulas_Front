export type UsuarioDashboard = {
  dashboard?: string
  roles?: string[]
  tipo_usuario?: string
  selected_role?: string
  multiple_roles?: boolean
}

const MAPA: Record<string, string> = {
  estudiante: '/dashboard-estudiante',
  profesor: '/dashboard-profesor',
  docente: '/dashboard-profesor',
  coordinador: '/dashboard-coordinador',
  decano: '/dashboard-decano',
  admin: '/dashboard-admin',
}

const PRIORIDAD = ['admin', 'decano', 'coordinador', 'profesor', 'docente', 'estudiante']

export function getDashboardPathForUser(u: UsuarioDashboard): string {
  if (u.dashboard) return u.dashboard
  if (u.roles && u.roles.length > 0) {
    for (const role of PRIORIDAD) {
      if (u.roles.includes(role)) return MAPA[role] || '/dashboard'
    }
  }
  const tipo = (u.tipo_usuario || '').toLowerCase()
  return MAPA[tipo] || '/dashboard'
}

export function usuarioTieneRol(user: UsuarioDashboard | null, role: string): boolean {
  if (!user) return false
  const normalize = (r?: string) => (r || '').toLowerCase()
  const synonyms: Record<string, string[]> = {
    coordinador: ['coordinador', 'coordinator'],
    profesor: ['profesor', 'docente', 'teacher'],
    estudiante: ['estudiante', 'student'],
    decano: ['decano', 'dean'],
    admin: ['admin', 'administrator'],
  }
  const matches = (target: string, candidate?: string) => {
    const t = normalize(target)
    const c = normalize(candidate)
    return t === c || Boolean(synonyms[t]?.includes(c))
  }
  if (matches(role, user.selected_role)) return true
  if (matches(role, user.tipo_usuario)) return true
  if (user.multiple_roles || (user.roles && user.roles.length > 1)) {
    return (user.roles || []).some((r) => matches(role, r))
  }
  return false
}

export function decidirAccesoRuta(params: {
  token: string | null
  savedUser: string | null
  user: UsuarioDashboard | null
  allowedRoles?: string[]
}): 'login' | 'forbidden' | 'ok' {
  if (!params.token || !params.savedUser || !params.user) return 'login'
  if (params.allowedRoles?.length && !params.allowedRoles.some((r) => usuarioTieneRol(params.user, r))) {
    return 'forbidden'
  }
  return 'ok'
}

import { UserType } from '../../types'

export function getUserTypeLabel(type: UserType): string {
  switch (type) {
    case 'student':
      return 'Estudiante'
    case 'teacher':
      return 'Docente'
    case 'coordinator':
      return 'Coordinador'
    case 'decano':
      return 'Decano'
    case 'admin':
      return 'Administrador'
    default:
      return 'Estudiante'
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'estudiante':
      return 'Estudiante'
    case 'profesor':
    case 'docente':
      return 'Docente'
    case 'coordinador':
      return 'Coordinador'
    case 'admin':
      return 'Administrador'
    default:
      return role
  }
}

const ROLES_POR_TIPO: Record<string, string[]> = {
  student: ['estudiante'],
  teacher: ['profesor', 'docente'],
  coordinator: ['coordinador'],
  decano: ['decano'],
  admin: ['admin'],
}

export function rolesDeLaRespuesta(respuesta: {
  available_roles?: string[]
  user: { roles?: string[]; tipo_usuario?: string }
}): string[] {
  if (respuesta.available_roles?.length) return respuesta.available_roles
  if (respuesta.user.roles?.length) return respuesta.user.roles
  if (respuesta.user.tipo_usuario) return [respuesta.user.tipo_usuario]
  return []
}

/** Rol de backend que corresponde al tipo ya elegido en el formulario. */
export function resolverRolDeIngreso(tipoSeleccionado: string, rolesDisponibles: string[]): string | null {
  const candidatos = ROLES_POR_TIPO[tipoSeleccionado] ?? []
  return candidatos.find((rol) => rolesDisponibles.includes(rol)) ?? null
}

export function getRoleDescription(role: string): string {
  if (role === 'profesor' || role === 'docente') {
    return 'Acceso al dashboard de docentes'
  }
  if (role === 'coordinador') {
    return 'Acceso al dashboard de coordinadores'
  }
  if (role === 'estudiante') {
    return 'Acceso al dashboard de estudiantes'
  }
  return 'Acceso administrativo'
}

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

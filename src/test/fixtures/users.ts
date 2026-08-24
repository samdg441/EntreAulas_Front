/** Fixtures de usuario para pruebas RQ (frontend). */

export const mockProfesor = {
  id: 'u-profesor',
  name: 'Profesor Test',
  email: 'profesor@test.com',
  type: 'teacher' as const,
  tipo_usuario: 'profesor',
  roles: ['profesor'],
}

export const mockCoordinador = {
  id: 'u-coord',
  name: 'Coordinador Test',
  email: 'coord@test.com',
  type: 'coordinator' as const,
  tipo_usuario: 'coordinador',
  roles: ['coordinador'],
}

export const mockEstudiante = {
  id: 'u-est',
  name: 'Estudiante Test',
  email: 'est@test.com',
  type: 'student' as const,
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
}

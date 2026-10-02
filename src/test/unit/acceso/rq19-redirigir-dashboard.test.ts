import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta, getDashboardPathForUser, usuarioTieneRol } from '../../../features/auth/dashboard-path'

/**
 * RQ19 en la pantalla — al entrar, el navegador elige la ruta del rol.
 * Si la persona ya trae una ruta guardada, esa manda.
 * Si no, gana el rol de más autoridad.
 */
describe('RQ19 — redirigir al dashboard según el rol', () => {
  it('una ruta ya guardada no se recalcula', () => {
    // Arrange
    const persona = { dashboard: '/dashboard-estudiante', roles: ['admin'] }

    // Act
    const ruta = getDashboardPathForUser(persona)

    // Assert
    expect(ruta).toBe('/dashboard-estudiante')
  })

  it('admin gana sobre estudiante cuando no hay ruta guardada', () => {
    // Arrange
    const persona = { roles: ['estudiante', 'admin'] }

    // Act
    const ruta = getDashboardPathForUser(persona)

    // Assert
    expect(ruta).toBe('/dashboard-admin')
  })

  it('docente y profesor abren la misma pantalla', () => {
    // Arrange
    const docente = { roles: ['docente'] }
    const profesor = { tipo_usuario: 'profesor' }

    // Act
    const rutaDocente = getDashboardPathForUser(docente)
    const rutaProfesor = getDashboardPathForUser(profesor)

    // Assert
    expect(rutaDocente).toBe('/dashboard-profesor')
    expect(rutaProfesor).toBe('/dashboard-profesor')
  })

  it('un tipo desconocido cae en la pantalla genérica', () => {
    // Arrange
    const persona = { tipo_usuario: 'visitante' }

    // Act
    const ruta = getDashboardPathForUser(persona)

    // Assert
    expect(ruta).toBe('/dashboard')
  })

  it('“teacher” cuenta como profesor y “student” como estudiante', () => {
    // Arrange
    const profe = { tipo_usuario: 'teacher', selected_role: 'teacher' }
    const alumno = { roles: ['student'], multiple_roles: true }

    // Act
    const esProfe = usuarioTieneRol(profe, 'profesor')
    const esAlumno = usuarioTieneRol(alumno, 'estudiante')
    const sinPersona = usuarioTieneRol(null, 'admin')

    // Assert
    expect(esProfe).toBe(true)
    expect(esAlumno).toBe(true)
    expect(sinPersona).toBe(false)
  })

  it('sin sesión la ruta protegida manda al login', () => {
    // Arrange
    const pedido = { token: null, savedUser: null, user: null, allowedRoles: ['admin'] }

    // Act
    const acceso = decidirAccesoRuta(pedido)

    // Assert
    expect(acceso).toBe('login')
  })

  it('con sesión, pero sin el rol de la página, el acceso es prohibido', () => {
    // Arrange
    const pedido = {
      token: 'jwt',
      savedUser: '{}',
      user: { tipo_usuario: 'estudiante' },
      allowedRoles: ['admin'],
    }

    // Act
    const acceso = decidirAccesoRuta(pedido)

    // Assert
    expect(acceso).toBe('forbidden')
  })

  it('con sesión y el rol correcto la página se abre', () => {
    // Arrange
    const pedido = {
      token: 'jwt',
      savedUser: '{}',
      user: { tipo_usuario: 'coordinator', selected_role: 'coordinator' },
      allowedRoles: ['coordinador'],
    }

    // Act
    const acceso = decidirAccesoRuta(pedido)

    // Assert
    expect(acceso).toBe('ok')
  })
})

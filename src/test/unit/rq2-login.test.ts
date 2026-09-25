import { describe, it, expect } from 'vitest'
import {
  getUserTypeLabel,
  getRoleLabel,
  getRoleDescription,
  rolesDeLaRespuesta,
  resolverRolDeIngreso,
} from '../../features/auth/login-flow'

describe('RQ2 — Login', () => {
  describe('getUserTypeLabel / getRoleLabel / getRoleDescription', () => {
    it.each([
      ['student', 'Estudiante'],
      ['teacher', 'Docente'],
      ['coordinator', 'Coordinador'],
      ['decano', 'Decano'],
      ['admin', 'Administrador'],
    ] as const)('getUserTypeLabel("%s") es "%s"', (tipo, etiqueta) => {
      expect(getUserTypeLabel(tipo)).toBe(etiqueta)
    })

    it.each([
      ['estudiante', 'Estudiante'],
      ['profesor', 'Docente'],
      ['docente', 'Docente'],
      ['coordinador', 'Coordinador'],
      ['admin', 'Administrador'],
    ] as const)('getRoleLabel("%s") es "%s"', (rol, etiqueta) => {
      expect(getRoleLabel(rol)).toBe(etiqueta)
    })

    it('getRoleLabel devuelve el mismo valor si el rol no es reconocido', () => {
      expect(getRoleLabel('visitante')).toBe('visitante')
    })

    it('getRoleDescription describe el acceso otorgado por cada rol', () => {
      expect(getRoleDescription('profesor')).toBe('Acceso al dashboard de docentes')
      expect(getRoleDescription('coordinador')).toBe('Acceso al dashboard de coordinadores')
      expect(getRoleDescription('estudiante')).toBe('Acceso al dashboard de estudiantes')
      expect(getRoleDescription('admin')).toBe('Acceso administrativo')
    })
  })

  describe('rolesDeLaRespuesta', () => {
    it('prioriza available_roles si el backend los envía', () => {
      const respuesta = {
        available_roles: ['coordinador', 'profesor'],
        user: { roles: ['estudiante'], tipo_usuario: 'estudiante' },
      }
      expect(rolesDeLaRespuesta(respuesta)).toEqual(['coordinador', 'profesor'])
    })

    it('cae a user.roles si no hay available_roles', () => {
      const respuesta = { user: { roles: ['profesor', 'coordinador'] } }
      expect(rolesDeLaRespuesta(respuesta)).toEqual(['profesor', 'coordinador'])
    })

    it('cae a [user.tipo_usuario] si no hay roles en absoluto', () => {
      const respuesta = { user: { tipo_usuario: 'estudiante' } }
      expect(rolesDeLaRespuesta(respuesta)).toEqual(['estudiante'])
    })

    it('devuelve un arreglo vacío si no hay ninguna fuente de rol', () => {
      expect(rolesDeLaRespuesta({ user: {} })).toEqual([])
    })
  })

  describe('resolverRolDeIngreso — mapea el tipo elegido en el form a un rol de backend', () => {
    it('resuelve "student" a "estudiante" cuando ese rol está disponible', () => {
      expect(resolverRolDeIngreso('student', ['estudiante'])).toBe('estudiante')
    })

    it('resuelve "teacher" a "profesor" o "docente", el que esté disponible', () => {
      expect(resolverRolDeIngreso('teacher', ['docente'])).toBe('docente')
      expect(resolverRolDeIngreso('teacher', ['profesor'])).toBe('profesor')
    })

    it('devuelve null si el tipo elegido no tiene ningún rol disponible que le corresponda', () => {
      expect(resolverRolDeIngreso('coordinator', ['estudiante', 'profesor'])).toBeNull()
    })

    it('devuelve null ante un tipo de cuenta desconocido', () => {
      expect(resolverRolDeIngreso('visitante', ['estudiante'])).toBeNull()
    })
  })
})

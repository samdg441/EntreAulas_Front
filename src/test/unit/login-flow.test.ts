import { describe, it, expect } from 'vitest'
import { getUserTypeLabel, getRoleLabel, getRoleDescription } from '../../features/auth/login-flow'

describe('features/auth/login-flow — getUserTypeLabel', () => {
  it.each([
    ['student', 'Estudiante'],
    ['teacher', 'Docente'],
    ['coordinator', 'Coordinador'],
    ['decano', 'Decano'],
    ['admin', 'Administrador'],
  ] as const)('%s → %s', (type, label) => {
    expect(getUserTypeLabel(type)).toBe(label)
  })
})

describe('features/auth/login-flow — getRoleLabel', () => {
  it.each([
    ['estudiante', 'Estudiante'],
    ['profesor', 'Docente'],
    ['docente', 'Docente'],
    ['coordinador', 'Coordinador'],
    ['admin', 'Administrador'],
    ['decano', 'decano'],
  ])('%s → %s', (role, label) => {
    expect(getRoleLabel(role)).toBe(label)
  })
})

describe('features/auth/login-flow — getRoleDescription', () => {
  it.each([
    ['profesor', /docentes/i],
    ['docente', /docentes/i],
    ['coordinador', /coordinadores/i],
    ['estudiante', /estudiantes/i],
    ['admin', /administrativo/i],
  ])('%s → %s', (role, expected) => {
    expect(getRoleDescription(role)).toMatch(expected)
  })
})

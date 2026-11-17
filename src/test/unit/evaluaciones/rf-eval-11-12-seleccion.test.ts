import { describe, expect, it } from 'vitest'
import type { Course, Teacher } from '../../../types'
import {
  estadoDocente,
  filtrarDocentes,
  puedeContinuar,
  puedeElegirCurso,
  puedeElegirDocente,
} from '../../../features/evaluations/seleccion-encuesta'

/**
 * RF-EVAL-11, RF-EVAL-12 y RF-ACA-27.
 * Dado / Cuando / Entonces y AAA.
 * Escrito antes del módulo: el rojo es que el archivo aún no existe.
 */

function materia(parcial: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'Bases de datos',
    code: 'BD-101',
    schedule: 'L',
    ...parcial,
  }
}

function docente(courses: Course[], parcial: Partial<Teacher> = {}): Teacher {
  return {
    id: '7',
    name: 'Ana Ruiz',
    department: 'Sistemas',
    email: 'ana@udem.edu.co',
    courses,
    ...parcial,
  }
}

describe('RF-EVAL — Elegir la encuesta a responder', () => {
  it('RF-EVAL-11: un docente con una materia pendiente se puede elegir', () => {
    // Dado un docente con una materia sin responder
    // Arrange
    const ana = docente([materia()])

    // Cuando se consulta si el estudiante puede elegirlo
    // Act
    const estado = estadoDocente(ana)

    // Entonces no está respondido ni bloqueado
    // Assert
    expect(estado).toBeNull()
    expect(puedeElegirDocente(ana)).toBe(true)
  })

  it('RF-EVAL-11: si todas las materias ya se evaluaron, el docente queda respondido', () => {
    // Dado que cada materia ya tiene evaluación
    // Arrange
    const ana = docente([materia({ evaluada: true })])

    // Cuando se consulta el estado
    // Act
    const estado = estadoDocente(ana)

    // Entonces no se puede volver a elegir
    // Assert
    expect(estado).toBe('respondida')
    expect(puedeElegirDocente(ana)).toBe(false)
  })

  it('RF-EVAL-11: si cada materia está bloqueada o ya evaluada, el docente queda bloqueado', () => {
    // Dado una materia bloqueada y otra ya evaluada
    // Arrange
    const ana = docente([materia({ bloqueada: true }), materia({ id: 'c2', evaluada: true })])

    // Cuando se consulta el estado
    // Act
    const estado = estadoDocente(ana)

    // Entonces el docente no se ofrece para una encuesta nueva
    // Assert
    expect(estado).toBe('bloqueado')
    expect(puedeElegirDocente(ana)).toBe(false)
  })

  it('RF-EVAL-12: una materia evaluada o bloqueada no se elige', () => {
    // Dado tres materias en distinto estado
    // Arrange
    const pendiente = materia()
    const hecha = materia({ id: 'c2', evaluada: true })
    const cerrada = materia({ id: 'c3', bloqueada: true })

    // Cuando se pregunta cuáles se pueden elegir
    // Act
    const elegibles = [pendiente, hecha, cerrada].filter(puedeElegirCurso)

    // Entonces solo queda la pendiente
    // Assert
    expect(elegibles).toEqual([pendiente])
  })

  it('RF-EVAL-12: continuar exige docente, materia y grupo sin responder', () => {
    // Dado la selección incompleta o un grupo ya evaluado
    // Arrange
    const ana = docente([materia()])
    const curso = materia()
    const grupo = { id: 'g1', evaluada: false }

    // Cuando se valida el paso
    // Act
    const incompleto = puedeContinuar(ana, curso, null)
    const listo = puedeContinuar(ana, curso, grupo)
    const repetido = puedeContinuar(ana, curso, { ...grupo, evaluada: true })

    // Entonces solo la selección completa y sin respuesta sigue
    // Assert
    expect(incompleto).toBe(false)
    expect(listo).toBe(true)
    expect(repetido).toBe(false)
  })

  it('RF-ACA-27: el buscador deja las materias del estudiante que coinciden', () => {
    // Dado dos docentes matriculados
    // Arrange
    const ana = docente([materia()])
    const luis = docente([materia({ id: 'c9', name: 'Cálculo', code: 'MAT-2' })], {
      id: '8',
      name: 'Luis Gómez',
      department: 'Básica',
    })

    // Cuando se busca por código de materia
    // Act
    const hallados = filtrarDocentes([ana, luis], 'bd-101')

    // Entonces solo aparece quien dicta esa materia
    // Assert
    expect(hallados).toEqual([ana])
    expect(filtrarDocentes([ana, luis], '')).toEqual([ana, luis])
  })
})

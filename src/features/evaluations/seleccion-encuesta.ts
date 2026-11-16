import type { Course, Teacher } from '../../types'

export function cursoEvaluado(course: Course) {
  if (course.evaluada) return true
  const groups = course.groups || []
  return groups.length > 0 && groups.every((group) => group.evaluada)
}

export function docenteEvaluado(teacher: Teacher) {
  return teacher.courses.length > 0 && teacher.courses.every(cursoEvaluado)
}

export function estadoDocente(teacher: Teacher): 'respondida' | 'bloqueado' | null {
  if (teacher.courses.length === 0) return null
  if (docenteEvaluado(teacher)) return 'respondida'
  if (teacher.courses.every((course) => course.bloqueada || cursoEvaluado(course))) return 'bloqueado'
  return null
}

export function puedeElegirDocente(teacher: Teacher) {
  return estadoDocente(teacher) === null
}

export function puedeElegirCurso(course: Course) {
  return !cursoEvaluado(course) && !course.bloqueada
}

export function puedeContinuar(
  teacher: Teacher | null,
  course: Course | null,
  group: { evaluada?: boolean } | null
) {
  if (group?.evaluada || (course && cursoEvaluado(course))) return false
  return Boolean(teacher && course && group)
}

export function filtrarDocentes(teachers: Teacher[], searchTerm: string) {
  if (!searchTerm) return teachers
  const consulta = searchTerm.toLowerCase()
  return teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(consulta) ||
      teacher.department.toLowerCase().includes(consulta) ||
      teacher.courses.some(
        (course) =>
          course.name.toLowerCase().includes(consulta) ||
          course.code.toLowerCase().includes(consulta)
      )
  )
}

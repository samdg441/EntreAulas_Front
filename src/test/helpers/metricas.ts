export function calcularPromedio(calificaciones: number[]): number {
  if (calificaciones.length === 0) return 0
  return calificaciones.reduce((suma, n) => suma + n, 0) / calificaciones.length
}

export function rangoFechasPeriodo(period: string): { start: string; end: string } {
  const [year, semester] = String(period).split('-')
  return {
    start: `${year}-${semester === '1' ? '01' : '07'}-01`,
    end: `${year}-${semester === '1' ? '06-30' : '12-31'}`,
  }
}

export function resumenMetricasProfesor(evaluaciones: Array<{ calificacion_promedio: number }>): {
  calificacionPromedio: number
  totalEvaluaciones: number
} {
  return {
    calificacionPromedio: calcularPromedio(evaluaciones.map((e) => e.calificacion_promedio)),
    totalEvaluaciones: evaluaciones.length,
  }
}

export function filtrarDocentes(
  docentes: Array<{ nombre: string; email: string; promedio: number }>,
  search: string
) {
  const q = search.trim().toLowerCase()
  if (!q) return docentes
  return docentes.filter((d) => `${d.nombre} ${d.email}`.toLowerCase().includes(q))
}

export function statsVaciasCoordinador() {
  return {
    totalProfesores: 0,
    totalCursos: 0,
    promedioEvaluaciones: 0,
    profesoresEnRiesgo: 0,
    totalEvaluaciones: 0,
  }
}

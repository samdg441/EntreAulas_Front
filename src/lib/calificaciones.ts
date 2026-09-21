export function calificacionEnEscala(calificacion: unknown): number | null {
  const cal = Number(calificacion)
  if (!Number.isFinite(cal) || cal < 1 || cal > 5) return null
  return cal
}

export function calcularPromedio(calificaciones: Array<number | null | undefined>): number {
  const lista = calificaciones
    .map(calificacionEnEscala)
    .filter((n): n is number => n != null)
  if (lista.length === 0) return 0
  return lista.reduce((suma, n) => suma + n, 0) / lista.length
}

export function esPeriodoValido(period: string): boolean {
  return /^\d{4}-[12]$/.test(String(period).trim())
}

export function rangoFechasPeriodo(period: string): { start: string; end: string } | null {
  if (!esPeriodoValido(period)) return null
  const [year, semester] = String(period).split('-')
  return {
    start: `${year}-${semester === '1' ? '01' : '07'}-01`,
    end: `${year}-${semester === '1' ? '06-30' : '12-31'}`,
  }
}

export function resumenMetricasProfesor(
  evaluaciones: Array<{ calificacion_promedio?: number | null }>
): { calificacionPromedio: number; totalEvaluaciones: number } {
  const validas = evaluaciones.filter((e) => calificacionEnEscala(e.calificacion_promedio) != null)
  return {
    calificacionPromedio: validas.length === 0 ? 0 : calcularPromedio(validas.map((e) => e.calificacion_promedio)),
    totalEvaluaciones: validas.length,
  }
}

export function promedioVisible(valor: unknown): number {
  return calificacionEnEscala(valor) ?? 0
}

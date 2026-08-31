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

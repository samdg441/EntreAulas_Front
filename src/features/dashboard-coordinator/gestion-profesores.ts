/** Lógica pura de la pantalla de gestión de profesores: clasificar, filtrar y ordenar. */

export const UMBRAL_RIESGO = 4

export interface DocenteResumen {
  id: number | string
  nombre: string
  email: string
  promedio: number
  totalEvaluaciones: number
}

export type EstadoDocente = 'riesgo' | 'ok' | 'sinDatos'
export type FiltroDocentes = 'todos' | EstadoDocente
export type OrdenDocentes = 'nombre' | 'promedioAsc' | 'promedioDesc' | 'evaluaciones'

export function estadoDelDocente(d: Pick<DocenteResumen, 'promedio' | 'totalEvaluaciones'>): EstadoDocente {
  if (!d.totalEvaluaciones || d.totalEvaluaciones <= 0) return 'sinDatos'
  return d.promedio < UMBRAL_RIESGO ? 'riesgo' : 'ok'
}

export function contarPorEstado(docentes: DocenteResumen[]): Record<FiltroDocentes, number> {
  const cuenta: Record<FiltroDocentes, number> = { todos: docentes.length, riesgo: 0, ok: 0, sinDatos: 0 }
  for (const d of docentes) cuenta[estadoDelDocente(d)] += 1
  return cuenta
}

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function filtrarYOrdenar(
  docentes: DocenteResumen[],
  opciones: { busqueda: string; filtro: FiltroDocentes; orden: OrdenDocentes }
): DocenteResumen[] {
  const q = sinTildes(opciones.busqueda.trim())
  const lista = docentes.filter(
    (d) =>
      (opciones.filtro === 'todos' || estadoDelDocente(d) === opciones.filtro) &&
      (!q || sinTildes(`${d.nombre} ${d.email}`).includes(q))
  )
  // Los que no tienen evaluaciones van al final al ordenar por promedio: su 0 no es un promedio real.
  const conPromedio = (d: DocenteResumen) => (d.totalEvaluaciones > 0 ? d.promedio : Number.NaN)
  const porPromedio = (a: DocenteResumen, b: DocenteResumen, signo: 1 | -1) => {
    const [x, y] = [conPromedio(a), conPromedio(b)]
    if (Number.isNaN(x) || Number.isNaN(y)) return Number.isNaN(x) === Number.isNaN(y) ? 0 : Number.isNaN(x) ? 1 : -1
    return (x - y) * signo
  }
  const comparadores: Record<OrdenDocentes, (a: DocenteResumen, b: DocenteResumen) => number> = {
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
    promedioAsc: (a, b) => porPromedio(a, b, 1),
    promedioDesc: (a, b) => porPromedio(a, b, -1),
    evaluaciones: (a, b) => b.totalEvaluaciones - a.totalEvaluaciones,
  }
  return [...lista].sort(comparadores[opciones.orden])
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

/** Porcentaje (0–100) que ocupa un promedio de 1 a 5 en una barra. */
export function porcentajeEscala(promedio: number): number {
  if (!Number.isFinite(promedio) || promedio <= 1) return 0
  return Math.min(100, ((promedio - 1) / 4) * 100)
}

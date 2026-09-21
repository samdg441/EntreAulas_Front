export function normalizeUserType(
  tipo: string | undefined
): 'student' | 'teacher' | 'coordinator' | 'decano' {
  const t = (tipo || '').toLowerCase()
  if (t === 'estudiante') return 'student'
  if (t === 'profesor' || t === 'docente') return 'teacher'
  if (t === 'coordinador') return 'coordinator'
  if (t === 'admin') return 'decano'
  return 'student'
}

export const STATS_CERO = {
  evaluacionesCompletadas: 0,
  evaluacionesPendientes: 0,
  materiasMatriculadas: 0,
  promedioGeneral: 0,
  progresoGeneral: 0,
}

export const TITULOS_TARJETAS_ESTUDIANTE = {
  pendientes: 'Evaluaciones Pendientes',
  completadas: 'Evaluaciones Completadas',
  piePendientes: 'Deben completarse pronto',
  pieCompletadas: 'Este período académico',
}

export function decidirMontajeDashboard(authUser: unknown): 'login' | 'dashboard' {
  return authUser ? 'dashboard' : 'login'
}

export function decidirCargaStatsEstudiante(params: {
  haySesion: boolean
  tipoUsuario?: string
  type?: string
  statsOk?: boolean
}): 'login' | 'no-cargar' | 'ceros' | 'pintar' {
  if (!params.haySesion) return 'login'
  const type = params.type ?? normalizeUserType(params.tipoUsuario)
  if (type !== 'student') return 'no-cargar'
  if (!params.statsOk) return 'ceros'
  return 'pintar'
}

export function statsTrasErrorApi() {
  return { ...STATS_CERO }
}

export function statsDesdeApi(
  data: {
    evaluacionesCompletadas?: number | string | null
    evaluacionesPendientes?: number | string | null
    materiasMatriculadas?: number | string | null
    promedioGeneral?: number | string | null
    progresoGeneral?: number | string | null
  } | null
) {
  return {
    evaluacionesCompletadas: Number(data?.evaluacionesCompletadas ?? 0),
    evaluacionesPendientes: Number(data?.evaluacionesPendientes ?? 0),
    materiasMatriculadas: Number(data?.materiasMatriculadas ?? 0),
    promedioGeneral: Number(data?.promedioGeneral ?? 0),
    progresoGeneral: Number(data?.progresoGeneral ?? 0),
  }
}

export function statsAVistaEstudiante(stats: typeof STATS_CERO) {
  return {
    evaluationsPending: stats.evaluacionesPendientes,
    evaluationsCompleted: stats.evaluacionesCompletadas,
    currentCourses: stats.materiasMatriculadas,
    averageGrade: stats.promedioGeneral,
  }
}

export function tarjetasEstudiante(stats: typeof STATS_CERO) {
  const vista = statsAVistaEstudiante(stats)
  return {
    pendientes: {
      titulo: TITULOS_TARJETAS_ESTUDIANTE.pendientes,
      valor: vista.evaluationsPending,
      pie: TITULOS_TARJETAS_ESTUDIANTE.piePendientes,
    },
    completadas: {
      titulo: TITULOS_TARJETAS_ESTUDIANTE.completadas,
      valor: vista.evaluationsCompleted,
      pie: TITULOS_TARJETAS_ESTUDIANTE.pieCompletadas,
    },
  }
}

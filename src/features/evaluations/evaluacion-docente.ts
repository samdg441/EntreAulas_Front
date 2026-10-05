export const MENSAJE_GOODBYE =
  'Tu encuesta fue enviada correctamente. Tu opinión ayuda a mejorar la calidad académica.'

export const ALERTA_FALTAN_DATOS = 'Error: Faltan datos del profesor o curso'
export const ALERTA_ERROR_GENERICO = 'Error guardando la evaluación'

export function decidirMontajeFormulario(authUser: unknown): 'login' | 'formulario' {
  return authUser ? 'formulario' : 'login'
}

type IdOpcional = string | number | null
type EntidadConId = { id?: IdOpcional } | null

export function hayProfesorYCurso(state: {
  teacher?: EntidadConId
  course?: EntidadConId
}): boolean {
  return Boolean(state.teacher?.id && state.course?.id)
}

export function armarPayloadEvaluacion(params: {
  teacher: { id: string | number }
  course: { id: string | number }
  group?: { id: string | number } | null
  comments?: string
  questions: Array<{ id: string; type: string }>
  ratings: Array<number | null | undefined>
  textAnswers: Array<string | undefined>
}) {
  const answers = params.questions.map((q, idx) => {
    if (q.type === 'rating') {
      return { questionId: Number.parseInt(q.id, 10), rating: params.ratings[idx] ?? null, textAnswer: null }
    }
    return {
      questionId: Number.parseInt(q.id, 10),
      rating: null,
      textAnswer: params.textAnswers[idx],
    }
  })

  const ratingQuestions = params.questions.filter((q) => q.type === 'rating')
  const ratingAnswers = answers.filter((a) => a.rating !== null)
  const total = ratingAnswers.reduce((acc, a) => acc + (a.rating || 0), 0)
  const overallRating =
    ratingQuestions.length > 0 ? Number((total / ratingQuestions.length).toFixed(2)) : 0

  return {
    teacherId: String(params.teacher.id),
    courseId: String(params.course.id),
    groupId: params.group ? String(params.group.id) : undefined,
    comments: params.comments,
    answers,
    overallRating,
  }
}

/** Números (desde 1) de las preguntas de calificación que siguen sin responder. */
export function preguntasSinCalificar(
  questions: Array<{ type: string }>,
  ratings: Array<number | null | undefined>
): number[] {
  return questions.flatMap((q, idx) => (q.type === 'rating' && !((ratings[idx] ?? 0) > 0) ? [idx + 1] : []))
}

export function avisoPreguntasSinCalificar(numeros: number[]): string {
  if (numeros.length === 0) return ''
  if (numeros.length === 1) return `Te falta calificar la pregunta ${numeros[0]}.`
  return `Te falta calificar las preguntas ${numeros.slice(0, -1).join(', ')} y ${numeros.at(-1)}.`
}

function preguntasConCalificacionInvalida(details: Array<{ field: string }>): number[] {
  const numeros = details.flatMap((d) => {
    const m = /^answers\.(\d+)\.rating$/.exec(d.field)
    return m ? [Number(m[1]) + 1] : []
  })
  return [...new Set(numeros)].sort((a, b) => a - b)
}

export function mensajeErrorEnvio(error: {
  response?: { data?: { error?: string; details?: Array<{ field: string; message: string }> } }
  message?: string
} | null): string {
  const data = error?.response?.data
  if (data?.error) {
    const sinCalificar = preguntasConCalificacionInvalida(Array.isArray(data.details) ? data.details : [])
    return sinCalificar.length ? avisoPreguntasSinCalificar(sinCalificar) : data.error
  }
  return error?.message || ALERTA_ERROR_GENERICO
}

export function decidirEnvioFormulario(params: {
  haySesion: boolean
  confirma?: boolean
  teacher?: { id?: string | number | null } | null
  course?: { id?: string | number | null } | null
  envioOk?: boolean
}): 'login' | 'cancelar' | 'faltan-datos' | 'alerta-error' | 'goodbye' {
  if (!params.haySesion) return 'login'
  if (!params.confirma) return 'cancelar'
  if (!hayProfesorYCurso({ teacher: params.teacher, course: params.course })) return 'faltan-datos'
  if (!params.envioOk) return 'alerta-error'
  return 'goodbye'
}

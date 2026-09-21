export const MENSAJE_GOODBYE =
  'Tu encuesta fue enviada correctamente. Tu opinión ayuda a mejorar la calidad académica.'

export const ALERTA_FALTAN_DATOS = 'Error: Faltan datos del profesor o curso'
export const ALERTA_ERROR_GENERICO = 'Error guardando la evaluación'

export function decidirMontajeFormulario(authUser: unknown): 'login' | 'formulario' {
  return authUser ? 'formulario' : 'login'
}

export function hayProfesorYCurso(state: {
  teacher?: { id?: string | number | null } | null
  course?: { id?: string | number | null } | null
}): boolean {
  return Boolean(state.teacher?.id && state.course?.id)
}

export function armarPayloadEvaluacion(params: {
  teacher: { id: string | number }
  course: { id: string | number }
  group?: { id: string | number } | null
  comments?: string
  questions: Array<{ id: string; type: 'rating' | 'text' }>
  ratings: Array<number | null | undefined>
  textAnswers: Array<string | undefined>
}) {
  const answers = params.questions.map((q, idx) => {
    if (q.type === 'rating') {
      return { questionId: parseInt(q.id, 10), rating: params.ratings[idx] ?? null, textAnswer: null }
    }
    return {
      questionId: parseInt(q.id, 10),
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

export function mensajeErrorEnvio(error: {
  response?: { data?: { error?: string; details?: Array<{ field: string; message: string }> } }
  message?: string
} | null): string {
  let errorMessage = ALERTA_ERROR_GENERICO
  if (error?.response?.data?.error) {
    errorMessage = error.response.data.error
    if (error.response.data.details && Array.isArray(error.response.data.details)) {
      const validationErrors = error.response.data.details
        .map((detail) => `${detail.field}: ${detail.message}`)
        .join('\n')
      errorMessage += '\n\nDetalles:\n' + validationErrors
    }
  } else if (error?.message) {
    errorMessage = error.message
  }
  return errorMessage
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

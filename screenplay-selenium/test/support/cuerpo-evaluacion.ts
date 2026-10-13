export const cuerpoEvaluacion = {
  teacherId: '7',
  courseId: '10',
  groupId: '3',
  answers: [{ questionId: 1, rating: 4, textAnswer: 'claridad' }],
  overallRating: 4,
  comments: 'Buen curso',
}

export const cuerpoEvaluacionInvalido = {
  ...cuerpoEvaluacion,
  teacherId: '7; DROP TABLE evaluaciones',
}

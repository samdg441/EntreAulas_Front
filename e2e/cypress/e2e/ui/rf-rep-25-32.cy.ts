/**
 * RF-REP-25 resultados crudos, RF-REP-26 métricas individuales y RF-IA-32 resúmenes.
 * Mismo estilo que rq10-rq31.cy.ts: el back se simula con cy.intercept.
 * Cada requisito tiene un camino exitoso, uno alternativo y uno de error.
 */
export {}

const PEDRO = {
  id: 'u-pedro',
  nombre: 'Pedro',
  apellido: 'Docente',
  email: 'pedro.docente@udemedellin.edu.co',
  tipo_usuario: 'teacher',
  roles: ['profesor'],
}
const CARLOS = {
  id: 'u-carlos',
  nombre: 'Carlos',
  apellido: 'Coordinador',
  email: 'carlos.coordinador@udemedellin.edu.co',
  tipo_usuario: 'coordinador',
  roles: ['coordinador'],
}
const DORA = {
  id: 'u-dora',
  nombre: 'Dora',
  apellido: 'Decano',
  email: 'dora.decano@udemedellin.edu.co',
  tipo_usuario: 'decano',
  roles: ['decano'],
}
const EVA = {
  id: 'u-eva',
  nombre: 'Eva',
  apellido: 'Estudiante',
  email: 'eva.estudiante@soyudemedellin.edu.co',
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
}

function tarjeta(titulo: string, valor: string) {
  cy.contains(titulo).parents('[class*="bg-white"]').first().should('contain', valor)
}

function abrirDashboard(stats: Record<string, unknown>) {
  cy.simularBackVacio()
  cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' }).as('teacherId')
  cy.intercept('GET', '**/api/teachers/teacher-courses/**', [])
  cy.intercept('GET', '**/api/teachers/teacher-stats/**', stats).as('stats')
  cy.visitarConSesion('/dashboard-profesor', PEDRO)
  cy.wait('@stats')
}

function abrirReportes(usuario: Record<string, unknown>, resumen: Record<string, unknown> | ((req: { reply: (status: number, body: unknown) => void }) => void)) {
  cy.simularBackVacio()
  cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
  cy.intercept('GET', '**/api/teachers/**/stats/historical*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
  cy.intercept('GET', '**/api/teachers/period-stats*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
  cy.intercept('GET', '**/api/coordinador/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
  cy.intercept('GET', '**/api/decano/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
  cy.intercept('GET', '**/api/teachers/career-subjects', { carreras: [] })
  if (typeof resumen === 'function') {
    cy.intercept('GET', '**/api/ai/summarize/**', resumen).as('resumen')
  } else {
    cy.intercept('GET', '**/api/ai/summarize/**', resumen).as('resumen')
  }
  cy.visitarConSesion('/reports', usuario)
}

describe('RF-REP-25 — Consulta de resultados crudos', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/resultados*').as('consulta')
  })

  it('sin curso, profesor o grupo muestra el error de parámetros', () => {
    cy.visitarConSesion('/reports/survey-results', PEDRO)
    cy.contains('Faltan parámetros requeridos').should('be.visible')
    cy.contains('button', 'Volver').should('be.visible')
    cy.get('@consulta.all').should('have.length', 0)
  })

  it('con los tres datos de la URL avisa que todavía no hay un resultado real', () => {
    cy.visitarConSesion('/reports/survey-results?courseId=1&professorId=7&groupId=4', PEDRO)
    cy.contains('Aún no hay un resultado real para esta encuesta. Los gráficos solo se muestran con respuestas registradas.').should('be.visible')
    cy.contains('Calificación Promedio').should('not.exist')
    cy.get('@consulta.all').should('have.length', 0)
  })

  it('un estudiante no entra a la pantalla', () => {
    cy.visitarConSesion('/reports/survey-results', EVA)
    cy.location('pathname').should('eq', '/forbidden')
  })
})

describe('RF-REP-26 — Métricas individuales del profesor', () => {
  it('con notas en escala muestra el promedio y el total', () => {
    abrirDashboard({ calificacionPromedio: 4, totalEvaluaciones: 3, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
    tarjeta('Calificación Promedio', '4/5.0')
    tarjeta('Total Evaluaciones', '3')
  })

  it('sin evaluaciones muestra 0 y el estado vacío', () => {
    abrirDashboard({ calificacionPromedio: 0, totalEvaluaciones: 0, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
    tarjeta('Calificación Promedio', '0.0/5.0')
    tarjeta('Total Evaluaciones', '0')
    cy.contains('Sin datos: aún no se registran respuestas de estudiantes en el periodo activo.').should('be.visible')
  })

  it('una nota 99 no se pinta: la tarjeta queda en 0.0/5.0', () => {
    abrirDashboard({ calificacionPromedio: 99, totalEvaluaciones: 1, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
    tarjeta('Calificación Promedio', '0.0/5.0')
    cy.contains('99/5.0').should('not.exist')
  })

  it('si el back no responde, la pantalla muestra el error y no cifras inventadas', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { statusCode: 500, body: { error: 'Error interno del servidor' } }).as('teacherId')
    cy.visitarConSesion('/dashboard-profesor', PEDRO)
    cy.wait('@teacherId')
    cy.contains('Error al cargar las evaluaciones').should('be.visible')
    tarjeta('Calificación Promedio', '0.0/5.0')
  })
})

describe('RF-IA-32 — Resúmenes agregados', () => {
  it('el profesor genera el resumen de sus comentarios', () => {
    abrirReportes(PEDRO, {
      summary: 'Los estudiantes destacan la claridad.',
      topics: ['claridad'],
      textsCount: 2,
      analysisSource: 'open_text',
    })
    cy.contains('Resumen IA (Mis cursos)').should('be.visible')
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen').its('request.url').should('include', '/api/ai/summarize/by-professor')
    cy.contains('Los estudiantes destacan la claridad.').should('be.visible')
    cy.contains('claridad').should('be.visible')
    cy.contains('Analizadas 2 respuestas abiertas').should('be.visible')
  })

  it('sin comentarios y con notas, el resumen sale de las respuestas cuantitativas', () => {
    abrirReportes(PEDRO, {
      textsCount: 0,
      ratingsCount: 2,
      analysisSource: 'quantitative_fallback',
      summary: 'Resumen construido con las notas del periodo.',
      topics: ['promedio 4.00/5'],
    })
    cy.contains('button', 'Generar resumen IA').click()
    cy.contains('Resumen cualitativo generado desde 2 respuestas cuantitativas').should('be.visible')
    cy.contains('Resumen construido con las notas del periodo.').should('be.visible')
  })

  it('sin comentarios ni notas muestra el aviso y no pinta temas', () => {
    abrirReportes(PEDRO, {
      textsCount: 0,
      summary: 'No se encontraron respuestas abiertas para este profesor en el período seleccionado.',
      topics: [],
    })
    cy.contains('button', 'Generar resumen IA').click()
    cy.contains('No se encontraron respuestas abiertas').should('be.visible')
    cy.contains('Analizadas').should('not.exist')
  })

  it('el coordinador pide el resumen de su carrera y el decano el de su facultad', () => {
    abrirReportes(CARLOS, { summary: 'Resumen de la carrera.', topics: ['metodologia'], textsCount: 1, analysisSource: 'open_text' })
    cy.contains('Resumen IA (Mi Carrera)').should('be.visible')
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen').its('request.url').should('include', '/api/ai/summarize/by-career')
    cy.contains('Resumen de la carrera.').should('be.visible')

    abrirReportes(DORA, { summary: 'Resumen de la facultad.', topics: ['practicas'], textsCount: 1, analysisSource: 'open_text' })
    cy.contains('Resumen IA (facultad)').should('be.visible')
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen').its('request.url').should('include', '/api/ai/summarize/by-faculty')
    cy.contains('Resumen de la facultad.').should('be.visible')
  })

  it('un error del servicio se muestra en la tarjeta y no redirige', () => {
    abrirReportes(PEDRO, (req) => {
      req.reply(500, { error: 'Error interno del servidor' })
    })
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen')
    cy.contains('Error interno del servidor').should('be.visible')
    cy.location('pathname').should('eq', '/reports')
  })

  it('una sesión rechazada con 401 regresa al login', () => {
    abrirReportes(PEDRO, (req) => {
      req.reply(401, { error: 'Token de acceso requerido', code: 'NO_TOKEN' })
    })
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen')
    cy.location('pathname').should('eq', '/login')
  })

  it('un estudiante no abre los reportes', () => {
    cy.simularBackVacio()
    cy.visitarConSesion('/reports', EVA)
    cy.location('pathname').should('eq', '/forbidden')
  })
})

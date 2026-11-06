/**
 * Regresión de RF-REP-25, RF-REP-26 y RF-IA-32.
 * El camino que ya funcionaba sigue igual después de descartar la nota 99.
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
const EVA = {
  id: 'u-eva',
  nombre: 'Eva',
  apellido: 'Estudiante',
  email: 'eva.estudiante@soyudemedellin.edu.co',
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
}

describe('Regresión RF-REP-25, RF-REP-26 y RF-IA-32', () => {
  it('RF-REP-26: el promedio 4 sigue en la tarjeta', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
    cy.intercept('GET', '**/api/teachers/teacher-courses/**', [])
    cy.intercept('GET', '**/api/teachers/teacher-stats/**', {
      calificacionPromedio: 4,
      totalEvaluaciones: 3,
      evaluacionesPorCurso: [],
      evaluacionesPorGrupo: [],
    }).as('stats')

    cy.visitarConSesion('/dashboard-profesor', PEDRO)
    cy.wait('@stats')
    cy.contains('Calificación Promedio').parents('[class*="bg-white"]').first().should('contain', '4/5.0')
    cy.contains('99/5.0').should('not.exist')
  })

  it('Regresión RF-REP-26: una nota 99 no vuelve a pintarse encima del promedio válido', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
    cy.intercept('GET', '**/api/teachers/teacher-courses/**', [])
    cy.intercept('GET', '**/api/teachers/teacher-stats/**', {
      calificacionPromedio: 99,
      totalEvaluaciones: 1,
      evaluacionesPorCurso: [],
      evaluacionesPorGrupo: [],
    }).as('stats')

    cy.visitarConSesion('/dashboard-profesor', PEDRO)
    cy.wait('@stats')
    cy.contains('Calificación Promedio').parents('[class*="bg-white"]').first().should('contain', '0.0/5.0')
    cy.contains('99/5.0').should('not.exist')
    cy.contains('99').should('not.exist')
  })

  it('Regresión RF-REP-25: sin parámetros el aviso sigue y no aparece el gráfico', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/resultados*').as('consulta')
    cy.visitarConSesion('/reports/survey-results', PEDRO)

    cy.contains('Faltan parámetros requeridos').should('be.visible')
    cy.contains('Calificación Promedio').should('not.exist')
    cy.get('@consulta.all').should('have.length', 0)
  })

  it('Regresión RF-IA-32: generar el resumen deja el título y el botón en su sitio', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
    cy.intercept('GET', '**/api/teachers/**/stats/historical*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/teachers/period-stats*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/coordinador/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
    cy.intercept('GET', '**/api/teachers/career-subjects', { carreras: [] })
    cy.intercept('GET', '**/api/ai/summarize/**', {
      summary: 'Los estudiantes destacan la claridad.',
      topics: ['claridad'],
      textsCount: 2,
      analysisSource: 'open_text',
    }).as('resumen')

    cy.visitarConSesion('/reports', PEDRO)
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen')

    cy.contains('Resumen IA (Mis cursos)').should('be.visible')
    cy.contains('Los estudiantes destacan la claridad.').should('be.visible')
    cy.contains('button', 'Generar resumen IA').should('be.visible').and('not.be.disabled')
    cy.location('pathname').should('eq', '/reports')
  })

  it('Regresión de acceso: el estudiante sigue fuera del dashboard y de los reportes', () => {
    cy.simularBackVacio()
    cy.visitarConSesion('/dashboard-profesor', EVA)
    cy.location('pathname').should('eq', '/forbidden')

    cy.visitarConSesion('/reports', EVA)
    cy.location('pathname').should('eq', '/forbidden')
  })
})

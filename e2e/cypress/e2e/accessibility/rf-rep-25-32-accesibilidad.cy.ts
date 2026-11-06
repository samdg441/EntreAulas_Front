/**
 * RF-REP-25, RF-REP-26 y RF-IA-32 — Accesibilidad WCAG 2.1 A/AA con axe-core,
 * más teclado, foco, etiquetas, mensajes y adaptación de la pantalla.
 * Criterios: 1.3.1 Info y relaciones, 1.4.3 Contraste, 2.1.1 Teclado,
 * 2.4.6 Encabezados y etiquetas, 2.4.7 Foco visible, 3.3.1 Identificación
 * de errores, 4.1.2 Nombre, función, valor y 4.1.3 Mensajes de estado.
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

describe('RF-REP-25, RF-REP-26 y RF-IA-32 — Accesibilidad', () => {
  it('RF-REP-25: el aviso de parámetros tiene nombre, contraste y se anuncia', () => {
    cy.simularBackVacio()
    cy.visitarConSesion('/reports/survey-results', PEDRO)

    cy.get('#aviso-resultados').should('be.visible')
    cy.get('#aviso-resultados [role="alert"]').should('contain', 'Faltan parámetros requeridos')
    cy.contains('button', 'Volver').should('be.visible').and('not.have.attr', 'disabled')
    cy.contains('button', 'Volver').focus()
    cy.focused().should('contain', 'Volver')
    cy.revisarAccesibilidad('#aviso-resultados')
  })

  it('RF-REP-26: las métricas se leen en escritorio y en móvil, y el filtro tiene etiqueta', () => {
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

    cy.viewport(1280, 800)
    cy.get('#metricas-profesor').should('be.visible').and('contain', '4/5.0')
    cy.viewport(375, 800)
    cy.get('#metricas-profesor').should('be.visible').and('contain', '4/5.0')
    cy.viewport(1280, 800)

    cy.get('label[for="course-filter"]').should('contain', 'Filtrar por curso')
    cy.get('#course-filter').focus()
    cy.focused().should('have.id', 'course-filter')
    cy.revisarAccesibilidad('#metricas-profesor')
  })

  it('RF-REP-26: el error de carga se anuncia y no deja el foco atrapado', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { statusCode: 500, body: { error: 'Error interno del servidor' } }).as('teacherId')
    cy.visitarConSesion('/dashboard-profesor', PEDRO)
    cy.wait('@teacherId')

    cy.contains('Error al cargar las evaluaciones').closest('[role="alert"]').should('exist')
    cy.get('#course-filter').focus()
    cy.focused().should('have.id', 'course-filter')
    cy.focused().type('{downarrow}')
    cy.focused().should('have.id', 'course-filter')
  })

  it('RF-IA-32: el botón del resumen toma el foco y el error se anuncia', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
    cy.intercept('GET', '**/api/teachers/**/stats/historical*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/teachers/period-stats*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/coordinador/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
    cy.intercept('GET', '**/api/teachers/career-subjects', { carreras: [] })
    cy.intercept('GET', '**/api/ai/summarize/**', { statusCode: 500, body: { error: 'Error interno del servidor' } }).as('resumen')

    cy.visitarConSesion('/reports', PEDRO)
    cy.get('#resumen-ia').should('be.visible')
    cy.contains('button', 'Generar resumen IA').focus()
    cy.focused().should('contain', 'Generar resumen IA')
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen')
    cy.get('#resumen-ia [role="alert"]').should('contain', 'Error interno del servidor')
    cy.contains('Resumen IA (Mis cursos)').click()
    cy.revisarAccesibilidad('#resumen-ia')
  })

  it('RF-IA-32: el aviso de sin respuestas tiene estado y no tapa el botón', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
    cy.intercept('GET', '**/api/teachers/**/stats/historical*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/teachers/period-stats*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [] })
    cy.intercept('GET', '**/api/coordinador/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
    cy.intercept('GET', '**/api/teachers/career-subjects', { carreras: [] })
    cy.intercept('GET', '**/api/ai/summarize/**', {
      textsCount: 0,
      summary: 'No se encontraron respuestas abiertas para este profesor en el período seleccionado.',
      topics: [],
    }).as('resumen')

    cy.visitarConSesion('/reports', PEDRO)
    cy.contains('button', 'Generar resumen IA').click()
    cy.wait('@resumen')
    cy.get('#resumen-ia [role="status"]').should('contain', 'No se encontraron respuestas abiertas')
    cy.contains('button', 'Generar resumen IA').should('be.visible').and('not.be.disabled')
    cy.contains('Resumen IA (Mis cursos)').click()
    cy.revisarAccesibilidad('#resumen-ia')
  })
})

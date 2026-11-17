import { usuarios } from '../../support/commands'

/**
 * Punto 14 — Cypress Cloud + cy.prompt sobre las funcionalidades de Esteban Arias.
 *   Creación de encuestas (RF-ENC-32, RF-ENC-33) · Selección de la encuesta (RF-EVAL-11/12, RF-ACA-27) · Notificaciones (RF-NOT-34/35)
 *
 * cy.prompt convierte pasos en lenguaje natural en comandos de Cypress con IA (Cypress Cloud) y los
 * guarda en caché: si la pantalla cambia, los vuelve a generar (autorreparación). El back se simula con
 * cy.intercept, igual que en rf-enc-not-eval.cy.ts. Las aserciones de estado (qué recibió el back) son
 * comandos normales de Cypress: el veredicto final no depende solo de la IA.
 *
 * Requiere sesión en Cypress Cloud (cypress open → Log in) o correr con --record --key.
 *   npm run cy:prompt:esteban
 */
const DOCENCIA = { id: 1, nombre: 'Docencia', descripcion: '', orden: 1 }
const PREGUNTA = {
  id: 8,
  categoria_id: 1,
  texto_pregunta: 'El docente explica con claridad',
  tipo_pregunta: 'likert',
  obligatoria: true,
  orden: 1,
  activa: true,
  id_carrera: null,
}
const ANA = {
  id: '7',
  name: 'Ana Ruiz',
  department: 'Sistemas',
  email: 'ana@udem.edu.co',
  courses: [{ id: 'c1', name: 'Bases de datos', code: 'BD-101', schedule: 'Lunes 8:00' }],
}

function simularEncuestas() {
  cy.simularBackVacio()
  cy.intercept('GET', '**/api/users/academic-structure', { facultades: [] })
  cy.intercept('GET', '**/api/periodos/evaluacion', [])
  cy.intercept('GET', '**/api/evaluations/categories', { categories: [DOCENCIA] })
  cy.intercept('GET', '**/api/evaluations/questions', { success: true, data: [PREGUNTA] })
}

describe('cy.prompt — Creación de encuestas (RF-ENC-32, RF-ENC-33)', () => {
  it('RF-ENC-32: crea una encuesta nueva', () => {
    simularEncuestas()
    cy.intercept('POST', '**/api/evaluations/categories', {
      statusCode: 201,
      body: { category: { id: 3, nombre: 'Evaluación de cierre', orden: 2 } },
    }).as('crearEncuesta')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)

    cy.prompt([
      'click the "Crear encuesta" button',
      'type "Evaluación de cierre" in the "Nombre de la encuesta" field',
      'click the "Guardar encuesta" button',
      'verify the text "Encuesta agregada" is visible',
    ])

    cy.wait('@crearEncuesta').its('request.body.nombre').should('eq', 'Evaluación de cierre')
  })

  it('RF-ENC-33: corrige el texto de una pregunta', () => {
    simularEncuestas()
    cy.intercept('PUT', '**/api/evaluations/questions/8', {
      success: true,
      data: { ...PREGUNTA, texto_pregunta: 'El docente explica con ejemplos' },
    }).as('corregir')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)

    cy.prompt([
      'click the "Editar encuesta" button',
      'click the "Docencia" survey',
      'click the "Editar" button of the question "El docente explica con claridad"',
      // Con «field» y con «textbox» la IA eligió el <label>; se le da el id del <input> (ver docs/pruebas/14-IA.md).
      'clear the input with id "texto-de-la-pregunta"',
      'type "El docente explica con ejemplos" in the input with id "texto-de-la-pregunta"',
      'click the "Guardar cambios de la pregunta" button',
      'verify the text "Pregunta actualizada" is visible',
    ])

    cy.wait('@corregir').its('request.body').should('include', { texto_pregunta: 'El docente explica con ejemplos' })
  })

  it('RF-ENC-33: si el back rechaza la corrección, el mensaje aparece y el diálogo sigue abierto', () => {
    simularEncuestas()
    cy.intercept('PUT', '**/api/evaluations/questions/8', {
      statusCode: 404,
      body: { success: false, error: 'Pregunta no encontrada', message: 'La pregunta no existe.' },
    })
    cy.visitarConSesion('/admin/surveys', usuarios.admin)

    cy.prompt([
      'click the "Editar encuesta" button',
      'click the "Docencia" survey',
      'click the button named "Editar pregunta El docente explica con claridad"',
    ])
    // Limitación de cy.prompt: para este mismo paso generó cy.get('texto-de-la-pregunta') sin «#» y lo dejó en caché;
    // falló igual en 3 corridas seguidas sin regenerarse. El campo se edita con un comando normal de Cypress.
    cy.get('#texto-de-la-pregunta').clear().type('Otra redacción')
    cy.prompt([
      'click the "Guardar cambios de la pregunta" button',
      'verify the text "La pregunta no existe." is visible',
    ])

    cy.get('dialog[open]').should('be.visible')
  })
})

describe('cy.prompt — Selección de la encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/periodos/evaluacion', [])
    cy.intercept('GET', '**/api/teachers', [
      ANA,
      { id: '8', name: 'Luis Gómez', department: 'Básica', email: 'luis@udem.edu.co', courses: [{ id: 'c9', name: 'Cálculo', code: 'MAT-2', schedule: 'Martes' }] },
    ])
    cy.intercept('GET', '**/api/teachers/*/courses/*/groups', [{ id: 'g1', numero_grupo: '01' }])
  })

  it('RF-EVAL-11/12: elige docente, materia y grupo y llega al formulario', () => {
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.prompt([
      'click the teacher "Ana Ruiz"',
      'select "Bases de datos (BD-101)" in the course dropdown',
      'click "Grupo 01"',
      'click the "Continuar a Evaluación" button',
    ])

    cy.location('pathname').should('eq', '/evaluate/form')
  })

  it('RF-ACA-27: el buscador deja solo la materia que coincide', () => {
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.prompt([
      'type "MAT-2" in the search field "Buscar docente o materia..."',
      'verify the text "Luis Gómez" is visible',
      'verify the text "Ana Ruiz" does not exist',
    ])
  })
})

describe('cy.prompt — Notificaciones (RF-NOT-34, RF-NOT-35)', () => {
  it('la campana anuncia la ventana abierta y se puede marcar como leída', () => {
    cy.clock(new Date(2026, 10, 16, 9, 0, 0), ['Date'])
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers', [])
    cy.intercept('GET', '**/api/periodos/evaluacion', [
      { periodoId: 2, ano: 2026, semestre: 2, fechaInicio: '2026-11-01', fechaFin: '2026-11-30' },
    ])
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.prompt([
      'click the notifications bell button',
      'verify the text "Evaluación docente abierta" is visible',
      'verify the button "Evaluar ahora" is visible',
      'click the "Marcar todas como leídas" button',
    ])

    cy.get('button[aria-label="Notificaciones"]').should('exist')
  })
})

import { usuarios } from '../../support/commands'

/**
 * RF-ENC-32, RF-ENC-33, RF-EVAL-11, RF-EVAL-12, RF-ACA-27, RF-NOT-34 y RF-NOT-35.
 * El back se simula con cy.intercept.
 * Cada bloque tiene un camino exitoso, uno alternativo y uno de error.
 */

const DOCENCIA = { id: 1, nombre: 'Docencia', descripcion: '', orden: 1 }
const PREGUNTA = {
  id: 8,
  categoria_id: 1,
  texto_pregunta: 'El docente explica con claridad',
  tipo_pregunta: 'likert',
  obligatoria: false,
  orden: 1,
  activa: true,
}
const ANA = {
  id: '7',
  name: 'Ana Ruiz',
  department: 'Sistemas',
  email: 'ana@udem.edu.co',
  courses: [{ id: 'c1', name: 'Bases de datos', code: 'BD-101', schedule: 'Lunes 8:00' }],
}
const VENTANA_ABIERTA = [
  { periodoId: 2, ano: 2026, semestre: 2, fechaInicio: '2026-11-01', fechaFin: '2026-11-30' },
]

function prepararEncuestas(preguntas: unknown[] = []) {
  cy.simularBackVacio()
  cy.intercept('GET', '**/api/users/academic-structure', { facultades: [] })
  cy.intercept('GET', '**/api/evaluations/categories', { categories: [DOCENCIA] })
  cy.intercept('GET', '**/api/evaluations/questions', { success: true, data: preguntas })
  cy.intercept('GET', '**/api/periodos/evaluacion', [])
}

function abrirDocencia() {
  cy.contains('button', 'Editar encuesta').click()
  cy.contains('button', 'Docencia').click()
}

describe('RF-ENC-32 — Creación de la encuesta', () => {
  it('guarda una encuesta nueva y confirma', () => {
    prepararEncuestas()
    cy.intercept('POST', '**/api/evaluations/categories', {
      statusCode: 201,
      body: { category: { id: 3, nombre: 'Evaluación de cierre', orden: 2 } },
    }).as('crear')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)

    cy.contains('button', 'Crear encuesta').click()
    cy.contains('label', 'Nombre de la encuesta').parent().find('input').type('Evaluación de cierre')
    cy.contains('button', 'Guardar encuesta').click()

    cy.wait('@crear')
    cy.contains('Encuesta agregada').should('be.visible')
    cy.contains('Evaluación de cierre').should('be.visible')
  })

  it('agrega una pregunta a una encuesta ya creada', () => {
    prepararEncuestas()
    cy.intercept('POST', '**/api/evaluations/questions', { statusCode: 201, body: { success: true, data: { id: 9 } } }).as('pregunta')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()

    cy.contains('button', 'Agregar pregunta').click()
    cy.contains('label', 'Texto de la pregunta').parent().find('input').type('El docente llega a tiempo')
    cy.contains('button', 'Guardar pregunta').click()

    cy.wait('@pregunta').its('request.body.texto_pregunta').should('eq', 'El docente llega a tiempo')
    cy.contains('Pregunta agregada a la encuesta').should('be.visible')
  })

  it('no guarda la encuesta si el nombre está en blanco', () => {
    prepararEncuestas()
    cy.intercept('POST', '**/api/evaluations/categories', cy.spy().as('crear'))
    cy.visitarConSesion('/admin/surveys', usuarios.admin)

    cy.contains('button', 'Crear encuesta').click()
    cy.contains('label', 'Nombre de la encuesta').parent().find('input').type('   ')
    cy.contains('button', 'Guardar encuesta').click()

    cy.contains('Escribe el nombre de la encuesta').should('be.visible')
    cy.get('@crear').should('not.have.been.called')
  })
})

describe('RF-ENC-33 — Corrección o retiro de una pregunta', () => {
  it('desactiva una pregunta y deja de ofrecerla', () => {
    prepararEncuestas([PREGUNTA])
    cy.intercept('DELETE', '**/api/evaluations/questions/8', { success: true }).as('retiro')
    cy.intercept('GET', '**/api/evaluations/questions', (req) => {
      req.reply({ success: true, data: [PREGUNTA] })
    })
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()

    cy.contains('El docente explica con claridad').should('be.visible')
    cy.intercept('GET', '**/api/evaluations/questions', { success: true, data: [] }).as('preguntasVacias')
    cy.contains('button', 'Desactivar').click()

    cy.wait('@retiro')
    cy.wait('@preguntasVacias')
    cy.contains('El docente explica con claridad').should('not.exist')
  })

  it('si el retiro falla, la pregunta sigue en la tabla', () => {
    prepararEncuestas([PREGUNTA])
    cy.intercept('DELETE', '**/api/evaluations/questions/8', {
      statusCode: 500,
      body: { error: 'No se pudo desactivar la pregunta' },
    }).as('retiro')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()
    cy.contains('button', 'Desactivar').click()

    cy.wait('@retiro')
    cy.contains('No se pudo desactivar la pregunta').should('be.visible')
    cy.contains('El docente explica con claridad').should('be.visible')
  })
})

describe('RF-ENC-33 — Corregir el texto de una pregunta', () => {
  const LLEGA = { ...PREGUNTA, id: 9, texto_pregunta: 'El docente llega a tiempo', orden: 2 }

  function editar(texto: string) {
    cy.get('button[aria-label="Editar pregunta El docente explica con claridad"]').click()
    cy.get('dialog[open]').within(() => {
      cy.contains('h2', 'Editar pregunta').should('be.visible')
      cy.contains('label', 'Texto de la pregunta').parent().find('input')
        .should('have.value', 'El docente explica con claridad')
        .clear()
        .type(texto)
      cy.contains('button', 'Guardar cambios de la pregunta').click()
    })
  }

  it('corrige el texto, envía el PUT y la tabla muestra el nuevo texto', () => {
    prepararEncuestas([PREGUNTA, LLEGA])
    cy.intercept('PUT', '**/api/evaluations/questions/8', {
      success: true,
      data: { ...PREGUNTA, texto_pregunta: 'El docente explica con ejemplos' },
    }).as('corregir')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()
    cy.intercept('GET', '**/api/evaluations/questions', {
      success: true,
      data: [{ ...PREGUNTA, texto_pregunta: 'El docente explica con ejemplos' }, LLEGA],
    }).as('recarga')

    editar('El docente explica con ejemplos')

    cy.wait('@corregir').then(({ request }) => {
      expect(request.body).to.include({ texto_pregunta: 'El docente explica con ejemplos', categoria_id: 1 })
      expect(request.body).to.not.have.any.keys('id', 'activa')
    })
    cy.wait('@recarga')
    cy.contains('Pregunta actualizada').should('be.visible')
    cy.get('dialog[open]').should('not.exist')
    cy.contains('td', 'El docente explica con ejemplos').should('be.visible')
  })

  it('alternativo: un texto repetido en la encuesta se rechaza sin llamar al servidor', () => {
    prepararEncuestas([PREGUNTA, LLEGA])
    cy.intercept('PUT', '**/api/evaluations/questions/*', cy.spy().as('corregir'))
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()

    editar('  el DOCENTE llega a tiempo ')

    cy.get('dialog[open]').within(() => {
      cy.get('[role="alert"]').should('have.text', 'Ya hay una pregunta con ese texto en esta encuesta')
    })
    cy.get('@corregir').should('not.have.been.called')
  })

  it('error: si el back responde 400, el mensaje aparece en el diálogo y no se cierra', () => {
    prepararEncuestas([PREGUNTA])
    cy.intercept('PUT', '**/api/evaluations/questions/8', {
      statusCode: 400,
      body: { success: false, error: 'Datos inválidos', message: 'El texto de la pregunta es obligatorio.' },
    }).as('corregir')
    cy.visitarConSesion('/admin/surveys', usuarios.admin)
    abrirDocencia()

    editar('El docente explica con ejemplos')

    cy.wait('@corregir').its('response.statusCode').should('eq', 400)
    cy.get('dialog[open]')
      .should('be.visible')
      .find('[role="alert"]')
      .should('contain.text', 'El texto de la pregunta es obligatorio.')
    cy.contains('td', 'El docente explica con claridad').should('exist')
  })
})

describe('RF-EVAL-11, RF-EVAL-12 y RF-ACA-27 — Elegir la encuesta', () => {
  function prepararSeleccion(docentes: unknown[], grupos: unknown[] = [{ id: 'g1', numero_grupo: '01' }]) {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/periodos/evaluacion', [])
    cy.intercept('GET', '**/api/teachers', docentes).as('docentes')
    cy.intercept('GET', '**/api/teachers/*/courses/*/groups', grupos).as('grupos')
  }

  it('elige docente, materia y grupo y sigue a la evaluación', () => {
    prepararSeleccion([ANA])
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.contains('Ana Ruiz').click()
    cy.get('select').select('c1')
    cy.contains('Grupo 01').click()
    cy.contains('button', 'Continuar a Evaluación').click()

    cy.location('pathname').should('eq', '/evaluate/form')
  })

  it('el buscador deja solo la materia que coincide', () => {
    prepararSeleccion([
      ANA,
      {
        id: '8',
        name: 'Luis Gómez',
        department: 'Básica',
        email: 'luis@udem.edu.co',
        courses: [{ id: 'c9', name: 'Cálculo', code: 'MAT-2', schedule: 'Martes' }],
      },
    ])
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.contains('Ana Ruiz').should('be.visible')
    cy.get('input[placeholder="Buscar docente o materia..."]').type('MAT-2')
    cy.contains('Luis Gómez').should('be.visible')
    cy.contains('Ana Ruiz').should('not.exist')
  })

  it('un docente ya respondido no se puede elegir y un fallo de carga se puede reintentar', () => {
    prepararSeleccion([
      {
        ...ANA,
        courses: [{ ...ANA.courses[0], evaluada: true }],
      },
    ])
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)
    cy.contains('Respondida').should('be.visible')
    cy.contains('Ana Ruiz').click()
    cy.contains('Primero selecciona un docente').should('be.visible')

    cy.intercept('GET', '**/api/teachers', { statusCode: 500, body: { error: 'caido' } }).as('caido')
    cy.visit('/evaluate/selection')
    cy.contains('Error al cargar los profesores').should('be.visible')
    cy.contains('button', 'Reintentar').should('be.visible')
  })
})

describe('RF-NOT-34 y RF-NOT-35 — Notificaciones de la ventana', () => {
  it('con la ventana abierta el estudiante ve el aviso y la acción de evaluar', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers', [])
    cy.intercept('GET', '**/api/periodos/evaluacion', VENTANA_ABIERTA).as('ventanas')
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.get('button[aria-label^="Notificaciones"]').click()
    cy.contains('Evaluación docente abierta').should('be.visible')
    cy.contains('Evaluar ahora').should('be.visible')
  })

  it('marcar todas como leídas quita el pendiente', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers', [])
    cy.intercept('GET', '**/api/periodos/evaluacion', VENTANA_ABIERTA)
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.get('button[aria-label^="Notificaciones"]').click()
    cy.contains('button', 'Marcar todas como leídas').click()
    cy.get('button[aria-label="Notificaciones"]').should('be.visible')
  })

  it('sin ventanas la campana dice que no hay notificaciones', () => {
    cy.simularBackVacio()
    cy.intercept('GET', '**/api/teachers', [])
    cy.intercept('GET', '**/api/periodos/evaluacion', [])
    cy.visitarConSesion('/evaluate/selection', usuarios.estudiante)

    cy.get('button[aria-label="Notificaciones"]').click()
    cy.contains('No hay notificaciones').should('be.visible')
  })
})

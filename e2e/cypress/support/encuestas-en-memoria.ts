/**
 * Back simulado con estado para las funcionalidades de Esteban:
 *  - Creación de encuestas (RF-ENC-32, RF-ENC-33): encuestas (categorías) y preguntas.
 *  - Selección de la encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27): docentes, materias y grupos.
 *  - Notificaciones (RF-NOT-34, RF-NOT-35): ventanas de evaluación.
 *
 * Las respuestas siguen el contrato del back real, incluidas las validaciones de DEF-48 y DEF-49,
 * para que un escenario pueda comprobar el efecto (qué quedó guardado), no solo la pantalla.
 */

export type Encuesta = { id: number; nombre: string; descripcion?: string; orden: number }
export type Pregunta = {
  id: number
  categoria_id: number
  texto_pregunta: string
  descripcion?: string
  tipo_pregunta: string
  obligatoria: boolean
  orden: number
  activa: boolean
  id_carrera: number | null
}
export type Materia = { id: string; name: string; code: string; schedule: string; evaluada?: boolean; bloqueada?: boolean }
export type Docente = { id: string; name: string; department: string; email: string; courses: Materia[] }
export type Ventana = { periodoId: number; ano: number; semestre: number; fechaInicio: string; fechaFin: string }

export type EncuestasEnMemoria = {
  encuestas: Encuesta[]
  preguntas: Pregunta[]
  docentes: Docente[]
  ventanas: Ventana[]
  /** PUT /questions/:id recibidos (para comprobar que el front no llamó al servidor). */
  correcciones: number
  /** Si se define, el siguiente PUT responde ese error una vez. */
  rechazoDeCorreccion: { estado: number; mensaje: string } | null
  docentesCaidos: boolean
  sembrarEncuesta(nombre: string): Encuesta
  sembrarPregunta(encuesta: string, texto: string): Pregunta
  encuestaLlamada(nombre: string): Encuesta | undefined
}

const idDeLaRuta = (url: string) => Number(url.match(/\/questions\/([^/?]+)/)?.[1])

export function levantarEncuestasEnMemoria(): EncuestasEnMemoria {
  const back: EncuestasEnMemoria = {
    encuestas: [],
    preguntas: [],
    docentes: [],
    ventanas: [],
    correcciones: 0,
    rechazoDeCorreccion: null,
    docentesCaidos: false,
    sembrarEncuesta(nombre) {
      const encuesta = { id: back.encuestas.length + 1, nombre, descripcion: '', orden: back.encuestas.length + 1 }
      back.encuestas.push(encuesta)
      return encuesta
    },
    sembrarPregunta(nombreEncuesta, texto) {
      const encuesta = back.encuestaLlamada(nombreEncuesta) ?? back.sembrarEncuesta(nombreEncuesta)
      const pregunta: Pregunta = {
        id: back.preguntas.length + 1,
        categoria_id: encuesta.id,
        texto_pregunta: texto,
        descripcion: '',
        tipo_pregunta: 'likert',
        obligatoria: true,
        orden: back.preguntas.filter((p) => p.categoria_id === encuesta.id).length + 1,
        activa: true,
        id_carrera: null,
      }
      back.preguntas.push(pregunta)
      return pregunta
    },
    encuestaLlamada(nombre) {
      return back.encuestas.find((e) => e.nombre === nombre)
    },
  }

  cy.intercept('GET', '**/api/users/academic-structure', { facultades: [] })

  // ── Encuestas (categorías) ──
  cy.intercept('GET', '**/api/evaluations/categories', (req) => req.reply({ categories: back.encuestas })).as('encuestas')
  cy.intercept('POST', '**/api/evaluations/categories', (req) => {
    const nombre = String(req.body?.nombre ?? '').trim()
    if (!nombre) return req.reply(400, { error: 'El nombre de la encuesta es obligatorio.' })
    if (back.encuestaLlamada(nombre)) return req.reply(409, { error: 'Ya existe una encuesta con ese nombre.' })
    req.reply(201, { category: back.sembrarEncuesta(nombre) })
  }).as('crearEncuesta')

  // ── Preguntas ──
  cy.intercept('GET', '**/api/evaluations/questions', (req) =>
    req.reply({ success: true, data: back.preguntas.filter((p) => p.activa) })
  ).as('preguntas')

  cy.intercept('POST', '**/api/evaluations/questions', (req) => {
    const { categoria_id, texto_pregunta, tipo_pregunta, orden } = req.body ?? {}
    if (!categoria_id || !texto_pregunta || !tipo_pregunta || orden === undefined) {
      return req.reply(400, { success: false, error: 'Datos incompletos' })
    }
    const pregunta: Pregunta = { ...req.body, id: back.preguntas.length + 1, activa: true, id_carrera: req.body.id_carrera ?? null }
    back.preguntas.push(pregunta)
    req.reply(201, { success: true, data: pregunta, message: 'Pregunta creada exitosamente' })
  }).as('crearPregunta')

  cy.intercept('PUT', '**/api/evaluations/questions/*', (req) => {
    back.correcciones += 1
    if (back.rechazoDeCorreccion) {
      const { estado, mensaje } = back.rechazoDeCorreccion
      back.rechazoDeCorreccion = null
      return req.reply(estado, { success: false, error: 'Datos inválidos', message: mensaje })
    }
    const pregunta = back.preguntas.find((p) => p.id === idDeLaRuta(req.url))
    if (!pregunta) return req.reply(404, { success: false, message: 'Pregunta no encontrada' })
    const texto = String(req.body?.texto_pregunta ?? '').trim()
    if (!texto) return req.reply(400, { success: false, message: 'El texto de la pregunta es obligatorio.' })
    Object.assign(pregunta, { ...req.body, texto_pregunta: texto, id: pregunta.id, activa: pregunta.activa })
    req.reply({ success: true, data: pregunta, message: 'Pregunta actualizada exitosamente' })
  }).as('corregirPregunta')

  cy.intercept('DELETE', '**/api/evaluations/questions/*', (req) => {
    const pregunta = back.preguntas.find((p) => p.id === idDeLaRuta(req.url))
    if (!pregunta) return req.reply(404, { success: false, message: 'Pregunta no encontrada' })
    pregunta.activa = false
    req.reply({ success: true, message: 'Pregunta desactivada exitosamente' })
  }).as('retirarPregunta')

  // ── Selección de la encuesta ──
  cy.intercept('GET', '**/api/teachers', (req) =>
    back.docentesCaidos ? req.reply(500, { error: 'Servicio no disponible' }) : req.reply(back.docentes)
  ).as('docentes')
  cy.intercept('GET', '**/api/teachers/*/courses/*/groups', [{ id: 'g1', numero_grupo: '01' }]).as('grupos')

  // ── Ventanas de evaluación (notificaciones) ──
  cy.intercept('GET', '**/api/periodos/evaluacion', (req) => req.reply(back.ventanas)).as('ventanas')

  return back
}

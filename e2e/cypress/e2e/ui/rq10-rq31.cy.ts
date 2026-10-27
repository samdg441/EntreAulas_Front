/**
 * RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31.
 * Mismo estilo que CYPRESS-JS-TEST: visitar, actuar y comprobar el resultado en pantalla.
 * El back se simula con cy.intercept para que el resultado no dependa de la base real.
 */
const CLAVE = 'Clave-Segura2026!'

type Cuenta = { email: string; tipo: string; nombre: string; apellido: string; etiqueta: string }

const EVA: Cuenta = { email: 'eva.estudiante@soyudemedellin.edu.co', tipo: 'estudiante', nombre: 'Eva', apellido: 'Estudiante', etiqueta: 'Estudiante' }
const LIA: Cuenta = { email: 'lia.estudiante@soyudemedellin.edu.co', tipo: 'estudiante', nombre: 'Lía', apellido: 'Estudiante', etiqueta: 'Estudiante' }
const ADA: Cuenta = { email: 'ada.admin@udemedellin.edu.co', tipo: 'admin', nombre: 'Ada', apellido: 'Admin', etiqueta: 'Administrador' }
const PEDRO: Cuenta = { email: 'pedro.docente@udemedellin.edu.co', tipo: 'profesor', nombre: 'Pedro', apellido: 'Docente', etiqueta: 'Docente' }
const CARLOS: Cuenta = { email: 'carlos.coordinador@udemedellin.edu.co', tipo: 'coordinador', nombre: 'Carlos', apellido: 'Coordinador', etiqueta: 'Coordinador' }
const DORA: Cuenta = { email: 'dora.decano@udemedellin.edu.co', tipo: 'decano', nombre: 'Dora', apellido: 'Decano', etiqueta: 'Decano' }

const USUARIOS = [EVA, LIA, ADA, PEDRO, CARLOS, DORA]

function elegirTipo(etiqueta: string) {
  cy.get('form button[type="button"]').first().then(($boton) => {
    if ($boton.text().includes(etiqueta)) return
    cy.wrap($boton).click()
    cy.contains('form .absolute button', etiqueta).click()
  })
}

function entrar(cuenta: Cuenta) {
  cy.intercept('POST', '**/api/auth/login', (req) => {
    const conocida = USUARIOS.find((u) => u.email === req.body.email && req.body.password === CLAVE)
    if (!conocida) return req.reply(401, { error: 'Credenciales inválidas' })
    req.reply({
      token: `jwt-${conocida.email}`,
      user: {
        id: `u-${USUARIOS.indexOf(conocida)}`,
        email: conocida.email,
        nombre: conocida.nombre,
        apellido: conocida.apellido,
        tipo_usuario: conocida.tipo,
        roles: [conocida.tipo],
      },
    })
  }).as('login')
  cy.visit('/login')
  elegirTipo(cuenta.etiqueta)
  cy.get('input[type="email"]').type(cuenta.email)
  cy.get('input[type="password"]').type(CLAVE, { log: false })
  cy.get('button[type="submit"]').click()
  cy.wait('@login')
  cy.location('pathname').should('not.eq', '/login')
}

function simularFlujos() {
  cy.simularBackVacio()
  cy.intercept('GET', '**/api/users', {
    users: USUARIOS.map((u, i) => ({ id: `u-${i}`, email: u.email, nombre: u.nombre, apellido: u.apellido, tipo_usuario: u.tipo, activo: true, roles: [u.tipo] })),
  })
  cy.intercept('GET', '**/api/teachers/student-stats', (req) => {
    const eva = String(req.headers.authorization ?? '').includes(EVA.email)
    req.reply({
      evaluacionesCompletadas: eva ? 1 : 0,
      evaluacionesPendientes: 0,
      materiasMatriculadas: eva ? 1 : 0,
      promedioGeneral: eva ? 4 : 0,
      progresoGeneral: 0,
    })
  })
  cy.intercept('GET', '**/api/teachers/student-enrolled-subjects', { materiasMatriculadas: [], total: 0 })
  cy.intercept('GET', '**/api/teachers/student-info', { id: 'u-0', nombre: 'Eva' })
  cy.intercept({ method: 'GET', url: /\/api\/teachers$/ }, [
    { id: '7', name: 'Ana Pérez', department: 'Ingeniería de Sistemas', email: 'ana.perez@udemedellin.edu.co', courses: [{ id: '31', name: 'Programación I', code: 'SIS-101', schedule: 'Lun 8-10' }] },
  ])
  cy.intercept('GET', /\/api\/teachers\/[^/]+\/courses\/[^/]+\/groups/, [{ id: 4, numero_grupo: 1, horario: 'Lun 8-10', aula: 'A-101', cup: 30 }])
  cy.intercept('GET', '**/api/teachers/evaluation-questions/**', {
    questions: [{ id: '1', category: 'Claridad Expositiva', question: 'El profesor explica claramente', type: 'rating' }],
    courseName: 'Programación I',
    courseCode: 'SIS-101',
  })
  cy.intercept('POST', '**/api/teachers/evaluations', (req) => {
    if (req.body?.comments === 'repetida') return req.reply(409, { error: 'Ya has evaluado a este profesor para este curso y grupo' })
    req.reply(200, { success: true, evaluationId: 'eval-1' })
  })
  cy.intercept('POST', '**/api/auth/create-user', (req) => {
    if (String(req.body?.email).startsWith('eva.estudiante@') || String(req.body?.email).startsWith('eva@')) {
      return req.reply(400, { error: 'El email ya está registrado' })
    }
    req.reply(201, { message: 'Usuario creado', user: { id: 'u-nuevo' } })
  })
  cy.intercept('PUT', /\/api\/users\/[^/]+$/, { ok: true })
  cy.intercept('DELETE', /\/api\/users\/([^/?]+)/, (req) => {
    const id = req.url.match(/\/api\/users\/([^/?]+)/)?.[1]
    if (id === `u-${USUARIOS.indexOf(ADA)}`) return req.reply(400, { error: 'No puedes desactivar tu propia cuenta' })
    req.reply(200, { ok: true })
  })
  cy.intercept('GET', '**/api/teachers/teacher-id', { teacherId: '7' })
  cy.intercept('GET', '**/api/teachers/teacher-courses/**', [])
  cy.intercept('GET', '**/api/teachers/**/stats/historical*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
  cy.intercept('GET', '**/api/teachers/period-stats*', { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
  cy.intercept('GET', '**/api/teachers/period-category-stats*', [])
  cy.intercept('GET', '**/api/teachers/career-subjects', { carreras: [] })
  cy.intercept('GET', '**/api/coordinador/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
  cy.intercept('GET', '**/api/decano/reports-overview*', { teachers: [], distribution: [], trend: [], categoryStats: [] })
  cy.intercept('GET', '**/api/ai/summarize/by-professor*', { summary: 'Resumen de los comentarios del docente.', topics: ['claridad'], textsCount: 1, analysisSource: 'open_text', acosoDetectado: false })
  cy.intercept('GET', '**/api/ai/summarize/by-career*', {
    summary: 'Resumen de la carrera.',
    topics: ['acoso'],
    textsCount: 1,
    analysisSource: 'open_text',
    acosoDetectado: true,
    mensajeAcoso: 'Hubo acoso en una respuesta.',
    acosoProfesores: [{ profesorId: '7', nombre: 'Ana Perez', menciones: 1 }],
  })
  cy.intercept('GET', '**/api/ai/summarize/by-faculty*', { summary: 'No hay comentarios suficientes en la facultad.', topics: [], textsCount: 0, analysisSource: 'open_text', acosoDetectado: false })
}

function tarjeta(titulo: string, valor: string) {
  cy.contains(titulo).closest('.bg-white').should('contain', valor)
}

function enviarEvaluacion(comentario: string) {
  cy.contains('button', 'Nueva Evaluación').click()
  cy.contains('h3', 'Ana Pérez').click()
  cy.get('select').select('Programación I (SIS-101)')
  cy.contains('Grupo 1').click()
  cy.contains('button', 'Continuar a Evaluación').click()
  cy.contains('Claridad Expositiva').parents('.space-y-4').first().contains('span', /^5$/).click()
  cy.get('textarea[placeholder="Escribe tus comentarios aquí..."]').type(comentario)
  cy.contains('button', 'Finalizar Evaluación').click()
  cy.contains('button', 'Confirmar y Enviar').click()
}

describe('RQ10 — estadísticas del estudiante', () => {
  beforeEach(() => simularFlujos())

  it('Eva ve completadas, pendientes y cursos', () => {
    entrar(EVA)
    tarjeta('Evaluaciones Completadas', '1')
    tarjeta('Evaluaciones Pendientes', '0')
    tarjeta('Cursos Matriculados', '1')
  })

  it('Lía ve las tres estadísticas en cero', () => {
    entrar(LIA)
    tarjeta('Evaluaciones Completadas', '0')
    tarjeta('Evaluaciones Pendientes', '0')
    tarjeta('Cursos Matriculados', '0')
  })
})

describe('RQ11 — enviar la evaluación', () => {
  beforeEach(() => {
    simularFlujos()
    entrar(EVA)
  })

  it('guarda la evaluación y muestra la despedida', () => {
    enviarEvaluacion('La explicación fue clara')
    cy.contains('Gracias por tu participación').should('be.visible')
    cy.location('pathname').should('eq', '/evaluate/goodbye')
  })

  it('rechaza el comentario repetido y se queda en el formulario', () => {
    enviarEvaluacion('repetida')
    cy.contains('Ya has evaluado a este profesor para este curso y grupo').should('be.visible')
    cy.location('pathname').should('eq', '/evaluate/form')
  })
})

describe('RQ13 — gestionar usuarios', () => {
  beforeEach(() => {
    simularFlujos()
    entrar(ADA)
    cy.visit('/admin/users')
    cy.contains(EVA.email).should('be.visible')
  })

  it('crea un estudiante y no muestra la contraseña', () => {
    cy.contains('button', 'Agregar usuario').click()
    cy.get('#nombre').type('Luis')
    cy.get('#apellido').type('Gomez')
    cy.get('#correo-institucional').type('luis')
    cy.get('#contraseña').type(CLAVE, { log: false })
    cy.contains('button', 'Crear').click()
    cy.contains('LUIS GOMEZ').should('be.visible')
    cy.contains('luis@soyudemedellin.edu.co').should('be.visible')
    cy.contains(CLAVE).should('not.exist')
  })

  it('rechaza un correo ya registrado', () => {
    cy.contains('button', 'Agregar usuario').click()
    cy.get('#nombre').type('Eva')
    cy.get('#apellido').type('Estudiante')
    cy.get('#correo-institucional').type('eva.estudiante')
    cy.get('#contraseña').type(CLAVE, { log: false })
    cy.contains('button', 'Crear').click()
    cy.contains('El email ya está registrado').should('be.visible')
  })

  it('no deja crear con una clave sin mayúscula', () => {
    cy.contains('button', 'Agregar usuario').click()
    cy.get('#nombre').type('Ana')
    cy.get('#apellido').type('Perez')
    cy.get('#correo-institucional').type('ana')
    cy.get('#contraseña').type('cortacorta', { log: false })
    cy.contains('button', 'Crear').click()
    cy.contains('La contraseña debe contener al menos una letra mayúscula').should('be.visible')
  })

  it('actualiza el nombre de Eva', () => {
    cy.contains('tr', 'eva.estudiante').contains('button', 'Editar').click()
    cy.get('#nombre').clear().type('Evelia')
    cy.contains('button', 'Actualizar').click()
    cy.contains('EVELIA Estudiante').should('be.visible')
  })

  it('desactiva a otro usuario', () => {
    cy.contains('tr', 'eva.estudiante').contains('button', 'Desactivar').click()
    cy.get('.fixed.inset-0').contains('button', 'Desactivar').click()
    cy.contains('tr', 'eva.estudiante').contains('Inactivo').should('be.visible')
  })

  it('no permite que el administrador se desactive', () => {
    cy.contains('tr', 'ada.admin').contains('button', 'Desactivar').click()
    cy.get('.fixed.inset-0').contains('button', 'Desactivar').click()
    cy.contains('No puedes desactivar tu propia cuenta').should('be.visible')
  })

  it('deja la tabla vacía si la búsqueda no coincide', () => {
    cy.get('input[placeholder="Buscar por nombre, email o rol…"]').type('zzz')
    cy.contains('No hay usuarios que coincidan con los filtros').should('be.visible')
  })
})

describe('RQ29 RQ30 RQ31 — resúmenes y alerta de acoso', () => {
  beforeEach(() => simularFlujos())

  it('el docente ve el resumen de sus comentarios y no la alerta', () => {
    entrar(PEDRO)
    cy.visit('/reports')
    cy.contains('button', 'Generar resumen IA').click()
    cy.contains('Resumen de los comentarios del docente.').should('be.visible')
    cy.contains('claridad').should('be.visible')
    cy.contains('ALERTA DE ACOSO DETECTADO').should('not.exist')
  })

  it('el coordinador ve el resumen de la carrera y la alerta de acoso', () => {
    entrar(CARLOS)
    cy.visit('/reports')
    cy.contains('button', 'Generar resumen IA').click()
    cy.contains('Resumen de la carrera.').should('be.visible')
    cy.contains('ALERTA DE ACOSO DETECTADO').should('be.visible')
    cy.contains('Hubo acoso en una respuesta.').should('be.visible')
    cy.contains('Ana Perez: 1 mención(es)').should('be.visible')
  })

  it('el decano ve que no hay comentarios suficientes y no hay alerta', () => {
    entrar(DORA)
    cy.visit('/reports')
    cy.contains('button', 'Generar resumen IA').click()
    cy.contains('No se encontraron respuestas abiertas').should('be.visible')
    cy.contains('No hay comentarios suficientes en la facultad.').should('be.visible')
    cy.contains('ALERTA DE ACOSO DETECTADO').should('not.exist')
  })
})

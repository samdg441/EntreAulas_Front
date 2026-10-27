import { createServer } from 'node:http'

/**
 * Back HTTP para Momentic. El front en :3001 llama a localhost:3000
 * y estas pruebas no pueden interceptar el navegador como Cypress.
 * Cuentas y respuestas de RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31.
 */
const PUERTO = Number(process.env.MOMENTIC_BACK_PUERTO ?? 3000)
const CLAVE = 'Clave-Segura2026!'

const cuentas = [
  { email: 'eva.estudiante@soyudemedellin.edu.co', password: CLAVE, nombre: 'Eva', apellido: 'Estudiante', tipo_usuario: 'estudiante' },
  { email: 'lia.estudiante@soyudemedellin.edu.co', password: CLAVE, nombre: 'Lía', apellido: 'Estudiante', tipo_usuario: 'estudiante' },
  { email: 'ada.admin@udemedellin.edu.co', password: CLAVE, nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' },
  { email: 'pedro.docente@udemedellin.edu.co', password: CLAVE, nombre: 'Pedro', apellido: 'Docente', tipo_usuario: 'profesor' },
  { email: 'carlos.coordinador@udemedellin.edu.co', password: CLAVE, nombre: 'Carlos', apellido: 'Coordinador', tipo_usuario: 'coordinador' },
  { email: 'dora.decano@udemedellin.edu.co', password: CLAVE, nombre: 'Dora', apellido: 'Decano', tipo_usuario: 'decano' },
].map((cuenta) => ({ ...cuenta, activo: true }))

const statsDocente = {
  totalEvaluaciones: 0,
  calificacionPromedio: 0,
  evaluacionesPorCurso: [],
  evaluacionesPorGrupo: [],
}
const resumenVacio = {
  teachers: [],
  distribution: [],
  trend: [],
  categoryStats: [],
  courseAverages: [],
  summary: { totalEvaluaciones: 0, calificacionPromedio: 0 },
  stats: { totalProfesores: 0, totalCursos: 0, promedioEvaluaciones: 0, profesoresEnRiesgo: 0, totalEvaluaciones: 0 },
  pagination: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
}
const ana = {
  id: '7',
  name: 'Ana Pérez',
  department: 'Ingeniería de Sistemas',
  email: 'ana.perez@udemedellin.edu.co',
  courses: [{ id: '31', name: 'Programación I', code: 'SIS-101', schedule: 'Lun 8-10' }],
}

const leerCuerpo = async (req) => {
  const trozos = []
  for await (const parte of req) trozos.push(parte)
  const texto = Buffer.concat(trozos).toString('utf8')
  try {
    return texto ? JSON.parse(texto) : {}
  } catch {
    return {}
  }
}

const sesionDe = (req) => {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  const email = token.startsWith('jwt-') ? token.slice(4) : ''
  const indice = cuentas.findIndex((cuenta) => cuenta.email === email)
  return { email, id: indice >= 0 ? `u-${indice + 1}` : '' }
}

const usuarioPublico = (cuenta, indice) => ({
  id: `u-${indice + 1}`,
  email: cuenta.email,
  nombre: cuenta.nombre,
  apellido: cuenta.apellido,
  tipo_usuario: cuenta.tipo_usuario,
  activo: cuenta.activo !== false,
  roles: [cuenta.tipo_usuario],
})

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PUERTO}`)
  const ruta = url.pathname
  const responder = (estado, cuerpo) => {
    res.writeHead(estado, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': req.headers.origin ?? '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    })
    res.end(JSON.stringify(cuerpo))
  }

  if (req.method === 'OPTIONS') return responder(204, {})
  const cuerpo = await leerCuerpo(req)

  if (req.method === 'GET' && ruta === '/api/health') return responder(200, { ok: true })

  if (req.method === 'POST' && (ruta === '/api/auth/login' || ruta === '/api/auth/login-with-role')) {
    const cuenta = cuentas.find((item) => item.email === cuerpo.email && item.password === cuerpo.password && item.activo !== false)
    if (!cuenta) return responder(401, { error: 'Credenciales inválidas' })
    const indice = cuentas.findIndex((item) => item.email === cuenta.email)
    return responder(200, { token: `jwt-${cuenta.email}`, user: usuarioPublico(cuenta, indice) })
  }

  if (req.method === 'POST' && ruta === '/api/auth/create-user') {
    if (cuentas.some((item) => item.email === cuerpo.email)) return responder(400, { error: 'El email ya está registrado' })
    cuentas.push({ ...cuerpo, activo: true })
    return responder(201, { message: 'Usuario creado', user: { id: `u-${cuentas.length}` } })
  }

  if (req.method === 'GET' && ruta === '/api/users') {
    return responder(200, { users: cuentas.map(usuarioPublico) })
  }

  if (req.method === 'PUT' && /^\/api\/users\/[^/]+$/.test(ruta)) return responder(200, { ok: true })

  if (req.method === 'DELETE' && /^\/api\/users\/[^/]+$/.test(ruta)) {
    const id = ruta.split('/').pop()
    if (id === sesionDe(req).id) return responder(400, { error: 'No puedes desactivar tu propia cuenta' })
    const indice = cuentas.findIndex((_, i) => `u-${i + 1}` === id)
    if (indice >= 0) cuentas[indice].activo = false
    return responder(200, { ok: true })
  }

  if (req.method === 'GET' && ruta === '/api/teachers/student-stats') {
    const eva = sesionDe(req).email === 'eva.estudiante@soyudemedellin.edu.co'
    return responder(200, {
      evaluacionesCompletadas: eva ? 1 : 0,
      evaluacionesPendientes: 0,
      materiasMatriculadas: eva ? 1 : 0,
      promedioGeneral: eva ? 4 : 0,
      progresoGeneral: 0,
    })
  }

  if (req.method === 'GET' && ruta === '/api/teachers/student-enrolled-subjects') {
    return responder(200, { materiasMatriculadas: [], total: 0 })
  }
  if (req.method === 'GET' && ruta === '/api/teachers/student-info') return responder(200, { id: 'u-1', nombre: 'Eva' })
  if (req.method === 'GET' && ruta === '/api/teachers') return responder(200, [ana])
  if (/^\/api\/teachers\/[^/]+\/courses\/[^/]+\/groups$/.test(ruta)) {
    return responder(200, [{ id: 4, numero_grupo: 1, horario: 'Lun 8-10', aula: 'A-101', cup: 30 }])
  }
  if (ruta.startsWith('/api/teachers/evaluation-questions/')) {
    return responder(200, {
      questions: [{ id: '1', category: 'Claridad Expositiva', question: 'El profesor explica claramente los conceptos del curso', type: 'rating' }],
      courseName: 'Programación I',
      courseCode: 'SIS-101',
    })
  }
  if (req.method === 'POST' && ruta === '/api/teachers/evaluations') {
    if (cuerpo.comments === 'repetida') return responder(409, { error: 'Ya has evaluado a este profesor para este curso y grupo' })
    return responder(200, { success: true, message: 'Evaluación guardada exitosamente', evaluationId: 'eval-1' })
  }
  if (ruta.startsWith('/api/teachers/teacher-courses/')) return responder(200, [])
  if (req.method === 'GET' && ruta === '/api/teachers/teacher-id') return responder(200, { teacherId: '7' })
  if (ruta.includes('/stats/historical') || ruta.startsWith('/api/teachers/period-stats') || ruta.startsWith('/api/teachers/teacher-stats/')) {
    return responder(200, statsDocente)
  }
  if (ruta.startsWith('/api/teachers/period-category-stats')) return responder(200, [])
  if (ruta === '/api/teachers/career-subjects') return responder(200, { carreras: [] })
  if (ruta.startsWith('/api/coordinador/') || ruta.startsWith('/api/decano/')) return responder(200, resumenVacio)

  if (ruta.startsWith('/api/ai/summarize/by-professor')) {
    return responder(200, {
      summary: 'Resumen de los comentarios del docente.',
      topics: ['claridad'],
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: false,
    })
  }
  if (ruta.startsWith('/api/ai/summarize/by-career')) {
    return responder(200, {
      summary: 'Resumen de la carrera.',
      topics: ['acoso'],
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: true,
      mensajeAcoso: 'Hubo acoso en una respuesta.',
      acosoProfesores: [{ profesorId: '7', nombre: 'Ana Perez', menciones: 1, ejemplos: ['Hubo acoso'] }],
    })
  }
  if (ruta.startsWith('/api/ai/summarize/by-faculty')) {
    return responder(200, {
      summary: 'No hay comentarios suficientes en la facultad.',
      topics: [],
      textsCount: 0,
      analysisSource: 'open_text',
      acosoDetectado: false,
    })
  }

  return responder(200, {})
})

servidor.listen(PUERTO, () => {
  console.log(`Back de Momentic en http://localhost:${PUERTO}`)
})

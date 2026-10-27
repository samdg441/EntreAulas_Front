import { createServer, type IncomingMessage, type Server } from 'node:http'

/**
 * Back de autenticación en memoria para Stagehand (RQ1–RQ5): mismas reglas que el back real.
 * El front local usa http://localhost:3000 cuando no hay VITE_API_URL, así que el servidor escucha ahí.
 * Así las pruebas no necesitan cuentas reales ni tocan la base de datos de producción.
 */
export type Cuenta = { email: string; password: string; nombre: string; apellido: string; tipo_usuario: string; activo?: boolean }
type Token = { token: string; email: string; usado: boolean }

export const CLAVE = 'Clave#2026a'
export const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
export const CUENTAS = {
  admin: { email: 'ada@udemedellin.edu.co', password: CLAVE, nombre: 'ADA', apellido: 'ADMIN', tipo_usuario: 'admin' },
  estudiante: { email: 'eva@soyudemedellin.edu.co', password: CLAVE, nombre: 'EVA', apellido: 'ESTUDIANTE', tipo_usuario: 'estudiante' },
  lia: { email: 'lia@soyudemedellin.edu.co', password: CLAVE, nombre: 'LIA', apellido: 'ESTUDIANTE', tipo_usuario: 'estudiante' },
  profesor: { email: 'pablo@udemedellin.edu.co', password: CLAVE, nombre: 'PABLO', apellido: 'PROFESOR', tipo_usuario: 'profesor' },
  coordinador: { email: 'carlos@udemedellin.edu.co', password: CLAVE, nombre: 'CARLOS', apellido: 'COORDINADOR', tipo_usuario: 'coordinador' },
  decano: { email: 'dora@udemedellin.edu.co', password: CLAVE, nombre: 'DORA', apellido: 'DECANO', tipo_usuario: 'decano' },
} satisfies Record<string, Cuenta>

export type BackSimulado = {
  cuentas: Cuenta[]
  tokens: Token[]
  correos: Array<{ para: string; enlace: string }>
  cerrar(): Promise<void>
}

const leerCuerpo = async (req: IncomingMessage): Promise<Record<string, string>> => {
  let texto = ''
  for await (const parte of req) texto += parte
  try {
    return texto ? JSON.parse(texto) : {}
  } catch {
    return {}
  }
}

export async function levantarBackSimulado(puerto = Number(process.env.BACK_SIMULADO_PUERTO ?? 3000)): Promise<BackSimulado> {
  const cuentas: Cuenta[] = Object.values(CUENTAS).map((c) => ({ ...c }))
  const tokens: Token[] = []
  const correos: BackSimulado['correos'] = []

  const servidor: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${puerto}`)
    const responder = (estado: number, cuerpo: unknown) => {
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
    const ruta = url.pathname

    if (req.method === 'POST' && ruta === '/api/auth/login') {
      const c = cuentas.find((x) => x.email === cuerpo.email && x.password === cuerpo.password && x.activo !== false)
      if (!c) return responder(401, { error: 'Credenciales inválidas' })
      const indice = cuentas.findIndex((x) => x.email === c.email)
      return responder(200, { token: `jwt-${c.email}`, user: { id: `u-${indice}`, ...c, password: undefined, roles: [c.tipo_usuario] } })
    }
    if (req.method === 'POST' && ruta === '/api/auth/create-user') {
      if (cuentas.some((x) => x.email === cuerpo.email)) return responder(400, { error: 'El email ya está registrado' })
      cuentas.push(cuerpo as unknown as Cuenta)
      return responder(201, { message: 'Usuario creado', user: { id: `u-${cuentas.length}` } })
    }
    if (req.method === 'GET' && ruta === '/api/users') {
      return responder(200, { users: cuentas.map((c, i) => ({ id: `u-${i}`, ...c, password: undefined, activo: true, roles: [c.tipo_usuario] })) })
    }
    if (req.method === 'POST' && ruta === '/api/auth/forgot-password') {
      if (cuentas.some((x) => x.email === cuerpo.email)) {
        const token = String(tokens.length + 1).padStart(64, 'e')
        tokens.push({ token, email: cuerpo.email, usado: false })
        correos.push({ para: cuerpo.email, enlace: `/reset-password?token=${token}&email=${encodeURIComponent(cuerpo.email)}` })
      }
      return responder(200, { message: MENSAJE_GENERICO })
    }
    if (req.method === 'GET' && ruta.startsWith('/api/auth/validate-reset-token/')) {
      const token = decodeURIComponent(ruta.split('/validate-reset-token/')[1])
      const t = tokens.find((x) => x.token === token && x.email === url.searchParams.get('email') && !x.usado)
      return t ? responder(200, { message: 'Token válido', valid: true }) : responder(400, { error: 'Token inválido o ya utilizado' })
    }
    if (req.method === 'POST' && ruta === '/api/auth/reset-password') {
      const t = tokens.find((x) => x.token === cuerpo.token && x.email === cuerpo.email && !x.usado)
      if (!t) return responder(400, { error: 'Token inválido o ya utilizado' })
      t.usado = true
      cuentas.find((x) => x.email === t.email)!.password = cuerpo.newPassword
      return responder(200, { message: 'Contraseña actualizada exitosamente' })
    }
    if (ruta.startsWith('/api/teachers/teacher-courses/')) return responder(200, [])

    const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
    const emailSesion = token.startsWith('jwt-') ? token.slice(4) : ''
    const idSesion = `u-${cuentas.findIndex((x) => x.email === emailSesion)}`

    if (req.method === 'GET' && ruta === '/api/teachers/student-stats') {
      const eva = emailSesion === CUENTAS.estudiante.email
      return responder(200, {
        evaluacionesCompletadas: eva ? 1 : 0,
        evaluacionesPendientes: 0,
        materiasMatriculadas: eva ? 1 : 0,
        promedioGeneral: eva ? 4 : 0,
        progresoGeneral: 0,
      })
    }
    if (req.method === 'GET' && ruta === '/api/teachers/student-enrolled-subjects') return responder(200, { materiasMatriculadas: [], total: 0 })
    if (req.method === 'GET' && ruta === '/api/teachers/student-info') return responder(200, { id: idSesion, nombre: 'Eva' })
    if (req.method === 'GET' && ruta === '/api/teachers') {
      return responder(200, [
        {
          id: '7',
          name: 'Ana Pérez',
          department: 'Ingeniería de Sistemas',
          email: 'ana.perez@udemedellin.edu.co',
          courses: [{ id: '31', name: 'Programación I', code: 'SIS-101', schedule: 'Lun 8-10' }],
        },
      ])
    }
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
      return responder(200, { success: true, evaluationId: 'eval-1' })
    }
    if (req.method === 'GET' && ruta === '/api/teachers/teacher-id') return responder(200, { teacherId: '7' })
    if (ruta.includes('/stats/historical') || ruta.startsWith('/api/teachers/period-stats')) {
      return responder(200, { totalEvaluaciones: 0, calificacionPromedio: 0, evaluacionesPorCurso: [], evaluacionesPorGrupo: [] })
    }
    if (ruta.startsWith('/api/teachers/period-category-stats')) return responder(200, [])
    if (ruta === '/api/teachers/career-subjects') return responder(200, { carreras: [] })
    if (ruta.startsWith('/api/coordinador/reports-overview') || ruta.startsWith('/api/decano/reports-overview')) {
      return responder(200, { teachers: [], distribution: [], trend: [], categoryStats: [] })
    }
    if (ruta.startsWith('/api/ai/summarize/by-professor')) {
      return responder(200, { summary: 'Resumen de los comentarios del docente.', topics: ['claridad'], textsCount: 1, analysisSource: 'open_text', acosoDetectado: false })
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
      return responder(200, { summary: 'No hay comentarios suficientes en la facultad.', topics: [], textsCount: 0, analysisSource: 'open_text', acosoDetectado: false })
    }
    if (req.method === 'PUT' && /^\/api\/users\/[^/]+$/.test(ruta)) return responder(200, { ok: true })
    if (req.method === 'DELETE' && /^\/api\/users\/[^/]+$/.test(ruta)) {
      const id = ruta.split('/').pop()
      if (id === idSesion) return responder(400, { error: 'No puedes desactivar tu propia cuenta' })
      return responder(200, { ok: true })
    }
    return responder(200, {})
  })

  await new Promise<void>((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(puerto, resolve)
  })
  console.log(`Back simulado escuchando en http://localhost:${puerto}`)

  return {
    cuentas,
    tokens,
    correos,
    cerrar: () => new Promise<void>((resolve) => servidor.close(() => resolve())),
  }
}

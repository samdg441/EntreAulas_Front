import type { Page, Route } from 'playwright'

import resumenCoordinador from './datos/dashboard-summary.json'
import reportesCoordinador from './datos/reports-overview.json'

/**
 * Back simulado para los escenarios @web: respuestas fijas y deterministas, como la
 * aplicación local del repositorio de referencia. Los datos de `datos/` incluyen casos
 * sucios: un promedio de 99 y un nombre que parece fórmula de Excel.
 */
export const CLAVE_VALIDA = 'Clave-Segura2026!'

export const cuentas: Record<string, { id: string; nombre: string; apellido: string; tipo_usuario: string; roles: string[] }> = {
  'carlos.coordinador@udemedellin.edu.co': { id: 'u-coord', nombre: 'Carlos', apellido: 'Coordinador', tipo_usuario: 'coordinador', roles: ['coordinador'] },
  // Cuenta con varios roles (como en producción): el dropdown "Tipo de Usuario" define la sesión.
  'gloria.multiroles@udemedellin.edu.co': {
    id: 'u-gloria',
    nombre: 'Gloria',
    apellido: 'Gasca',
    tipo_usuario: 'coordinador',
    roles: ['coordinador', 'profesor'],
  },
  'eva.estudiante@soyudemedellin.edu.co': { id: 'u-est', nombre: 'Eva', apellido: 'Estudiante', tipo_usuario: 'estudiante', roles: ['estudiante'] },
  'lia.estudiante@soyudemedellin.edu.co': { id: 'u-lia', nombre: 'Lía', apellido: 'Nieto', tipo_usuario: 'estudiante', roles: ['estudiante'] },
  'ada.admin@udemedellin.edu.co': { id: 'u-ada', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin', roles: ['admin'] },
  'pedro.docente@udemedellin.edu.co': { id: 'u-pedro', nombre: 'Pedro', apellido: 'Ruiz', tipo_usuario: 'profesor', roles: ['profesor'] },
  'dora.decano@udemedellin.edu.co': { id: 'u-dora', nombre: 'Dora', apellido: 'Decano', tipo_usuario: 'decano', roles: ['decano'] },
}

function usuariosIniciales(): UsuarioSimulado[] {
  return [
    { id: 'u-ada', email: 'ada.admin@udemedellin.edu.co', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin', activo: true, roles: ['admin'] },
    { id: 'u-est', email: 'eva.estudiante@soyudemedellin.edu.co', nombre: 'Eva', apellido: 'Estudiante', tipo_usuario: 'estudiante', activo: true, roles: ['estudiante'] },
  ]
}

export type Peticion = {
  metodo: string
  ruta: string
  query: Record<string, string>
  cuerpo: Record<string, unknown> | null
}

type UsuarioSimulado = {
  id: string
  email: string
  nombre: string
  apellido: string
  tipo_usuario: string
  activo: boolean
  roles: string[]
}

const peticionesPorPagina = new WeakMap<Page, Peticion[]>()

// Solo llamadas al back: Vite también sirve rutas como /src/api/*.ts desde el puerto del front.
const esLlamadaAlBack = (url: URL) => url.pathname.startsWith('/api/') && url.port !== '3001'

// El front (3001) llama al back en otro origen: sin estas cabeceras el navegador descarta la respuesta.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) })

const MATERIA_DE_EVA = {
  id: 11,
  grupo: {
    numeroGrupo: 1,
    horario: 'Lun 8-10',
    aula: 'A-101',
    curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
    profesor: { nombre: 'Ana Pérez' },
    periodo: { codigo: '2026-1', nombre: '2026-I' },
  },
}

const QR_VALIDO = {
  profesorId: 13,
  profesorNombre: 'Ana Pérez',
  cursoId: 12,
  cursoNombre: 'Programación I',
  cursoCodigo: 'SIS-101',
  grupoId: 63,
}

const ANA = {
  id: '7',
  name: 'Ana Pérez',
  department: 'Ingeniería de Sistemas',
  email: 'ana.perez@udemedellin.edu.co',
  courses: [{ id: '31', name: 'Programación I', code: 'SIS-101', schedule: 'Lun 8-10' }],
}

const RESUMEN_DOCENTE = {
  summary: 'Resumen de los comentarios del docente.',
  topics: ['claridad'],
  textsCount: 1,
  analysisSource: 'open_text',
  acosoDetectado: false,
}

const RESUMEN_CARRERA = {
  summary: 'Resumen de la carrera.',
  topics: ['acoso'],
  textsCount: 1,
  analysisSource: 'open_text',
  acosoDetectado: true,
  mensajeAcoso: 'Hubo acoso en una respuesta.',
  acosoProfesores: [{ profesorId: '7', nombre: 'Ana Perez', menciones: 1, ejemplos: ['Hubo acoso'] }],
}

const RESUMEN_FACULTAD_CORTO = {
  summary: 'No hay comentarios suficientes en la facultad.',
  topics: [],
  textsCount: 0,
  analysisSource: 'open_text',
}

function responder(
  route: Route,
  url: URL,
  metodo: string,
  cuerpo: Record<string, unknown> | null,
  sesion: string,
  usuarios: UsuarioSimulado[],
) {
  const ruta = url.pathname

  if (ruta === '/api/auth/login' && metodo === 'POST') {
    const email = typeof cuerpo?.email === 'string' ? cuerpo.email : ''
    const clave = typeof cuerpo?.password === 'string' ? cuerpo.password : ''
    const cuenta = cuentas[email]
    if (!cuenta || clave !== CLAVE_VALIDA) return json(route, 401, { error: 'Credenciales inválidas' })
    const user = { ...cuenta, email }
    if (cuenta.roles.length > 1) {
      return json(route, 200, {
        message: 'Usuario con múltiples roles detectado',
        user: { ...user, multiple_roles: true },
        available_roles: cuenta.roles,
        requires_role_selection: true,
      })
    }
    return json(route, 200, { token: `token-simulado-${cuenta.id}`, user })
  }

  if (ruta === '/api/auth/login-with-role' && metodo === 'POST') {
    const email = typeof cuerpo?.email === 'string' ? cuerpo.email : ''
    const clave = typeof cuerpo?.password === 'string' ? cuerpo.password : ''
    const selectedRole = typeof cuerpo?.selectedRole === 'string' ? cuerpo.selectedRole : ''
    const cuenta = cuentas[email]
    if (!cuenta || clave !== CLAVE_VALIDA || !cuenta.roles.includes(selectedRole)) {
      return json(route, 401, { error: 'Credenciales inválidas' })
    }
    const dashboard =
      selectedRole === 'coordinador'
        ? '/dashboard-coordinador'
        : selectedRole === 'profesor' || selectedRole === 'docente'
          ? '/dashboard-profesor'
          : '/dashboard'
    return json(route, 200, {
      token: `token-simulado-${cuenta.id}-${selectedRole}`,
      user: {
        ...cuenta,
        email,
        selected_role: selectedRole,
        dashboard,
      },
    })
  }

  if (ruta === '/api/coordinador/dashboard-summary') {
    const busqueda = (url.searchParams.get('search') ?? '').toLowerCase()
    const teachers = resumenCoordinador.teachers.filter((d) => `${d.nombre} ${d.email}`.toLowerCase().includes(busqueda))
    return json(route, 200, { ...resumenCoordinador, teachers, pagination: { ...resumenCoordinador.pagination, total: teachers.length } })
  }

  if (ruta === '/api/coordinador/reports-overview') return json(route, 200, reportesCoordinador)

  if (ruta === '/api/users/academic-structure') return json(route, 200, { facultades: [] })

  if (ruta === '/api/teachers/student-stats') {
    return json(route, 200, {
      evaluacionesCompletadas: sesion === 'u-est' ? 1 : 0,
      evaluacionesPendientes: 0,
      materiasMatriculadas: sesion === 'u-est' ? 1 : 0,
      promedioGeneral: sesion === 'u-est' ? 4 : 0,
      progresoGeneral: 0,
    })
  }

  if (ruta === '/api/teachers/student-enrolled-subjects') {
    const materias = sesion === 'u-est' ? [MATERIA_DE_EVA] : []
    return json(route, 200, { materiasMatriculadas: materias, total: materias.length })
  }

  const qr = ruta.match(/^\/api\/qr-evaluaciones\/([^/]+)$/)
  if (qr && metodo === 'GET') {
    if (decodeURIComponent(qr[1]) === 'tok-14') return json(route, 200, QR_VALIDO)
    return json(route, 404, { error: 'QR inválido o expirado.' })
  }

  const inscripcion = ruta.match(/^\/api\/qr-evaluaciones\/([^/]+)\/auto-enroll$/)
  if (inscripcion && metodo === 'POST') {
    if (decodeURIComponent(inscripcion[1]) === 'tok-14') {
      return json(route, 201, { enrolled: true, created: true, grupoId: 63 })
    }
    return json(route, 404, { error: 'QR inválido o expirado.' })
  }

  if (ruta === '/api/teachers' && metodo === 'GET') return json(route, 200, [ANA])

  const grupos = ruta.match(/^\/api\/teachers\/([^/]+)\/courses\/([^/]+)\/groups$/)
  if (grupos && metodo === 'GET') {
    return json(route, 200, [{ id: 4, numero_grupo: 1, horario: 'Lun 8-10', aula: 'A-101', cup: 30 }])
  }

  if (ruta === '/api/teachers/student-info') return json(route, 200, { id: sesion, nombre: 'Eva' })

  if (ruta.startsWith('/api/teachers/evaluation-questions/')) {
    return json(route, 200, {
      questions: [
        {
          id: '1',
          category: 'Claridad Expositiva',
          question: 'El profesor explica claramente los conceptos del curso',
          type: 'rating',
        },
      ],
      courseName: 'Programación I',
      courseCode: 'SIS-101',
    })
  }

  if (ruta === '/api/teachers/evaluations' && metodo === 'POST') {
    if (cuerpo?.comments === 'repetida') {
      return json(route, 409, { error: 'Ya has evaluado a este profesor para este curso y grupo' })
    }
    return json(route, 200, { success: true, message: 'Evaluación guardada exitosamente', evaluationId: 'eval-1' })
  }

  if (ruta === '/api/teachers/teacher-id') return json(route, 200, { teacherId: '7' })

  if (ruta.endsWith('/stats/historical') || ruta === '/api/teachers/period-stats') {
    return json(route, 200, {
      totalEvaluaciones: 1,
      calificacionPromedio: 4.5,
      totalCursos: 1,
      evaluacionesPorCurso: [{ curso_id: '31', total: 1, promedio: 5 }],
      evaluacionesPorGrupo: [],
    })
  }

  if (ruta === '/api/teachers/period-category-stats') {
    return json(route, 200, [{ categoriaId: 1, nombre: 'Claridad', promedio: 4.5 }])
  }

  if (ruta === '/api/users' && metodo === 'GET') return json(route, 200, { users: usuarios })

  if (ruta === '/api/auth/create-user' && metodo === 'POST') {
    const email = String(cuerpo?.email ?? '')
    if (usuarios.some((usuario) => usuario.email === email)) {
      return json(route, 400, { error: 'El email ya está registrado' })
    }
    const nuevo: UsuarioSimulado = {
      id: 'u-nuevo',
      email,
      nombre: String(cuerpo?.nombre ?? ''),
      apellido: String(cuerpo?.apellido ?? ''),
      tipo_usuario: String(cuerpo?.tipo_usuario ?? 'estudiante'),
      activo: true,
      roles: [String(cuerpo?.tipo_usuario ?? 'estudiante')],
    }
    usuarios.push(nuevo)
    return json(route, 201, { message: 'Usuario creado exitosamente', user: { ...nuevo } })
  }

  const baja = ruta.match(/^\/api\/users\/([^/]+)$/)
  if (baja && metodo === 'DELETE') {
    if (decodeURIComponent(baja[1]) === sesion) {
      return json(route, 400, { error: 'No puedes desactivar tu propia cuenta' })
    }
    const usuario = usuarios.find((item) => item.id === decodeURIComponent(baja[1]))
    if (!usuario) return json(route, 404, { error: 'Usuario no encontrado' })
    usuario.activo = false
    return json(route, 200, { message: 'Usuario desactivado', user: { ...usuario } })
  }

  if (ruta === '/api/decano/reports-overview') return json(route, 200, reportesCoordinador)
  if (ruta === '/api/teachers/career-subjects') return json(route, 200, { carreras: [] })

  if (ruta === '/api/ai/summarize/by-professor') return json(route, 200, RESUMEN_DOCENTE)
  if (ruta === '/api/ai/summarize/by-career') return json(route, 200, RESUMEN_CARRERA)
  if (ruta === '/api/ai/summarize/by-faculty') return json(route, 200, RESUMEN_FACULTAD_CORTO)

  return json(route, 200, {})
}

export async function instalarBackSimulado(page: Page) {
  const peticiones: Peticion[] = []
  const usuarios = usuariosIniciales()
  peticionesPorPagina.set(page, peticiones)

  await page.route(esLlamadaAlBack, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const metodo = request.method()
    if (metodo === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })

    const cuerpo = (request.postDataJSON() ?? null) as Record<string, unknown> | null
    peticiones.push({ metodo, ruta: url.pathname, query: Object.fromEntries(url.searchParams), cuerpo })
    const autorizacion = request.headers().authorization ?? ''
    const sesion = autorizacion.replace(/^Bearer token-simulado-/, '')
    return responder(route, url, metodo, cuerpo, sesion, usuarios)
  })
}

export const peticionesDe = (page: Page): Peticion[] => peticionesPorPagina.get(page) ?? []

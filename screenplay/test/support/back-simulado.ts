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
  'eva.estudiante@soyudemedellin.edu.co': { id: 'u-est', nombre: 'Eva', apellido: 'Estudiante', tipo_usuario: 'estudiante', roles: ['estudiante'] },
  'lia.estudiante@soyudemedellin.edu.co': { id: 'u-lia', nombre: 'Lía', apellido: 'Nieto', tipo_usuario: 'estudiante', roles: ['estudiante'] },
  'ada.admin@udemedellin.edu.co': { id: 'u-ada', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin', roles: ['admin'] },
}

export type Peticion = { metodo: string; ruta: string; query: Record<string, string> }

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

function responder(route: Route, url: URL, metodo: string, cuerpo: Record<string, string> | null, sesion: string) {
  const ruta = url.pathname

  if (ruta === '/api/auth/login' && metodo === 'POST') {
    const cuenta = cuerpo ? cuentas[cuerpo.email] : undefined
    if (!cuenta || cuerpo?.password !== CLAVE_VALIDA) return json(route, 401, { error: 'Credenciales inválidas' })
    return json(route, 200, { token: `token-simulado-${cuenta.id}`, user: { ...cuenta, email: cuerpo!.email } })
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

  return json(route, 200, {})
}

export async function instalarBackSimulado(page: Page) {
  const peticiones: Peticion[] = []
  peticionesPorPagina.set(page, peticiones)

  await page.route(esLlamadaAlBack, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const metodo = request.method()
    if (metodo === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })

    peticiones.push({ metodo, ruta: url.pathname, query: Object.fromEntries(url.searchParams) })
    const autorizacion = request.headers().authorization ?? ''
    const sesion = autorizacion.replace(/^Bearer token-simulado-/, '')
    return responder(route, url, metodo, request.postDataJSON() ?? null, sesion)
  })
}

export const peticionesDe = (page: Page): Peticion[] => peticionesPorPagina.get(page) ?? []

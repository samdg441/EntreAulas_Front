import type { Page, Route } from 'playwright'

import resumenCoordinador from '../../../e2e/cypress/fixtures/dashboard-summary.json'
import reportesCoordinador from '../../../e2e/cypress/fixtures/reports-overview.json'

/**
 * Back simulado para los escenarios @web: respuestas fijas y deterministas, como la
 * aplicación local del repositorio de referencia. Reutiliza los fixtures de Cypress
 * (incluyen datos sucios: un promedio de 99 y un nombre que parece fórmula de Excel).
 */
export const CLAVE_VALIDA = 'Clave-Segura2026!'

export const cuentas: Record<string, { id: string; nombre: string; apellido: string; tipo_usuario: string; roles: string[] }> = {
  'carlos.coordinador@udemedellin.edu.co': { id: 'u-coord', nombre: 'Carlos', apellido: 'Coordinador', tipo_usuario: 'coordinador', roles: ['coordinador'] },
  'eva.estudiante@soyudemedellin.edu.co': { id: 'u-est', nombre: 'Eva', apellido: 'Estudiante', tipo_usuario: 'estudiante', roles: ['estudiante'] },
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

function responder(route: Route, url: URL, metodo: string, cuerpo: Record<string, string> | null) {
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
    return responder(route, url, metodo, request.postDataJSON() ?? null)
  })
}

export const peticionesDe = (page: Page): Peticion[] => peticionesPorPagina.get(page) ?? []

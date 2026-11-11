import { test as base, Page, Route } from '@playwright/test'

/**
 * Back simulado del coordinador para Playwright (page.route): dashboard, estadísticas de docentes,
 * ventanas de evaluación y auditoría con filtros y paginación, con las mismas reglas que el back real.
 */
export const COORDINADOR = {
  id: 'u-coord',
  email: 'david@udemedellin.edu.co',
  nombre: 'DAVID',
  apellido: 'COORDINADOR',
  tipo_usuario: 'coordinador',
  roles: ['coordinador'],
}

const DOCENTES = [
  { profesorId: 1, nombre: 'Ana María Pérez', email: 'ana.perez@udemedellin.edu.co', totalEvaluaciones: 42, promedio: 4.6 },
  { profesorId: 2, nombre: 'Carlos Restrepo', email: 'carlos.restrepo@udemedellin.edu.co', totalEvaluaciones: 31, promedio: 3.4 },
  { profesorId: 3, nombre: 'Luisa Fernanda Gómez', email: 'luisa.gomez@udemedellin.edu.co', totalEvaluaciones: 28, promedio: 4.1 },
  { profesorId: 4, nombre: 'Jorge Ríos', email: 'jorge.rios@udemedellin.edu.co', totalEvaluaciones: 0, promedio: 0 },
  { profesorId: 5, nombre: 'Marta Lucía Soto', email: 'marta.soto@udemedellin.edu.co', totalEvaluaciones: 19, promedio: 3.8 },
  { profesorId: 6, nombre: 'Esteban Cárdenas', email: 'esteban.cardenas@udemedellin.edu.co', totalEvaluaciones: 37, promedio: 4.8 },
]

const dia = (delta: number) => {
  const f = new Date()
  f.setDate(f.getDate() + delta)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

export const VENTANAS = [
  { periodoId: 11, ano: 2026, semestre: 2, fechaInicio: dia(-7), fechaFin: dia(11) },
  { periodoId: 12, ano: 2027, semestre: 1, fechaInicio: dia(120), fechaFin: dia(135) },
]

export type EventoMock = {
  id: number; actorId: string; actorNombre: string; actorRol: string; accion: string
  entidad: string; entidadId: string | null; detalle: string; creadoEn: string
}

const hace = (horas: number) => new Date(Date.now() - horas * 3_600_000).toISOString()

export const EVENTOS: EventoMock[] = Array.from({ length: 23 }, (_, i) => {
  const acciones = ['programar_encuesta', 'generar_qr', 'consultar_reportes', 'consultar_docente']
  const accion = acciones[i % 4]
  return {
    id: 100 - i,
    actorId: 'u-coord',
    actorNombre: i % 5 === 0 ? 'María Gómez' : 'David Coordinador',
    actorRol: 'coordinador',
    accion,
    entidad: accion === 'generar_qr' ? 'qr' : accion === 'programar_encuesta' ? 'periodo' : 'reporte',
    entidadId: null,
    detalle: accion === 'programar_encuesta' ? `Periodo 2026-2, del ${dia(-7)} al ${dia(11)}` : accion === 'generar_qr' ? `${3 + i} código(s) QR generados` : accion === 'consultar_docente' ? `Estadísticas del docente ${1 + (i % 6)}` : 'Reporte general del periodo 2026-2',
    creadoEn: hace(i * 7 + 1),
  }
})

export class BackCoordinador {
  llamadas: Array<{ metodo: string; ruta: string; query: string }> = []
  eventos: EventoMock[] = EVENTOS.map((e) => ({ ...e }))
  ventanas = VENTANAS.map((v) => ({ ...v }))
  auditoriaDisponible = true
  fallarDashboard = false

  async sesion(page: Page) {
    await page.addInitScript((u) => {
      localStorage.setItem('token', 'jwt-coordinador')
      localStorage.setItem('user', JSON.stringify({ ...u, selected_role: 'coordinador' }))
    }, COORDINADOR)
  }

  async instalar(page: Page) {
    const json = (route: Route, status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    await page.route(/^https?:\/\/(?!localhost:3001\/)[^/]+\/api\//, async (route) => {
      const req = route.request()
      const url = new URL(req.url())
      const ruta = url.pathname
      this.llamadas.push({ metodo: req.method(), ruta, query: url.search })

      if (ruta === '/api/coordinador/dashboard-summary') {
        if (this.fallarDashboard) return json(route, 500, { error: 'Error interno' })
        const search = (url.searchParams.get('search') || '').toLowerCase()
        const page_ = Number(url.searchParams.get('page') || 1)
        const size = Number(url.searchParams.get('pageSize') || 8)
        const filtrados = DOCENTES.filter((d) => `${d.nombre} ${d.email}`.toLowerCase().includes(search))
        return json(route, 200, {
          stats: { totalProfesores: DOCENTES.length, totalCursos: 18, promedioEvaluaciones: 4.12, profesoresEnRiesgo: 2, totalEvaluaciones: 157 },
          teachers: filtrados.slice((page_ - 1) * size, page_ * size),
          pagination: { page: page_, pageSize: size, total: filtrados.length, totalPages: Math.ceil(filtrados.length / size) },
        })
      }
      if (ruta.startsWith('/api/coordinador/profesor-stats/')) {
        const id = Number(ruta.split('/').pop())
        const d = DOCENTES.find((x) => x.profesorId === id)
        return json(route, 200, {
          summary: { totalEvaluaciones: d?.totalEvaluaciones ?? 0, promedio: d?.promedio ?? 0, estudiantesEvaluadores: Math.round((d?.totalEvaluaciones ?? 0) * 0.8), totalCursos: 3 },
          categories: [
            { categoriaId: 1, nombre: 'Dominio del tema', promedio: (d?.promedio ?? 0) + 0.2 },
            { categoriaId: 2, nombre: 'Metodología', promedio: (d?.promedio ?? 0) - 0.3 },
            { categoriaId: 3, nombre: 'Trato respetuoso', promedio: Math.min(5, (d?.promedio ?? 0) + 0.4) },
          ],
          courses: [
            { cursoId: 7, codigo: 'SIS101', nombre: 'Programación I', promedio: d?.promedio ?? 0, totalEvaluaciones: 20 },
            { cursoId: 8, codigo: 'SIS204', nombre: 'Bases de datos', promedio: (d?.promedio ?? 0) - 0.2, totalEvaluaciones: 11 },
          ],
        })
      }
      if (ruta === '/api/periodos/evaluacion') return json(route, 200, this.ventanas)
      if (ruta === '/api/coordinador/auditoria') {
        if (!this.auditoriaDisponible) {
          return json(route, 200, { disponible: false, aviso: 'Falta crear la tabla de auditoria', eventos: [], resumen: { total: 0, porAccion: {}, ultimoEvento: null }, pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } })
        }
        const q = url.searchParams
        const accion = q.get('accion')
        const desde = q.get('desde')
        const hasta = q.get('hasta')
        const search = (q.get('search') || '').toLowerCase()
        if (desde && hasta && desde > hasta) return json(route, 400, { error: 'La fecha "desde" no puede ser posterior a la fecha "hasta".' })
        const filtrados = this.eventos
          .filter((e) => (!accion || e.accion === accion) && (!desde || e.creadoEn >= `${desde}T00:00:00.000Z`) && (!hasta || e.creadoEn <= `${hasta}T23:59:59.999Z`) && (!search || `${e.actorNombre} ${e.detalle}`.toLowerCase().includes(search)))
          .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
        const porAccion: Record<string, number> = {}
        filtrados.forEach((e) => (porAccion[e.accion] = (porAccion[e.accion] ?? 0) + 1))
        const size = Math.min(50, Number(q.get('pageSize') || 10))
        const pagina = Number(q.get('page') || 1)
        return json(route, 200, {
          disponible: true,
          eventos: filtrados.slice((pagina - 1) * size, pagina * size),
          resumen: { total: filtrados.length, porAccion, ultimoEvento: filtrados[0]?.creadoEn ?? null },
          pagination: { page: pagina, pageSize: size, total: filtrados.length, totalPages: Math.ceil(filtrados.length / size) },
        })
      }
      return json(route, 200, [])
    })
  }
}

export const test = base.extend<{ back: BackCoordinador }>({
  back: async ({ page }, use) => {
    const back = new BackCoordinador()
    await back.instalar(page)
    await back.sesion(page)
    await use(back)
  },
})

export { expect } from '@playwright/test'

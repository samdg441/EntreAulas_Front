import { usuarios } from './commands'

/** Ventana de evaluación relativa a hoy, para que el calendario siempre tenga algo en el mes actual. */
const iso = (delta: number) => {
  const f = new Date()
  f.setDate(f.getDate() + delta)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}
export const ventanaActual = { periodoId: 11, ano: 2026, semestre: 2, fechaInicio: iso(-3), fechaFin: iso(5) }

/** Simula el back del coordinador (dashboard, estadísticas, calendario y auditoría) con cy.intercept. */
export function simularBackCoordinador(opciones: { auditoria?: unknown; auditoriaStatus?: number } = {}) {
  cy.simularBackVacio()
  registrarRutasCoordinador(opciones)
}

/** Solo las rutas del coordinador, sin el comodín: para los escenarios BDD que ya tienen su propio back simulado. */
export function registrarRutasCoordinador(opciones: { auditoria?: unknown; auditoriaStatus?: number } = {}) {
  cy.fixture('dashboard-summary.json').then((resumen) => {
    cy.intercept({ method: 'GET', pathname: '/api/coordinador/dashboard-summary' }, (req) => {
      const q = String(req.query.search ?? '').toLowerCase()
      const filtrados = resumen.teachers.filter((d: { nombre: string; email: string }) => `${d.nombre} ${d.email}`.toLowerCase().includes(q))
      // Respeta la paginación como el back real: la página 2 de 50 viene vacía (la gestión de profesores pide dos páginas).
      const pagina = Number(req.query.page ?? 1)
      const tamano = Number(req.query.pageSize ?? 8)
      const teachers = filtrados.slice((pagina - 1) * tamano, pagina * tamano)
      req.reply({ ...resumen, teachers, pagination: { ...resumen.pagination, page: pagina, pageSize: tamano, total: filtrados.length } })
    }).as('resumen')
  })
  cy.intercept({ method: 'GET', pathname: '/api/coordinador/profesor-stats/*' }, { fixture: 'rediseno/profesor-stats.json' }).as('stats')
  cy.intercept({ method: 'GET', pathname: '/api/periodos/evaluacion' }, [ventanaActual]).as('ventanas')
  cy.fixture('rediseno/auditoria.json').then((base) => {
    cy.intercept({ method: 'GET', pathname: '/api/coordinador/auditoria' }, (req) => {
      if (opciones.auditoriaStatus) return req.reply(opciones.auditoriaStatus, { error: 'fallo' })
      if (opciones.auditoria) return req.reply(opciones.auditoria as object)
      const accion = req.query.accion as string | undefined
      const eventos = accion ? base.eventos.filter((e: { accion: string }) => e.accion === accion) : base.eventos
      req.reply({ ...base, eventos, pagination: { ...base.pagination, total: eventos.length } })
    }).as('auditoria')
  })
}

export const coordinador = { ...usuarios.coordinador, selected_role: 'coordinador' }

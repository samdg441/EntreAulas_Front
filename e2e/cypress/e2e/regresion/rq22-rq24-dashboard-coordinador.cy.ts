import { usuarios } from '../../support/commands'

type Docente = { nombre: string; email: string }

/**
 * RQ22 (promedios visibles) y RQ24 (resumen y búsqueda de docentes) en el dashboard real.
 * El back se simula con un fixture que incluye datos sucios: un promedio de 99 y un docente sin evaluaciones.
 */
describe('RQ22 y RQ24 — Dashboard del coordinador (E2E)', () => {
  beforeEach(() => {
    cy.simularBackVacio()
    cy.fixture('dashboard-summary.json').then((resumen) => {
      cy.intercept({ method: 'GET', pathname: '/api/coordinador/dashboard-summary' }, (req) => {
        const q = String(req.query.search ?? '').toLowerCase()
        const teachers = resumen.teachers.filter((d: Docente) => `${d.nombre} ${d.email}`.toLowerCase().includes(q))
        req.reply({ ...resumen, teachers, pagination: { ...resumen.pagination, total: teachers.length } })
      }).as('resumen')
    })
    cy.visitarConSesion('/dashboard-coordinador', usuarios.coordinador)
    cy.wait('@resumen')
  })

  const filaDe = (nombre: string) => cy.contains('td', nombre).parent('tr')
  const buscador = () => cy.get('input[placeholder="Buscar por nombre o correo..."]')
  // En desarrollo React StrictMode duplica la petición inicial: se mira la última, no "la siguiente".
  const ultimaConsulta = () =>
    cy.get('@resumen.all').then((llamadas: any) => llamadas.at(-1).request.query as Record<string, string>)

  it('RQ22: el promedio general y el de cada docente se ven con dos decimales', () => {
    cy.contains('Promedio General').parents('[class*="shadow-md"]').first().should('contain', '4.5')
    filaDe('Ana Pérez').should('contain', '4.50')
  })

  it('Regresión RQ22: un promedio corrupto (99) se pinta como 0.00, nunca como 99', () => {
    filaDe('Luis Gómez').should('contain', '0.00').and('not.contain', '99')
  })

  it('Regresión RQ22: un docente sin evaluaciones muestra "Sin datos" y no 0.00', () => {
    filaDe('Pedro Ruiz').should('contain', 'Sin datos')
  })

  it('RQ22: un promedio menor a 4.0 queda resaltado en rojo', () => {
    filaDe('Marta Díaz').should('have.class', 'bg-red-50')
    filaDe('Ana Pérez').should('not.have.class', 'bg-red-50')
  })

  it('RQ24: la búsqueda viaja recortada, vuelve a la página 1 y filtra la tabla', () => {
    buscador().type('  ana  ')

    cy.get('tbody tr').should('have.length', 1)
    filaDe('Ana Pérez').should('be.visible')
    cy.contains('Mostrando 1 - 1 de 1').should('be.visible')
    ultimaConsulta().should('include', { search: 'ana', page: '1' })
  })

  it('Regresión RQ24: al borrar la búsqueda vuelven todos los docentes', () => {
    buscador().type('ana')
    cy.get('tbody tr').should('have.length', 1)
    buscador().clear()

    cy.get('tbody tr').should('have.length', 4)
    ultimaConsulta().should('not.have.property', 'search')
  })

  it('Regresión RQ24: un texto con <script> no ejecuta nada y muestra la lista vacía', () => {
    const alerta = cy.stub().as('alerta')
    cy.on('window:alert', alerta)

    buscador().type('<script>alert(1)</script>')

    cy.contains('No se encontraron docentes para el filtro actual.').should('be.visible')
    cy.get('@alerta').should('not.have.been.called')
  })
})

describe('RQ24 — Dashboard del coordinador cuando el back falla (E2E)', () => {
  it('un 500 deja la pantalla usable, con métricas en 0 y sin datos viejos', () => {
    cy.simularBackVacio()
    cy.intercept({ pathname: '/api/coordinador/dashboard-summary' }, { statusCode: 500, body: { error: 'fallo' } }).as('resumen')

    cy.visitarConSesion('/dashboard-coordinador', usuarios.coordinador)

    cy.wait('@resumen')
    cy.contains('No se encontraron docentes para el filtro actual.').should('be.visible')
    cy.contains('Mostrando 0 - 0 de 0').should('be.visible')
  })
})

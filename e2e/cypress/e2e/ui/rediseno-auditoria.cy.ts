import { usuarios } from '../../support/commands'
import { coordinador, simularBackCoordinador } from '../../support/rediseno'

/** Requisito 1 — Vista de auditoría del coordinador. */
describe('Rediseño — Vista de auditoría (UI)', () => {
  const abrir = (opciones = {}) => {
    simularBackCoordinador(opciones)
    cy.visitarConSesion('/auditoria', coordinador)
  }

  context('escenarios exitosos', () => {
    beforeEach(() => {
      abrir()
      cy.wait('@auditoria')
    })

    it('lista los eventos con fecha, persona, acción y detalle', () => {
      cy.get('table tbody tr').should('have.length', 4)
      cy.get('table tbody tr').first().should('contain', 'Programó una encuesta').and('contain', 'David Coordinador').and('contain', 'Periodo 2026-2')
    })

    it('el resumen indica el total y cuántos eventos hay por acción', () => {
      cy.get('section[aria-label="Eventos por acción"]').within(() => {
        cy.contains('Eventos registrados').parent().should('contain', '4')
        cy.contains('Generó códigos QR').parent().should('contain', '1')
      })
    })

    it('filtrar por acción pide ese filtro al servidor y reduce la tabla', () => {
      cy.get('#au-accion').select('Generó códigos QR')

      // React StrictMode duplica la petición inicial: se mira la última.
      cy.get('@auditoria.all').should((llamadas: unknown) => {
        const lista = llamadas as Array<{ request: { query: Record<string, string> } }>
        expect(lista.at(-1)!.request.query).to.include({ accion: 'generar_qr', page: '1' })
      })
      cy.get('table tbody tr').should('have.length', 1).and('contain', 'María Gómez')
    })

    it('exporta un CSV con los eventos visibles y neutraliza las fórmulas', () => {
      cy.task('limpiarDescargas', null, { log: false })
      cy.contains('button', 'Exportar CSV').click()

      const hoy = new Date().toISOString().slice(0, 10)
      cy.readFile(`cypress/downloads/auditoria-${hoy}.csv`, { timeout: 15_000 }).then((csv: string) => {
        expect(csv).to.contain('Fecha y hora,Persona,Rol,Acción,Detalle')
        expect(csv).to.contain('Programó una encuesta')
        expect(csv).to.contain("'=HYPERLINK")
        expect(csv).not.to.match(/,=HYPERLINK/)
      })
    })
  })

  context('escenarios alternativos', () => {
    it('un rango de fechas invertido avisa y no consulta al servidor', () => {
      abrir()
      cy.wait('@auditoria')

      cy.get('#au-desde').type('2026-11-20')
      cy.get('#au-hasta').type('2026-11-01')

      cy.get('[role="alert"]').should('contain', 'La fecha inicial no puede ser posterior a la final.')
      cy.get('#au-desde').should('have.attr', 'aria-invalid', 'true')
    })

    it('"Limpiar filtros" restablece la acción elegida', () => {
      abrir()
      cy.wait('@auditoria')
      cy.get('#au-accion').select('Consultó reportes')

      cy.contains('button', 'Limpiar filtros').click()

      cy.get('#au-accion').should('have.value', 'todas')
    })

    it('en inglés toda la vista cambia de idioma', () => {
      abrir()
      cy.wait('@auditoria')

      cy.get('button[aria-label="Preferencias de visualización"]').click()
      cy.contains('[role="radio"]', 'Inglés').click()

      cy.contains('h1', 'Degree audit log').should('be.visible')
      cy.contains('Scheduled a survey').should('be.visible')
      cy.contains('button', 'Export CSV').should('be.visible')
    })
  })

  context('escenarios de error', () => {
    it('sin eventos muestra un estado vacío que explica cuándo aparecen', () => {
      abrir({ auditoria: { disponible: true, eventos: [], resumen: { total: 0, porAccion: {}, ultimoEvento: null }, pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })
      cy.wait('@auditoria')

      cy.contains('No hay eventos con esos filtros.').should('be.visible')
      cy.contains('button', 'Exportar CSV').should('be.disabled')
    })

    it('si la tabla de auditoría aún no existe lo explica en lugar de mostrar una tabla vacía', () => {
      abrir({ auditoria: { disponible: false, aviso: 'Falta crear la tabla', eventos: [], resumen: { total: 0, porAccion: {}, ultimoEvento: null }, pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })
      cy.wait('@auditoria')

      cy.contains('h2', 'La auditoría aún no está activa').should('be.visible')
      cy.get('table').should('not.exist')
    })

    it('un error 500 se anuncia con role="alert"', () => {
      abrir({ auditoriaStatus: 500 })
      cy.wait('@auditoria')

      cy.get('[role="alert"]').should('contain', 'No pudimos cargar la auditoría.')
    })

    it('solo el coordinador entra: un estudiante es enviado a /forbidden', () => {
      cy.simularBackVacio()
      cy.visitarConSesion('/auditoria', { ...usuarios.estudiante, selected_role: 'estudiante' })

      cy.location('pathname').should('eq', '/forbidden')
    })
  })
})

import { isPresent } from '@serenity-js/assertions'
import { Task, Wait } from '@serenity-js/core'
import { Clear, Enter, Scroll, Select, isVisible } from '@serenity-js/web'

import { DescargarAlPulsar } from '../interactions/NavegadorPlaywright'
import { PaginaReportes } from '../ui/PaginaReportes'
import { PanelCoordinador } from '../ui/PanelCoordinador'

export const BuscarDocente = {
  llamado: (texto: string) =>
    Task.where(`#actor busca el docente "${texto}"`,
      Clear.theValueOf(PanelCoordinador.buscador()),
      Enter.theValue(texto).into(PanelCoordinador.buscador()),
    ),
  borrarBusqueda: () => Task.where('#actor borra la búsqueda', Clear.theValueOf(PanelCoordinador.buscador())),
}

export const CambiarPeriodo = {
  a: (periodo: string) => Task.where(`#actor cambia el periodo a ${periodo}`, Select.value(periodo).from(PaginaReportes.periodo())),
}

export const ExportarDatosExcel = () =>
  Task.where('#actor exporta los datos del reporte a Excel',
    Wait.until(PaginaReportes.datosExcel(), isPresent()),
    // isVisible() exige que el elemento esté dentro del viewport y el botón queda al final de la página.
    Scroll.to(PaginaReportes.datosExcel()),
    Wait.until(PaginaReportes.datosExcel(), isVisible()),
    DescargarAlPulsar(PaginaReportes.datosExcel()),
  )

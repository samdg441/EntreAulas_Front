import { notes } from '@serenity-js/core'
import { By, Page, PageElement, Text } from '@serenity-js/web'

import type { NotasDelActor } from '../interactions/NavegadorPlaywright'
import { FormularioLogin } from '../ui/FormularioLogin'
import { PanelCoordinador } from '../ui/PanelCoordinador'

export const Pantalla = {
  rutaActual: () => Page.current().url().pathname.describedAs('la ruta actual'),
  textoDelLogin: () => Text.of(FormularioLogin.formulario()).describedAs('el texto del formulario de login'),
  textoDeLaPagina: () => Text.of(PageElement.located(By.css('body')).describedAs('la página')).describedAs('el texto de la página'),
  textoDeLaTabla: () => Text.of(PanelCoordinador.tabla()).describedAs('el texto de la tabla de docentes'),
  docentesVisibles: () => Text.ofAll(PanelCoordinador.nombresDocentes()).describedAs('los docentes visibles'),
  promedioDe: (docente: string) => Text.of(PanelCoordinador.promedioDe(docente)),
  archivoDescargado: () => notes<NotasDelActor>().get('archivoDescargado').describedAs('el archivo descargado'),
}

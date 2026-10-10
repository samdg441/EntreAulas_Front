import { Task } from '@serenity-js/core'
import { Navigate } from '@serenity-js/web'

import { UsarElBackSimulado } from '../interactions/NavegadorPlaywright'

export const AbrirEntreAulas = {
  en: (ruta: string) => Task.where(`#actor abre EntreAulas en ${ruta}`, UsarElBackSimulado(), Navigate.to(ruta)),
  /** Recarga completa: la sesión debe sobrevivir porque vive en localStorage. */
  recargandoEn: (ruta: string) => Task.where(`#actor abre directamente ${ruta}`, Navigate.to(ruta)),
}

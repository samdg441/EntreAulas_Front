import { Answerable, Task } from '@serenity-js/core'
import { Navigate } from '@serenity-js/web'

import { LimpiarSesionDelNavegador } from '../interactions/Navegador'

export const AbrirEntreAulas = {
  en: (ruta: Answerable<string>) => Task.where(`#actor abre EntreAulas`, Navigate.to(ruta)),
  sinSesionEn: (ruta: Answerable<string>) =>
    Task.where(`#actor abre EntreAulas sin sesión previa`,
      Navigate.to('/login'),
      LimpiarSesionDelNavegador(),
      Navigate.to(ruta),
    ),
}

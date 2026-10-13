import { Duration, Task, Wait } from '@serenity-js/core'
import { Click, Enter, isVisible } from '@serenity-js/web'

import { SeleccionDeDocente as Sel } from '../ui/SeleccionDeDocente'

export const AbrirEvaluacion = {
  nueva: () =>
    Task.where(`#actor abre una nueva evaluación`,
      Wait.upTo(Duration.ofSeconds(15)).until(Sel.nuevaEvaluacion(), isVisible()),
      Click.on(Sel.nuevaEvaluacion()),
    ),
}

export const BuscarDocente = {
  llamado: (texto: string) =>
    Task.where(`#actor busca el docente "${texto}"`,
      Wait.upTo(Duration.ofSeconds(15)).until(Sel.buscar(), isVisible()),
      Enter.theValue(texto).into(Sel.buscar()),
    ),
}

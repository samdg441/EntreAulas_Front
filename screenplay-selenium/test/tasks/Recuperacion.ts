import { Duration, Masked, Task, Wait } from '@serenity-js/core'
import { Click, Enter, isVisible } from '@serenity-js/web'

import { FormularioRecuperacion as Form } from '../ui/FormularioRecuperacion'

export const SolicitarRecuperacion = {
  para: (correo: string) =>
    Task.where(`#actor solicita recuperar la contraseña de "${correo}"`,
      Wait.upTo(Duration.ofSeconds(10)).until(Form.correo(), isVisible()),
      Enter.theValue(correo).into(Form.correo()),
      Click.on(Form.enviarEnlace()),
    ),
}

export const RestablecerClave = {
  con: (nueva: string, confirmacion: string) =>
    Task.where(`#actor restablece su contraseña`,
      Wait.upTo(Duration.ofSeconds(10)).until(Form.nuevaClave(), isVisible()),
      Enter.theValue(Masked.valueOf(nueva)).into(Form.nuevaClave()),
      Enter.theValue(Masked.valueOf(confirmacion)).into(Form.confirmarClave()),
      Click.on(Form.actualizar()),
    ),
}

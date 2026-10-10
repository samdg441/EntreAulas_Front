import { Masked, Task } from '@serenity-js/core'
import { Click, Enter } from '@serenity-js/web'

import { FormularioLogin } from '../ui/FormularioLogin'

export const ElegirTipoDeUsuario = {
  llamado: (etiqueta: string) =>
    Task.where(`#actor elige el tipo de usuario "${etiqueta}"`,
      Click.on(FormularioLogin.selectorTipo()),
      Click.on(FormularioLogin.opcionTipo(etiqueta)),
    ),
}

export const EscribirCorreo = {
  valor: (correo: string) => Task.where(`#actor escribe el correo "${correo}"`, Enter.theValue(correo).into(FormularioLogin.correo())),
}

export const IniciarSesion = {
  como: (tipo: string, correo: string, clave: string) =>
    Task.where(`#actor inicia sesión como ${tipo} con ${correo}`,
      ElegirTipoDeUsuario.llamado(tipo),
      EscribirCorreo.valor(correo),
      Enter.theValue(Masked.valueOf(clave)).into(FormularioLogin.clave()),
      Click.on(FormularioLogin.ingresar()),
    ),
}

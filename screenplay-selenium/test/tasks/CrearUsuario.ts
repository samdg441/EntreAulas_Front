import { Duration, Masked, Task, Wait } from '@serenity-js/core'
import { isFalse, isTrue } from '@serenity-js/assertions'
import { Click, Enter, isVisible, Select } from '@serenity-js/web'

import { FormularioCrearUsuario as Form } from '../ui/FormularioCrearUsuario'

export interface DatosDeUsuario {
  nombre: string
  apellido: string
  correoLocal: string
  clave: string
  tipo: string
}

export const CrearUsuario = {
  conDatos: (u: DatosDeUsuario) =>
    Task.where(`#actor crea el usuario ${u.correoLocal} (${u.tipo})`,
      Wait.upTo(Duration.ofSeconds(10)).until(Form.agregarUsuario(), isVisible()),
      Click.on(Form.agregarUsuario()),
      Wait.upTo(Duration.ofSeconds(10)).until(Form.tipoUsuario(), isVisible()),
      Select.option(u.tipo).from(Form.tipoUsuario()),
      Enter.theValue(u.nombre).into(Form.nombre()),
      Enter.theValue(u.apellido).into(Form.apellido()),
      Enter.theValue(u.correoLocal).into(Form.correoLocal()),
      Enter.theValue(Masked.valueOf(u.clave)).into(Form.clave()),
      Click.on(Form.crear()),
    ),
}

export const BuscarUsuario = {
  llamado: (texto: string) =>
    Task.where(`#actor busca "${texto}" en la lista de usuarios`,
      Wait.upTo(Duration.ofSeconds(30)).until(Form.crear().isPresent(), isFalse()),
      Wait.upTo(Duration.ofSeconds(30)).until(Form.buscar().isPresent(), isTrue()),
      Enter.theValue(texto).into(Form.buscar())),
}

export const CerrarFormularioDeUsuario = () =>
  Task.where(`#actor cierra el formulario de usuario sin guardar`, Click.on(Form.cancelar()))

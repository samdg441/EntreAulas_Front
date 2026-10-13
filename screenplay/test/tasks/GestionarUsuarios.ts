import { Task } from '@serenity-js/core'
import { Clear, Enter } from '@serenity-js/web'

import { AgregarUsuario, CambiarNombre, DesactivarUsuario } from '../interactions/Usuarios'
import { FormularioUsuarios } from '../ui/FormularioUsuarios'

export const CrearUsuario = {
  llamado: (nombre: string, apellido: string, correo: string) =>
    Task.where(`#actor agrega el usuario ${nombre} ${apellido}`, AgregarUsuario(nombre, apellido, correo)),
  conClave: (nombre: string, apellido: string, correo: string, clave: string) =>
    Task.where(`#actor intenta agregar a ${nombre} con una clave débil`, AgregarUsuario(nombre, apellido, correo, clave)),
}

export const BuscarUsuario = {
  llamado: (texto: string) =>
    Task.where(`#actor busca el usuario "${texto}"`,
      Clear.theValueOf(FormularioUsuarios.buscar()),
      Enter.theValue(texto).into(FormularioUsuarios.buscar()),
    ),
}

export const EditarUsuario = {
  nombreDe: (textoFila: string, nombre: string) =>
    Task.where(`#actor actualiza el nombre de ${textoFila}`, CambiarNombre(textoFila, nombre)),
}

export const Desactivar = {
  a: (textoFila: string) => Task.where(`#actor desactiva a ${textoFila}`, DesactivarUsuario(textoFila)),
}

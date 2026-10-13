import { notes, Task } from '@serenity-js/core'

import { LlamarAlBack, NotasDelActor } from '../interactions/LlamarAlBack'
import { Respuesta } from '../questions/Respuesta'
import { CUENTAS } from '../support/entorno'

const cuentas = CUENTAS

export const PrepararPorApi = {
  sesionDe: (clave: keyof typeof CUENTAS) =>
    Task.where(`#actor inicia sesión por API como ${clave}`,
      LlamarAlBack.sinSesion('POST', `inicia sesión (API) como ${clave}`, '/api/auth/login', {
        email: cuentas[clave].correo,
        password: cuentas[clave].clave,
      }),
      notes<NotasDelActor>().set('token', Respuesta.campo('token')),
      notes<NotasDelActor>().set('idDeSesion', Respuesta.campo('user.id')),
    ),

  sesionDeAdministrador: () =>
    Task.where(`#actor obtiene un token de administrador`,
      LlamarAlBack.post('inicia sesión (API)', '/api/auth/login', { email: CUENTAS.admin.correo, password: CUENTAS.admin.clave }),
      notes<NotasDelActor>().set('tokenAdmin', Respuesta.campo('token')),
    ),

  usuarioNuevo: (correo: string, clave: string) =>
    Task.where(`#actor registra por API al usuario ${correo}`,
      PrepararPorApi.sesionDeAdministrador(),
      LlamarAlBack.post('crea el usuario (API)', '/api/auth/create-user',
        { email: correo, password: clave, nombre: 'PRUEBA', apellido: 'E2E', tipo_usuario: 'estudiante' }, true),
    ),
}

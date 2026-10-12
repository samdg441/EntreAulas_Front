import { notes, Task } from '@serenity-js/core'

import { LlamarAlBack, NotasDelActor } from '../interactions/LlamarAlBack'
import { Respuesta } from '../questions/Respuesta'
import { CUENTAS } from '../support/entorno'

export const PrepararPorApi = {
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

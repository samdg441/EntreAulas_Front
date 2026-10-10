import { Task } from '@serenity-js/core'
import { GetRequest, PostRequest, Send } from '@serenity-js/rest'

import { tokenCoordinador } from '../support/entorno'

export const ConsultarApi = {
  sinToken: (ruta: string) => Task.where(`#actor consulta ${ruta} sin token`, Send.a(GetRequest.to(ruta))),

  comoCoordinador: (ruta: string) =>
    Task.where(`#actor consulta ${ruta} con su sesión de coordinador`,
      Send.a(GetRequest.to(ruta).using({ headers: { Authorization: `Bearer ${tokenCoordinador()}` } })),
    ),

  iniciarSesion: (correo: string, clave: string) =>
    Task.where(`#actor intenta iniciar sesión con ${correo}`,
      Send.a(PostRequest.to('/api/auth/login').with({ email: correo, password: clave })),
    ),
}

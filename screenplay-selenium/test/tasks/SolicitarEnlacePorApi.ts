import { notes, Task } from '@serenity-js/core'

import { LlamarAlBack, NotasDelActor } from '../interactions/LlamarAlBack'
import { Respuesta } from '../questions/Respuesta'

export const SolicitarEnlaceDeRecuperacionPorApi = {
  para: (correo: string) =>
    Task.where(`#actor pide por API el enlace de recuperación de ${correo}`,
      LlamarAlBack.post('solicita la recuperación (API)', '/api/auth/forgot-password', { email: correo }),
      notes<NotasDelActor>().set('enlaceDeRecuperacion', Respuesta.campo('resetLink')),
      notes<NotasDelActor>().set('tokenDeRecuperacion', Respuesta.campo('resetToken')),
    ),
}

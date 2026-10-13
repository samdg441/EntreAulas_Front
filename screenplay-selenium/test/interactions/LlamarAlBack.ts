import { Interaction, notes } from '@serenity-js/core'
import { CallAnApi } from '@serenity-js/rest'

export interface NotasDelActor {
  respuesta: { status: number; data: any }
  tokenAdmin: string
  token: string
  idDeSesion: string
  idCreado: string
  enlaceDeRecuperacion: string
  tokenDeRecuperacion: string
  correoCreado: string
  tokenAnterior: string
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE'

type ActorDeInteraccion = Parameters<Parameters<typeof Interaction.where>[1]>[0]

async function pedir(actor: ActorDeInteraccion, metodo: Metodo, url: string, datos: object | undefined, token: string | undefined) {
  const respuesta = await CallAnApi.as(actor).request({
    method: metodo,
    url,
    ...(datos !== undefined ? { data: datos } : {}),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  await notes<NotasDelActor>().set('respuesta', { status: respuesta.status, data: respuesta.data }).performAs(actor)
}

export const LlamarAlBack = {
  post: (descripcion: string, url: string, datos: object, conTokenDeAdmin = false) =>
    Interaction.where(`#actor ${descripcion}`, async actor => {
      const token = conTokenDeAdmin ? await actor.answer(notes<NotasDelActor>().get('tokenAdmin')) : undefined
      await pedir(actor, 'POST', url, datos, token)
    }),

  sinSesion: (metodo: Metodo, descripcion: string, url: string, datos?: object) =>
    Interaction.where(`#actor ${descripcion}`, async actor => {
      await pedir(actor, metodo, url, datos, undefined)
    }),

  conSesion: (metodo: Metodo, descripcion: string, url: string, datos?: object) =>
    Interaction.where(`#actor ${descripcion}`, async actor => {
      const token = await actor.answer(notes<NotasDelActor>().get('token'))
      await pedir(actor, metodo, url, datos, token)
    }),
}

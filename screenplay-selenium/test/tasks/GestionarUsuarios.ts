import { notes, Task, Wait, Duration } from '@serenity-js/core'
import { Click, Enter, isVisible } from '@serenity-js/web'
import { isFalse } from '@serenity-js/assertions'

import { LlamarAlBack, NotasDelActor } from '../interactions/LlamarAlBack'
import { Respuesta } from '../questions/Respuesta'
import { PrepararPorApi } from './PreparacionPorApi'
import { FormularioCrearUsuario as Form } from '../ui/FormularioCrearUsuario'
import { correoUnico } from '../support/entorno'

export const RegistrarDocentePorApi = {
  conClave: (clave: string) => {
    const correo = correoUnico('e2e.rq29', 'udemedellin.edu.co')
    return Task.where(`#actor registra por API al docente ${correo}`,
      notes<NotasDelActor>().set('correoCreado', correo),
      PrepararPorApi.sesionDeAdministrador(),
      LlamarAlBack.post('crea el docente (API)', '/api/auth/create-user', {
        email: correo,
        password: clave,
        nombre: 'PEDRO',
        apellido: 'DOCENTE',
        tipo_usuario: 'profesor',
      }, true),
    )
  },
}

export const AltaDeEstudiantePorApi = {
  conClave: (correo: string, clave: string) =>
    Task.where(`#actor crea por API al estudiante ${correo}`,
      LlamarAlBack.conSesion('POST', 'crea el estudiante (API)', '/api/auth/create-user', {
        email: correo,
        password: clave,
        nombre: 'Luis',
        apellido: 'Gomez',
        tipo_usuario: 'estudiante',
      }),
      notes<NotasDelActor>().set('idCreado', Respuesta.campo('user.id')),
    ),
}

export const CambiarNombre = {
  delCorreo: (correo: string, nombre: string) =>
    Task.where(`#actor cambia el nombre de ${correo} a ${nombre}`,
      Wait.upTo(Duration.ofSeconds(15)).until(Form.editarEn(correo), isVisible()),
      Click.on(Form.editarEn(correo)),
      Wait.upTo(Duration.ofSeconds(10)).until(Form.actualizar(), isVisible()),
      Enter.theValue(nombre).into(Form.nombre()),
      Click.on(Form.actualizar()),
      Wait.upTo(Duration.ofSeconds(15)).until(Form.actualizar().isPresent(), isFalse()),
    ),
}

export const DesactivarUsuario = {
  conCorreo: (correo: string) =>
    Task.where(`#actor desactiva a ${correo}`,
      Wait.upTo(Duration.ofSeconds(15)).until(Form.desactivarEn(correo), isVisible()),
      Click.on(Form.desactivarEn(correo)),
      Wait.upTo(Duration.ofSeconds(10)).until(Form.confirmarDesactivar(), isVisible()),
      Click.on(Form.confirmarDesactivar()),
    ),
}

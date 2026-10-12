import { Then } from '@cucumber/cucumber'
import { Ensure, includes, isTrue, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight, notes } from '@serenity-js/core'

import type { NotasDelActor } from '../../test/interactions/LlamarAlBack'
import { Pantalla } from '../../test/questions/Pantalla'
import { BuscarUsuario, CerrarFormularioDeUsuario, CrearUsuario } from '../../test/tasks/CrearUsuario'
import { PrepararPorApi } from '../../test/tasks/PreparacionPorApi'
import { correoUnico } from '../../test/support/entorno'
import { paso } from '../support/pasos'

const parteLocal = (correo: string) => correo.split('@')[0]
const correoGuardado = () => notes<NotasDelActor>().get('correoCreado')
const dominioDe = (tipo: string) => (tipo === 'estudiante' ? 'soyudemedellin.edu.co' : 'udemedellin.edu.co')

paso('{quien} crea un usuario {string} nuevo con la clave {string}', async (actor: Actor, tipo: string, clave: string) => {
  const correo = correoUnico('e2e.rq1', dominioDe(tipo))
  await actor.attemptsTo(
    notes<NotasDelActor>().set('correoCreado', correo),
    CrearUsuario.conDatos({ nombre: 'Prueba', apellido: 'Automatizada', correoLocal: parteLocal(correo), clave, tipo }),
  )
})

paso('existe el usuario {string} registrado por API', async (_tipo: string) => {
  const actor = actorInTheSpotlight()
  const correo = correoUnico('e2e.rq1.dup')
  await actor.attemptsTo(
    notes<NotasDelActor>().set('correoCreado', correo),
    PrepararPorApi.usuarioNuevo(correo, 'Clave#2026'),
  )
})

paso('{quien} crea un usuario con el mismo correo y la clave {string}', async (actor: Actor, clave: string) => {
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(
    CrearUsuario.conDatos({ nombre: 'Repetido', apellido: 'Automatizada', correoLocal: parteLocal(correo), clave, tipo: 'estudiante' }),
  )
})

paso('{quien} busca al usuario creado', async (actor: Actor) => {
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(BuscarUsuario.llamado(parteLocal(correo)))
})

Then('la lista de usuarios muestra al usuario creado', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.tablaDeUsuarios(), includes(correoGuardado())))
})

Then('el usuario creado no existe en la lista', async () => {
  const actor = actorInTheSpotlight()
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(
    CerrarFormularioDeUsuario(),
    BuscarUsuario.llamado(parteLocal(correo)),
    Ensure.that(Pantalla.tablaDeUsuarios(), not(includes(correo))),
  )
})

Then('el formulario de usuario muestra el error {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.errorDelFormularioDeUsuario(), includes(texto)))
})

Then('el formulario de creación sigue abierto', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Pantalla.formularioDeUsuarioAbierto(), isTrue()))
})


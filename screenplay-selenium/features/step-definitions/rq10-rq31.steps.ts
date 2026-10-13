import { Then } from '@cucumber/cucumber'
import { Ensure, equals, includes, isFalse, isTrue, matches, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight, notes, Question } from '@serenity-js/core'
import { Text } from '@serenity-js/web'

import { LlamarAlBack, NotasDelActor } from '../../test/interactions/LlamarAlBack'
import { Estadisticas } from '../../test/ui/Estadisticas'
import { FormularioCrearUsuario } from '../../test/ui/FormularioCrearUsuario'
import { PantallaDeTexto } from '../../test/ui/PantallaDeTexto'
import { Respuesta } from '../../test/questions/Respuesta'
import { AbrirEvaluacion, BuscarDocente } from '../../test/tasks/AbrirEvaluacion'
import { BuscarUsuario } from '../../test/tasks/CrearUsuario'
import {
  AltaDeEstudiantePorApi,
  CambiarNombre,
  DesactivarUsuario,
  RegistrarDocentePorApi,
} from '../../test/tasks/GestionarUsuarios'
import { IniciarSesion } from '../../test/tasks/IniciarSesion'
import { PrepararPorApi } from '../../test/tasks/PreparacionPorApi'
import { Pantalla } from '../../test/questions/Pantalla'
import { cuerpoEvaluacion, cuerpoEvaluacionInvalido } from '../../test/support/cuerpo-evaluacion'
import { correoUnico, CUENTAS } from '../../test/support/entorno'
import { paso } from '../support/pasos'

const correoGuardado = () => notes<NotasDelActor>().get('correoCreado')
const idCreado = () => notes<NotasDelActor>().get('idCreado')
const idDeSesion = () => notes<NotasDelActor>().get('idDeSesion')

const cuenta = (clave: string) => {
  if (!(clave in CUENTAS)) {
    throw new Error(`Cuenta desconocida "${clave}". Opciones: ${Object.keys(CUENTAS).join(', ')}`)
  }
  return clave as keyof typeof CUENTAS
}

paso('{quien} inicia sesión por API con la cuenta {string}', async (actor: Actor, clave: string) => {
  await actor.attemptsTo(PrepararPorApi.sesionDe(cuenta(clave)))
})

paso('{quien} consulta {string} sin token', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(LlamarAlBack.sinSesion('GET', `consulta ${ruta} sin token`, ruta))
})

paso('{quien} consulta {string} con su sesión', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(LlamarAlBack.conSesion('GET', `consulta ${ruta}`, ruta))
})

paso('{quien} envía una evaluación sin token', async (actor: Actor) => {
  await actor.attemptsTo(LlamarAlBack.sinSesion('POST', 'envía una evaluación sin token', '/api/teachers/evaluations', cuerpoEvaluacion))
})

paso('{quien} envía una evaluación con su sesión', async (actor: Actor) => {
  await actor.attemptsTo(LlamarAlBack.conSesion('POST', 'envía una evaluación', '/api/teachers/evaluations', cuerpoEvaluacion))
})

paso('{quien} envía una evaluación con un identificador inválido', async (actor: Actor) => {
  await actor.attemptsTo(
    LlamarAlBack.conSesion('POST', 'envía una evaluación con un identificador inválido', '/api/teachers/evaluations', cuerpoEvaluacionInvalido),
  )
})

paso('{quien} crea por API un estudiante con la clave {string}', async (actor: Actor, clave: string) => {
  const correo = correoUnico('e2e.rq13')
  await actor.attemptsTo(
    notes<NotasDelActor>().set('correoCreado', correo),
    AltaDeEstudiantePorApi.conClave(correo, clave),
  )
})

paso('{quien} vuelve a crear por API ese estudiante con la clave {string}', async (actor: Actor, clave: string) => {
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(AltaDeEstudiantePorApi.conClave(correo, clave))
})

paso('{quien} intenta crear por API un estudiante sin token con la clave {string}', async (actor: Actor, clave: string) => {
  const correo = correoUnico('e2e.rq13.anon')
  await actor.attemptsTo(LlamarAlBack.sinSesion('POST', 'crea un estudiante sin token', '/api/auth/create-user', {
    email: correo,
    password: clave,
    nombre: 'Luis',
    apellido: 'Gomez',
    tipo_usuario: 'estudiante',
  }))
})

paso('{quien} intenta crear por API un estudiante con la clave {string}', async (actor: Actor, clave: string) => {
  const correo = correoUnico('e2e.rq13.rol')
  await actor.attemptsTo(AltaDeEstudiantePorApi.conClave(correo, clave))
})

paso('{quien} actualiza por API el nombre del usuario creado a {string}', async (actor: Actor, nombre: string) => {
  const id = await actor.answer(idCreado())
  await actor.attemptsTo(LlamarAlBack.conSesion('PUT', 'actualiza el nombre (API)', `/api/users/${id}`, { nombre }))
})

paso('{quien} desactiva por API el usuario creado', async (actor: Actor) => {
  const id = await actor.answer(idCreado())
  await actor.attemptsTo(LlamarAlBack.conSesion('DELETE', 'desactiva el usuario (API)', `/api/users/${id}`))
})

paso('{quien} intenta desactivar por API su propia cuenta', async (actor: Actor) => {
  const id = await actor.answer(idDeSesion())
  await actor.attemptsTo(LlamarAlBack.conSesion('DELETE', 'intenta desactivar su propia cuenta (API)', `/api/users/${id}`))
})

paso('{quien} pide un resumen sin token', async (actor: Actor) => {
  await actor.attemptsTo(LlamarAlBack.sinSesion('POST', 'pide un resumen sin token', '/api/ai/summarize', { texts: ['hola'] }))
})

paso('{quien} pide un resumen sin comentarios', async (actor: Actor) => {
  await actor.attemptsTo(LlamarAlBack.conSesion('POST', 'pide un resumen sin comentarios', '/api/ai/summarize', { texts: [] }))
})

paso('{quien} pide un resumen del comentario {string}', async (actor: Actor, comentario: string) => {
  await actor.attemptsTo(LlamarAlBack.conSesion('POST', 'pide un resumen', '/api/ai/summarize', { texts: [comentario] }))
})

paso('{quien} abre una nueva evaluación', async (actor: Actor) => {
  await actor.attemptsTo(AbrirEvaluacion.nueva())
})

paso('{quien} busca el docente {string}', async (actor: Actor, texto: string) => {
  await actor.attemptsTo(BuscarDocente.llamado(texto))
})

paso('{quien} registra por API un docente con la clave {string}', async (actor: Actor, clave: string) => {
  await actor.attemptsTo(
    RegistrarDocentePorApi.conClave(clave),
    Ensure.that(Respuesta.estado(), equals(201)),
  )
})

paso('{quien} inicia sesión como {string} con el correo creado y la clave {string}',
  async (actor: Actor, tipo: string, clave: string) => {
    const paneles: Record<string, string> = {
      Docente: '/dashboard-profesor',
      Estudiante: '/dashboard-estudiante',
      Coordinador: '/dashboard-coordinador',
      Decano: '/dashboard-decano',
      Administrador: '/dashboard-admin',
    }
    const ruta = paneles[tipo]
    if (!ruta) throw new Error(`Tipo de usuario desconocido "${tipo}"`)
    const correo = await actor.answer(correoGuardado())
    await actor.attemptsTo(
      IniciarSesion.como(tipo, correo, clave),
      Ensure.eventually(Pantalla.rutaActual(), equals(ruta)),
    )
  })

paso('{quien} busca el usuario {string}', async (actor: Actor, texto: string) => {
  await actor.attemptsTo(BuscarUsuario.llamado(texto))
})

paso('{quien} cambia el nombre del usuario creado a {string}', async (actor: Actor, nombre: string) => {
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(CambiarNombre.delCorreo(correo, nombre))
})

paso('{quien} desactiva al usuario creado', async (actor: Actor) => {
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(DesactivarUsuario.conCorreo(correo))
})

paso('{quien} desactiva la cuenta {string}', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(DesactivarUsuario.conCorreo(correo))
})

Then('ve el texto {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(PantallaDeTexto.exacto(texto).isPresent(), isTrue()))
})

Then('la estadística {string} muestra un número', async (titulo: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.eventually(Text.of(Estadisticas.valor(titulo)), matches(/^\s*-?\d+(\.\d+)?\s*$/)),
  )
})

Then('la lista de usuarios muestra {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Text.of(FormularioCrearUsuario.tablaDeUsuarios()), includes(texto)))
})

Then('la lista de usuarios no muestra {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Text.of(FormularioCrearUsuario.tablaDeUsuarios()), not(includes(texto))))
})

Then('la fila del usuario creado muestra {string}', async (texto: string) => {
  const actor = actorInTheSpotlight()
  const correo = await actor.answer(correoGuardado())
  await actor.attemptsTo(Ensure.eventually(Text.of(FormularioCrearUsuario.fila(correo)), includes(texto)))
})

Then('el campo {string} de la respuesta es {string}', async (nombre: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.campo(nombre), equals(valor)))
})

Then('el campo {string} de la respuesta menciona {string}', async (nombre: string, fragmento: string) => {
  const texto = Question.about<string>(`el texto del campo "${nombre}"`, async actor => {
    const valor = await actor.answer(Respuesta.campo(nombre))
    return valor == null ? '' : String(valor)
  })
  await actorInTheSpotlight().attemptsTo(Ensure.that(texto, includes(fragmento)))
})

Then('el campo {string} de la respuesta tiene texto', async (nombre: string) => {
  const texto = Question.about<string>(`el texto del campo "${nombre}"`, async actor => {
    const valor = await actor.answer(Respuesta.campo(nombre))
    return typeof valor === 'string' ? valor : ''
  })
  await actorInTheSpotlight().attemptsTo(Ensure.that(texto, matches(/\S/)))
})

Then('el campo {string} de la respuesta es un número', async (nombre: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.tipoDe(nombre), equals('number')))
})

Then('el campo {string} de la respuesta es verdadero', async (nombre: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.campo(nombre), isTrue()))
})

Then('el campo {string} de la respuesta es falso', async (nombre: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.campo(nombre), isFalse()))
})

Then('la respuesta no trae el campo {string}', async (nombre: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.campo(nombre), equals(undefined)))
})

Then('la respuesta no menciona {string}', async (texto: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(Respuesta.menciona(texto), isFalse()))
})

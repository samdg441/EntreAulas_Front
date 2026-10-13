import { DataTable, Given, Then, When } from '@cucumber/cucumber'
import { Ensure, equals, includes, isTrue, not } from '@serenity-js/assertions'
import { Actor, actorInTheSpotlight } from '@serenity-js/core'

import { PeticionesAlBack } from '../../test/interactions/NavegadorPlaywright'
import { valorDeLaEstadistica } from '../../test/questions/Estadisticas'
import { Pantalla } from '../../test/questions/Pantalla'
import { CLAVE_VALIDA } from '../../test/support/back-simulado'
import { AbrirEntreAulas } from '../../test/tasks/AbrirEntreAulas'
import { AbrirNuevaEvaluacion, EnviarEvaluacion } from '../../test/tasks/EnviarEvaluacion'
import { GenerarResumen } from '../../test/tasks/GenerarResumen'
import { BuscarUsuario, CrearUsuario, Desactivar, EditarUsuario } from '../../test/tasks/GestionarUsuarios'
import { EscribirCorreo, IniciarSesion } from '../../test/tasks/IniciarSesion'
import { BuscarDocente, CambiarPeriodo, ExportarDatosExcel } from '../../test/tasks/PanelDelCoordinador'
import { ConfirmarGeneracionDeQr } from '../../test/tasks/GenerarQr'

Given('que {actor} abre EntreAulas en {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(AbrirEntreAulas.en(ruta))
})

Given('que {actor} ingresó como coordinador', async (actor: Actor) => {
  await actor.attemptsTo(
    AbrirEntreAulas.en('/login'),
    IniciarSesion.como('Coordinador', 'carlos.coordinador@udemedellin.edu.co', CLAVE_VALIDA),
    Ensure.eventually(Pantalla.rutaActual(), equals('/dashboard-coordinador')),
  )
})

Given('que {actor} ingresó como docente', async (actor: Actor) => {
  await actor.attemptsTo(
    AbrirEntreAulas.en('/login'),
    IniciarSesion.como('Docente', 'pedro.docente@udemedellin.edu.co', CLAVE_VALIDA),
    Ensure.eventually(Pantalla.rutaActual(), equals('/dashboard-profesor')),
  )
})

Given('que {actor} ingresó como decano', async (actor: Actor) => {
  await actor.attemptsTo(
    AbrirEntreAulas.en('/login'),
    IniciarSesion.como('Decano', 'dora.decano@udemedellin.edu.co', CLAVE_VALIDA),
    Ensure.eventually(Pantalla.rutaActual(), equals('/dashboard-decano')),
  )
})

Given('que {actor} ingresó como administrador', async (actor: Actor) => {
  await actor.attemptsTo(
    AbrirEntreAulas.en('/login'),
    IniciarSesion.como('Administrador', 'ada.admin@udemedellin.edu.co', CLAVE_VALIDA),
    Ensure.eventually(Pantalla.rutaActual(), equals('/dashboard-admin')),
  )
})

When('{pronombre} inicia sesión como {string} con {string} y la clave válida', async (actor: Actor, tipo: string, correo: string) => {
  await actor.attemptsTo(IniciarSesion.como(tipo, correo, CLAVE_VALIDA))
})

When('{pronombre} inicia sesión como {string} con {string} y la clave {string}', async (actor: Actor, tipo: string, correo: string, clave: string) => {
  await actor.attemptsTo(IniciarSesion.como(tipo, correo, clave))
})

When('{pronombre} escribe el correo {string}', async (actor: Actor, correo: string) => {
  await actor.attemptsTo(EscribirCorreo.valor(correo))
})

When('{pronombre} abre directamente {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(AbrirEntreAulas.recargandoEn(ruta))
})

When('{pronombre} busca el docente {string}', async (actor: Actor, texto: string) => {
  await actor.attemptsTo(BuscarDocente.llamado(texto))
})

When('{pronombre} borra la búsqueda', async (actor: Actor) => {
  await actor.attemptsTo(BuscarDocente.borrarBusqueda())
})

When('{pronombre} cambia el periodo a {string}', async (actor: Actor, periodo: string) => {
  await actor.attemptsTo(CambiarPeriodo.a(periodo))
})

When('{pronombre} exporta los datos a Excel', async (actor: Actor) => {
  await actor.attemptsTo(ExportarDatosExcel())
})

When('{pronombre} confirma la generación de QR', async (actor: Actor) => {
  await actor.attemptsTo(ConfirmarGeneracionDeQr())
})

When('{pronombre} abre una nueva evaluación', async (actor: Actor) => {
  await actor.attemptsTo(AbrirNuevaEvaluacion())
})

When('{pronombre} envía la evaluación con el comentario {string}', async (actor: Actor, comentario: string) => {
  await actor.attemptsTo(EnviarEvaluacion.deAna(comentario))
})

When('{pronombre} genera el resumen de IA', async (actor: Actor) => {
  await actor.attemptsTo(GenerarResumen())
})

When('{pronombre} agrega a {string} {string} con el correo {string}', async (actor: Actor, nombre: string, apellido: string, correo: string) => {
  await actor.attemptsTo(CrearUsuario.llamado(nombre, apellido, correo))
})

When('{pronombre} intenta agregar a {string} {string} con el correo {string} y la clave {string}', async (actor: Actor, nombre: string, apellido: string, correo: string, clave: string) => {
  await actor.attemptsTo(CrearUsuario.conClave(nombre, apellido, correo, clave))
})

When('{pronombre} busca el usuario {string}', async (actor: Actor, texto: string) => {
  await actor.attemptsTo(BuscarUsuario.llamado(texto))
})

When('{pronombre} cambia el nombre de {string} a {string}', async (actor: Actor, fila: string, nombre: string) => {
  await actor.attemptsTo(EditarUsuario.nombreDe(fila, nombre))
})

When('{pronombre} desactiva a {string}', async (actor: Actor, fila: string) => {
  await actor.attemptsTo(Desactivar.a(fila))
})

Then('{pronombre} ve el mensaje {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.textoDeLaPagina(), includes(mensaje)))
})

Then('{pronombre} no ve el mensaje {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.textoDeLaPagina(), not(includes(mensaje))))
})

Then('{pronombre} está en la ruta {string}', async (actor: Actor, ruta: string) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.rutaActual(), equals(ruta)))
})

Then('{pronombre} ve en el login el mensaje {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.textoDelLogin(), includes(mensaje)))
})

Then('{pronombre} ve en la tabla el mensaje {string}', async (actor: Actor, mensaje: string) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.textoDeLaTabla(), includes(mensaje)))
})

Then('{pronombre} ve solamente a los docentes:', async (actor: Actor, tabla: DataTable) => {
  await actor.attemptsTo(Ensure.eventually(Pantalla.docentesVisibles(), equals(tabla.raw().flat())))
})

Then('el promedio de {string} se muestra como {string}', async (docente: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Pantalla.promedioDe(docente), includes(valor)))
})

Then('el back no recibió intentos de inicio de sesión', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(PeticionesAlBack.a('/api/auth/login').length, equals(0)))
})

Then('la última consulta a {string} pidió {string} = {string}', async (ruta: string, parametro: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(PeticionesAlBack.parametro(ruta, parametro), equals(valor)))
})

Then('{pronombre} descargó el archivo {string}', async (actor: Actor, archivo: string) => {
  await actor.attemptsTo(Ensure.that(Pantalla.archivoDescargado(), equals(archivo)))
})

Then('la estadística {string} muestra {string}', async (titulo: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(valorDeLaEstadistica(titulo), equals(valor)))
})

Then('el back recibió la petición {string} {string}', async (metodo: string, ruta: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(PeticionesAlBack.recibio(metodo, ruta), isTrue()))
})

Then('la última petición {string} {string} envió {string} = {string}', async (metodo: string, ruta: string, campo: string, valor: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(PeticionesAlBack.campo(metodo, ruta, campo), equals(valor)))
})

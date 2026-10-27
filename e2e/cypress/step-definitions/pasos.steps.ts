import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { actorLlamado, backSimulado } from './elenco'
import { OlvidarLaSesion, Visitar } from '../screenplay/interactions'
import {
  AbrirElEnlaceDelCorreo,
  CrearUsuario,
  IniciarSesion,
  PedirEnlaceDeRecuperacionPorApi,
  RestablecerContrasena,
  SolicitarRecuperacion,
} from '../screenplay/tasks'
import { CorreosRecibidos, CuentasRegistradas, FilaDeUsuario, MensajeVisible, RutaActual, UltimaRespuesta } from '../screenplay/questions'
import { FormularioAltaUsuario } from '../screenplay/ui'

const CLAVE_DE_PRUEBA = 'Clave#2026a'

const CUENTAS: Record<string, { email: string; tipo_usuario: string; activo?: boolean }> = {
  admin: { email: 'ada@udemedellin.edu.co', tipo_usuario: 'admin' },
  estudiante: { email: 'eva@soyudemedellin.edu.co', tipo_usuario: 'estudiante' },
  profesor: { email: 'pablo@udemedellin.edu.co', tipo_usuario: 'profesor' },
  coordinador: { email: 'carlos@udemedellin.edu.co', tipo_usuario: 'coordinador' },
  inactivo: { email: 'inactivo@soyudemedellin.edu.co', tipo_usuario: 'estudiante', activo: false },
}

const ACTOR = '(Ana|Luis|Eva|Lía|Ada|Pedro|Carlos|Dora|ella|él)'

// ───────── Contexto ─────────

Given('que el back de EntreAulas tiene registradas las cuentas de prueba', () => {
  Object.entries(CUENTAS).forEach(([nombre, c]) =>
    backSimulado().estado.sembrar({ ...c, password: CLAVE_DE_PRUEBA, nombre: nombre.toUpperCase(), apellido: 'PRUEBA' })
  )
})

Given(new RegExp(`^que ${ACTOR} abre EntreAulas sin sesión en "([^"]*)"$`), (nombre: string, ruta: string) => {
  actorLlamado(nombre).attemptsTo(OlvidarLaSesion, Visitar.la(ruta))
})

Given(new RegExp(`^que ${ACTOR} inició sesión con la cuenta "([^"]*)"$`), (nombre: string, cuenta: string) => {
  const c = CUENTAS[cuenta]
  actorLlamado(nombre).attemptsTo(IniciarSesion.como(c.tipo_usuario).con(c.email, CLAVE_DE_PRUEBA))
  cy.location('pathname').should('not.eq', '/login')
})

Given(/^que "([^"]*)" recibió un enlace de recuperación (vigente|vencido)$/, (correo: string, estado: string) => {
  backSimulado().estado.emitirToken(correo, { vencido: estado === 'vencido' })
})

// ───────── Acciones ─────────

When(new RegExp(`^(?:que )?${ACTOR} abre la administración de usuarios$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(Visitar.la('/admin/users'))
})

When(new RegExp(`^${ACTOR} abre EntreAulas en "([^"]*)"$`), (nombre: string, ruta: string) => {
  actorLlamado(nombre).attemptsTo(Visitar.la(ruta))
})

When(new RegExp(`^${ACTOR} inicia sesión con la cuenta "([^"]*)"$`), (nombre: string, cuenta: string) => {
  const c = CUENTAS[cuenta]
  actorLlamado(nombre).attemptsTo(IniciarSesion.como(c.tipo_usuario).con(c.email, CLAVE_DE_PRUEBA))
})

When(new RegExp(`^${ACTOR} inicia sesión como "([^"]*)" con "([^"]*)" y la clave "([^"]*)"$`), (nombre: string, tipo: string, correo: string, clave: string) => {
  actorLlamado(nombre).attemptsTo(IniciarSesion.como(tipo).con(correo, clave))
})

When(
  new RegExp(`^${ACTOR} crea un usuario "([^"]*)" llamado "([^"]*)" con el usuario de correo "([^"]*)" y la clave "([^"]*)"$`),
  (nombre: string, tipo: string, completo: string, usuario: string, clave: string) => {
    const [nombrePila, ...apellidos] = completo.split(' ')
    actorLlamado(nombre).attemptsTo(CrearUsuario.de(tipo).con({ nombre: nombrePila, apellido: apellidos.join(' '), usuario, clave }))
  }
)

When(new RegExp(`^${ACTOR} solicita la recuperación de "([^"]*)"$`), (nombre: string, correo: string) => {
  actorLlamado(nombre).attemptsTo(SolicitarRecuperacion.de(correo))
})

When(new RegExp(`^(?:que )?${ACTOR} abre (?:de nuevo )?el enlace de recuperación de "([^"]*)"$`), (nombre: string, correo: string) => {
  actorLlamado(nombre).attemptsTo(AbrirElEnlaceDelCorreo.de(correo))
})

When(new RegExp(`^${ACTOR} restablece su contraseña con "([^"]*)" y la confirma$`), (nombre: string, clave: string) => {
  actorLlamado(nombre).attemptsTo(RestablecerContrasena.con(clave))
})

When(new RegExp(`^${ACTOR} restablece su contraseña con "([^"]*)" y la confirma como "([^"]*)"$`), (nombre: string, clave: string, otra: string) => {
  actorLlamado(nombre).attemptsTo(RestablecerContrasena.con(clave, otra))
})

When(new RegExp(`^${ACTOR} pide por API el enlace de recuperación de "([^"]*)"$`), (nombre: string, correo: string) => {
  actorLlamado(nombre).attemptsTo(PedirEnlaceDeRecuperacionPorApi.de(correo))
})

// ───────── Verificaciones ─────────

Then('la ruta actual es {string}', (ruta: string) => {
  actorLlamado('ella').asksFor(RutaActual.valor()).should('eq', ruta)
})

Then(/^(?:(?:ella|él) )?ve el mensaje "([^"]*)"$/, (texto: string) => {
  actorLlamado('ella').asksFor(MensajeVisible.que(texto))
})

Then(/^(?:(?:ella|él) )?no ve el mensaje "([^"]*)"$/, (texto: string) => {
  actorLlamado('ella').asksFor(MensajeVisible.ausente(texto))
})

Then('su sesión queda guardada con un token', () => {
  cy.window().its('localStorage').invoke('getItem', 'token').should('match', /^jwt-/)
})

Then('no tiene sesión guardada', () => {
  cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
})

Then('no se llamó al login del back', () => {
  cy.get('@login.all').should('have.length', 0)
})

Then('la lista de usuarios muestra {string}', (correo: string) => {
  actorLlamado('ella').asksFor(FilaDeUsuario.conCorreo(correo))
})

Then('el formulario de alta sigue abierto', () => {
  actorLlamado('ella').asksFor(MensajeVisible.que(FormularioAltaUsuario.titulo))
  cy.get(FormularioAltaUsuario.nombre).should('be.visible')
})

Then(/^el back tiene (\d+) cuentas? con el correo "([^"]*)"$/, (cantidad: string, correo: string) => {
  actorLlamado('ella').asksFor(CuentasRegistradas.conCorreo(correo)).should('eq', Number(cantidad))
})

Then(/^"([^"]*)" recibió (\d+) correos? de recuperación$/, (correo: string, cantidad: string) => {
  actorLlamado('ella').asksFor(CorreosRecibidos.por(correo)).should('eq', Number(cantidad))
})

Then(/^"([^"]*)" (puede|no puede) iniciar sesión como "([^"]*)" con la clave "([^"]*)"$/, (correo: string, puede: string, tipo: string, clave: string) => {
  const actor = actorLlamado('ella')
  actor.attemptsTo(OlvidarLaSesion, IniciarSesion.como(tipo).con(correo, clave))
  if (puede === 'puede') actor.asksFor(RutaActual.valor()).should('not.eq', '/login')
  else {
    actor.asksFor(MensajeVisible.que('Credenciales inválidas'))
    actor.asksFor(RutaActual.valor()).should('eq', '/login')
  }
})

Then('la respuesta tiene estado {int}', (estado: number) => {
  actorLlamado('ella').asksFor(UltimaRespuesta.estado()).should('eq', estado)
})

Then('la respuesta no incluye ningún enlace ni token de recuperación', () => {
  actorLlamado('ella').asksFor(UltimaRespuesta.cuerpo()).should('not.have.any.keys', 'resetToken', 'resetLink', 'token')
})

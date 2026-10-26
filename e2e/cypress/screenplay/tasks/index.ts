import { Activity, Actor } from '../actor'
import { UsarElBackSimulado } from '../abilities'
import { Escribir, Pedir, Pulsar, Seleccionar, Visitar } from '../interactions'
import { FormularioAltaUsuario, FormularioLogin, FormularioNuevaClave, FormularioRecuperacion } from '../ui'

const tarea = (descripcion: string, pasos: (actor: Actor) => Activity[]): Activity => ({
  descripcion,
  performAs: (actor) => actor.attemptsTo(...pasos(actor)),
})

const ETIQUETA_TIPO: Record<string, string> = {
  estudiante: 'Estudiante',
  profesor: 'Docente',
  coordinador: 'Coordinador',
  decano: 'Decano',
  admin: 'Administrador',
}

const ElegirTipoDeUsuario = (etiqueta: string): Activity => ({
  descripcion: `elige el tipo de usuario «${etiqueta}»`,
  performAs: () => {
    cy.get(FormularioLogin.selectorDeTipo).first().then(($b) => {
      if ($b.text().includes(etiqueta)) return
      cy.wrap($b).click()
      cy.contains(FormularioLogin.selectorDeTipo, etiqueta).click()
    })
  },
})

/** RQ2 */
export const IniciarSesion = {
  como: (tipo: string) => ({
    con: (correo: string, clave: string) =>
      tarea(`inicia sesión como ${tipo} con ${correo}`, () => [
        Visitar.la('/login'),
        ElegirTipoDeUsuario(ETIQUETA_TIPO[tipo] ?? tipo),
        Escribir.elTexto(correo).en(FormularioLogin.correo),
        Escribir.elTexto(clave, { secreto: true }).en(FormularioLogin.clave),
        Pulsar.en(FormularioLogin.enviar),
      ]),
  }),
}

/** RQ1: el usuario del correo se escribe sin dominio; el front agrega el dominio según el tipo. */
export const CrearUsuario = {
  de: (tipo: string) => ({
    con: (datos: { nombre: string; apellido: string; usuario: string; clave: string }) =>
      tarea(`crea un usuario ${tipo} «${datos.usuario}»`, (actor) => {
        actor.remember('usuarioCreado', datos.usuario)
        return [
          Pulsar.elBoton(FormularioAltaUsuario.abrir),
          Escribir.elTexto(datos.nombre).en(FormularioAltaUsuario.nombre),
          Escribir.elTexto(datos.apellido).en(FormularioAltaUsuario.apellido),
          Seleccionar.laOpcion(tipo).en(FormularioAltaUsuario.tipo),
          Escribir.elTexto(datos.usuario).en(FormularioAltaUsuario.usuarioDelCorreo),
          Escribir.elTexto(datos.clave, { secreto: true }).en(FormularioAltaUsuario.clave),
          Pulsar.elBoton(FormularioAltaUsuario.crear),
        ]
      }),
  }),
}

/** RQ3.1 */
export const SolicitarRecuperacion = {
  de: (correo: string) =>
    tarea(`solicita la recuperación de ${correo}`, () => [
      Escribir.elTexto(correo).en(FormularioRecuperacion.correo),
      Pulsar.elBoton(FormularioRecuperacion.enviar),
    ]),
}

/** RQ4: abre el enlace del último correo que el back «envió» a la persona. */
export const AbrirElEnlaceDelCorreo = {
  de: (correo: string) => ({
    descripcion: `abre el enlace de recuperación que recibió ${correo}`,
    performAs: (actor: Actor) => {
      cy.then(() => {
        const recibidos = actor.abilityTo(UsarElBackSimulado).estado.correos.filter((c) => c.para === correo)
        expect(recibidos, `correos recibidos por ${correo}`).not.to.be.empty
        cy.visit(recibidos[recibidos.length - 1].enlace)
      })
    },
  }),
}

/** RQ5 */
export const RestablecerContrasena = {
  con: (nueva: string, confirmacion = nueva) =>
    tarea('define una nueva contraseña', () => [
      Escribir.elTexto(nueva, { secreto: true }).en(FormularioNuevaClave.nueva),
      Escribir.elTexto(confirmacion, { secreto: true }).en(FormularioNuevaClave.confirmacion),
      Pulsar.elBoton(FormularioNuevaClave.enviar),
    ]),
}

/** RQ3.1 / RQ4 por API real. */
export const PedirEnlaceDeRecuperacionPorApi = {
  de: (correo: string) => tarea(`pide por API el enlace de ${correo}`, () => [Pedir.por('POST', '/api/auth/forgot-password', { email: correo })]),
}

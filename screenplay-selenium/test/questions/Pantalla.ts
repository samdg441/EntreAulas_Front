import { Attribute, Page, Text } from '@serenity-js/web'

import { conEspera } from './conEspera'

import { FormularioCrearUsuario } from '../ui/FormularioCrearUsuario'
import { FormularioLogin } from '../ui/FormularioLogin'
import { FormularioRecuperacion } from '../ui/FormularioRecuperacion'
import { Mensajes } from '../ui/Mensajes'

export const Pantalla = {
  rutaActual: () => Page.current().url().pathname.describedAs('la ruta actual'),
  mensajeDeError: () => conEspera(Text.of(Mensajes.error())).describedAs('el mensaje de error'),
  hayMensajeDeError: () => Mensajes.error().isPresent().describedAs('si hay un mensaje de error'),
  errorDelFormularioDeUsuario: () => conEspera(Text.of(FormularioCrearUsuario.errorDelFormulario())).describedAs('el error del formulario de usuario'),
  tablaDeUsuarios: () => conEspera(Text.of(FormularioCrearUsuario.tablaDeUsuarios())).describedAs('la tabla de usuarios'),
  tituloDeConfirmacion: () => conEspera(Text.of(FormularioRecuperacion.tituloDeConfirmacion())).describedAs('el título de confirmación'),
  textoDeConfirmacion: () => conEspera(Text.of(FormularioRecuperacion.textoDeConfirmacion())).describedAs('el texto de confirmación'),
  textoDelBotonDeLogin: () => Text.of(FormularioLogin.ingresar()).describedAs('el texto del botón de login'),
  formularioDeUsuarioAbierto: () => FormularioCrearUsuario.crear().isPresent().describedAs('si el formulario de creación sigue abierto'),
  hayConfirmacion: () => FormularioRecuperacion.tituloDeConfirmacion().isPresent().describedAs('si hay una confirmación'),
  hayOpcionDeNuevoEnlace: () => FormularioRecuperacion.solicitarNuevoEnlace().isPresent().describedAs('si se ofrece solicitar un nuevo enlace'),
  correoEnReset: () => conEspera(Attribute.called('value').of(FormularioRecuperacion.correo())).describedAs('el correo del formulario'),
}

/** Localizadores de las pantallas de RQ1–RQ5 (un solo lugar para mantenerlos). */
export const FormularioLogin = {
  selectorDeTipo: 'form button[type="button"]',
  correo: 'input[type="email"]',
  clave: 'input[type="password"]',
  enviar: 'button[type="submit"]',
}

export const FormularioAltaUsuario = {
  abrir: 'Agregar usuario',
  nombre: '#nombre',
  apellido: '#apellido',
  usuarioDelCorreo: '#correo-institucional',
  clave: '#contraseña',
  tipo: '#tipo-usuario',
  crear: 'Crear',
  titulo: 'Agregar usuario',
}

export const FormularioRecuperacion = {
  correo: 'input[type="email"]',
  enviar: 'Enviar enlace de recuperación',
}

export const FormularioNuevaClave = {
  nueva: '#nueva-contraseña',
  confirmacion: '#confirmar-nueva-contraseña',
  enviar: 'Actualizar contraseña',
  pedirOtroEnlace: 'Solicitar un nuevo enlace',
}

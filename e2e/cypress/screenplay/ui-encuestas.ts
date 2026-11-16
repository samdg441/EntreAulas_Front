/** Localizadores de las pantallas de Esteban (un solo lugar para mantenerlos). */

export const PantallaEncuestas = {
  ruta: '/admin/surveys',
  crearEncuesta: 'Crear encuesta',
  editarEncuesta: 'Editar encuesta',
  nombreDeLaEncuesta: 'Nombre de la encuesta',
  guardarEncuesta: 'Guardar encuesta',
  agregarPregunta: 'Agregar pregunta',
  textoDeLaPregunta: 'Texto de la pregunta',
  guardarPregunta: 'Guardar pregunta',
  guardarCorreccion: 'Guardar cambios de la pregunta',
  editarLaPregunta: (texto: string) => `button[aria-label="Editar pregunta ${texto}"]`,
  desactivar: 'Desactivar',
  filasDePreguntas: 'table tbody tr',
  dialogo: 'dialog[open]',
  alerta: '[role="alert"]',
}

export const PantallaSeleccion = {
  ruta: '/evaluate/selection',
  buscador: 'input[placeholder="Buscar docente o materia..."]',
  materia: 'select',
  grupo: (numero: string) => `Grupo ${numero}`,
  continuar: 'Continuar a Evaluación',
}

export const Campana = {
  boton: 'button[aria-label^="Notificaciones"]',
  marcarTodas: 'Marcar todas como leídas',
}

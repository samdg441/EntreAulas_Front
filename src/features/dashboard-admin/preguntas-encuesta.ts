import type { CreateSurveyQuestionPayload, SurveyQuestion } from '../../api/surveys.api'

/**
 * RF-ENC-32 y RF-ENC-33 — Reglas para corregir una pregunta de la encuesta.
 * Sin React ni Axios: la pantalla inyecta el puerto (`surveysApi`) y las pruebas un doble.
 */

export type DatosPregunta = CreateSurveyQuestionPayload

/** Lo único que estas reglas necesitan del servidor. */
export interface PuertoPreguntas {
  updateQuestion(id: number, datos: DatosPregunta): Promise<SurveyQuestion>
}

export const MENSAJES_PREGUNTA = {
  textoVacio: 'Completa categoría y texto de la pregunta',
  ordenInvalido: 'El orden debe ser un número entero mayor que cero',
  duplicada: 'Ya hay una pregunta con ese texto en esta encuesta',
  falloServidor: 'No se pudo actualizar la pregunta',
} as const

export type ResultadoCorreccion = { ok: true; pregunta: SurveyQuestion } | { ok: false; error: string }

const CAMPOS_EDITABLES = [
  'categoria_id',
  'texto_pregunta',
  'descripcion',
  'tipo_pregunta',
  'obligatoria',
  'orden',
  'id_carrera',
] as const satisfies ReadonlyArray<keyof DatosPregunta>

/** Mismo texto para el usuario: sin espacios sobrantes y sin distinguir mayúsculas. */
function normalizar(texto: string) {
  return texto.trim().replace(/\s+/g, ' ').toLowerCase()
}

function sinCambios(actual: SurveyQuestion, datos: DatosPregunta) {
  const original = datosDePregunta(actual)
  return CAMPOS_EDITABLES.every((campo) => (original[campo] ?? null) === (datos[campo] ?? null))
}

function mensajeDeError(error: unknown): string {
  const cuerpo = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return cuerpo?.message || cuerpo?.error || MENSAJES_PREGUNTA.falloServidor
}

/** Campos que el diálogo de edición precarga; deja fuera id, activa y la categoría anidada. */
export function datosDePregunta(pregunta: SurveyQuestion): DatosPregunta {
  return {
    categoria_id: pregunta.categoria_id,
    texto_pregunta: pregunta.texto_pregunta,
    descripcion: pregunta.descripcion,
    tipo_pregunta: pregunta.tipo_pregunta,
    obligatoria: pregunta.obligatoria,
    orden: pregunta.orden,
    id_carrera: pregunta.id_carrera,
  }
}

/** Devuelve el mensaje que ve el usuario, o `null` si la pregunta se puede guardar. */
export function validarPregunta(
  datos: DatosPregunta,
  existentes: SurveyQuestion[],
  idActual?: number
): string | null {
  if (!datos.categoria_id || !datos.texto_pregunta.trim()) return MENSAJES_PREGUNTA.textoVacio
  if (!Number.isInteger(datos.orden) || datos.orden < 1) return MENSAJES_PREGUNTA.ordenInvalido

  const texto = normalizar(datos.texto_pregunta)
  const repetida = existentes.some(
    (p) => p.id !== idActual && p.categoria_id === datos.categoria_id && normalizar(p.texto_pregunta) === texto
  )
  return repetida ? MENSAJES_PREGUNTA.duplicada : null
}

/**
 * Valida, evita el PUT si nada cambió y traduce el error del servidor a un mensaje.
 * Nunca lanza: la pantalla solo mira `ok`.
 */
export async function corregirPregunta(
  api: PuertoPreguntas,
  id: number,
  datos: DatosPregunta,
  existentes: SurveyQuestion[]
): Promise<ResultadoCorreccion> {
  const error = validarPregunta(datos, existentes, id)
  if (error) return { ok: false, error }

  const limpios: DatosPregunta = { ...datos, texto_pregunta: datos.texto_pregunta.trim() }
  const actual = existentes.find((p) => p.id === id)
  if (actual && sinCambios(actual, limpios)) return { ok: true, pregunta: actual }

  try {
    return { ok: true, pregunta: await api.updateQuestion(id, limpios) }
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) }
  }
}

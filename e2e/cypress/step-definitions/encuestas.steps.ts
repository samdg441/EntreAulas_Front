import { DataTable, Given, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { Actor } from '../screenplay/actor'
import { actorLlamado, encuestasSimuladas } from './elenco'
import { FijarLaFechaDeHoy } from '../screenplay/interactions/encuestas'
import {
  AbrirLaCampana,
  AbrirLaEncuesta,
  AbrirLaSeleccionDeEncuesta,
  AbrirLasEncuestas,
  AgregarLaPregunta,
  BuscarEnLaSeleccion,
  CorregirLaPregunta,
  CrearLaEncuesta,
  ElegirLaEncuesta,
  IntentarElegirAlDocente,
  MarcarTodasComoLeidas,
  RetirarLaPregunta,
} from '../screenplay/tasks/encuestas'
import {
  AvisoDelDialogo,
  AvisosSinLeer,
  CorreccionesEnviadas,
  DialogoDeLaPregunta,
  EncuestasGuardadas,
  PreguntasEnPantalla,
  PreguntasGuardadas,
} from '../screenplay/questions/encuestas'

/**
 * Pasos de Esteban: Creación de encuestas, Selección de la encuesta y Notificaciones.
 * Cada paso solo traduce la frase Gherkin a lo que el actor hace (tareas) o pregunta (preguntas).
 * El inicio de sesión, «ve el mensaje» y «la ruta actual es» son los pasos comunes de pasos.steps.ts.
 */

const ACTOR = '(Ana|Luis|Eva|Lía|Ada|Pedro|Carlos|Dora|ella|él)'
const estado = () => encuestasSimuladas().estado

// ───────── Contexto ─────────

Given('que la encuesta {string} tiene las preguntas:', (encuesta: string, tabla: DataTable) => {
  tabla.raw().flat().forEach((texto) => estado().sembrarPregunta(encuesta, texto))
})

Given('que el back rechazará la próxima corrección con {string}', (mensaje: string) => {
  estado().rechazoDeCorreccion = { estado: 400, mensaje }
})

Given(new RegExp(`^que ${ACTOR} está matriculada con los docentes:$`), (_nombre: string, tabla: DataTable) => {
  tabla.hashes().forEach((fila, i) => {
    const existente = estado().docentes.find((d) => d.name === fila.docente)
    const materia = {
      id: `c${i + 1}`,
      name: fila.materia,
      code: fila['código'],
      schedule: 'Lunes 8:00',
      evaluada: fila.respondida === 'sí',
    }
    if (existente) existente.courses.push(materia)
    else
      estado().docentes.push({
        id: String(i + 1),
        name: fila.docente,
        department: fila.departamento,
        email: `docente${i + 1}@udemedellin.edu.co`,
        courses: [materia],
      })
  })
})

Given('que el servicio de docentes no está disponible', () => {
  estado().docentesCaidos = true
})

Given('que hoy es {string}', (fecha: string) => {
  new Actor('Calendario').attemptsTo(FijarLaFechaDeHoy.en(fecha))
})

Given('que la ventana de evaluación {string} va del {string} al {string}', (periodo: string, inicio: string, fin: string) => {
  const [ano, semestre] = periodo.split('-').map(Number)
  estado().ventanas.push({ periodoId: estado().ventanas.length + 1, ano, semestre, fechaInicio: inicio, fechaFin: fin })
})

Given('que no hay ventanas de evaluación programadas', () => {
  estado().ventanas = []
})

// ───────── Acciones ─────────

When(new RegExp(`^(?:que )?${ACTOR} abre la administración de encuestas$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLasEncuestas)
})

When(new RegExp(`^${ACTOR} crea la encuesta "([^"]*)"$`), (nombre: string, encuesta: string) => {
  actorLlamado(nombre).attemptsTo(CrearLaEncuesta.llamada(encuesta))
})

When(new RegExp(`^(?:que )?${ACTOR} abre la encuesta "([^"]*)"$`), (nombre: string, encuesta: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLaEncuesta.llamada(encuesta))
})

When(new RegExp(`^${ACTOR} agrega la pregunta "([^"]*)"$`), (nombre: string, texto: string) => {
  actorLlamado(nombre).attemptsTo(AgregarLaPregunta.conElTexto(texto))
})

When(new RegExp(`^${ACTOR} corrige la pregunta "([^"]*)" para que diga "([^"]*)"$`), (nombre: string, actual: string, nuevo: string) => {
  actorLlamado(nombre).attemptsTo(CorregirLaPregunta.que(actual).paraQueDiga(nuevo))
})

When(new RegExp(`^${ACTOR} retira la pregunta "([^"]*)"$`), (nombre: string, texto: string) => {
  actorLlamado(nombre).attemptsTo(RetirarLaPregunta.que(texto))
})

When(new RegExp(`^(?:que )?${ACTOR} abre la selección de la encuesta$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLaSeleccionDeEncuesta)
})

When(
  new RegExp(`^${ACTOR} elige al docente "([^"]*)", la materia "([^"]*)" y el grupo "([^"]*)"$`),
  (nombre: string, docente: string, codigo: string, grupo: string) => {
    const materia = estado().docentes.flatMap((d) => d.courses).find((c) => c.code === codigo)
    if (!materia) throw new Error(`No hay una materia con el código ${codigo}`)
    actorLlamado(nombre).attemptsTo(ElegirLaEncuesta.delDocente(docente).enLaMateria(materia.id).yElGrupo(grupo))
  }
)

When(new RegExp(`^${ACTOR} intenta elegir al docente "([^"]*)"$`), (nombre: string, docente: string) => {
  actorLlamado(nombre).attemptsTo(IntentarElegirAlDocente.llamado(docente))
})

When(new RegExp(`^${ACTOR} busca "([^"]*)" en la selección$`), (nombre: string, texto: string) => {
  actorLlamado(nombre).attemptsTo(BuscarEnLaSeleccion.elTexto(texto))
})

When(new RegExp(`^${ACTOR} abre la campana de notificaciones$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLaCampana)
})

When(new RegExp(`^${ACTOR} marca todas las notificaciones como leídas$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(MarcarTodasComoLeidas)
})

// ───────── Resultados ─────────

Then('la tabla de preguntas muestra {string}', (texto: string) => {
  actorLlamado('él').asksFor(PreguntasEnPantalla.textos()).should('include', texto)
})

Then('la tabla de preguntas no muestra {string}', (texto: string) => {
  actorLlamado('él').asksFor(PreguntasEnPantalla.textos()).should('not.include', texto)
})

Then('la encuesta {string} guarda las preguntas activas:', (encuesta: string, tabla: DataTable) => {
  actorLlamado('él').asksFor(PreguntasGuardadas.activasDe(encuesta)).should('deep.equal', tabla.raw().flat())
})

Then('el back guarda la encuesta {string}', (encuesta: string) => {
  actorLlamado('él').asksFor(EncuestasGuardadas.nombres()).should('include', encuesta)
})

Then('el back no guarda la encuesta {string}', (encuesta: string) => {
  actorLlamado('él').asksFor(EncuestasGuardadas.nombres()).should('not.include', encuesta)
})

Then('el diálogo de la pregunta avisa {string}', (aviso: string) => {
  actorLlamado('él').asksFor(AvisoDelDialogo.texto()).should('eq', aviso)
})

Then('el diálogo de la pregunta sigue abierto', () => {
  actorLlamado('él').asksFor(DialogoDeLaPregunta.abierto()).should('eq', true)
})

Then(/^el back recibió (\d+) correcci(?:ón|ones)$/, (cantidad: string) => {
  actorLlamado('él').asksFor(CorreccionesEnviadas.cantidad()).should('eq', Number(cantidad))
})

Then(/^la campana marca (\d+) avisos? sin leer$/, (cantidad: string) => {
  actorLlamado('él')
    .asksFor(AvisosSinLeer.etiquetaDeLaCampana())
    .should('eq', AvisosSinLeer.etiquetaEsperada(Number(cantidad)))
})

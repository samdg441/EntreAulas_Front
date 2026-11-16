import { Activity, Actor } from '../actor'
import {
  ElegirEnLaLista,
  EscribirEn,
  EscribirEnElCampo,
  EsperarLaRespuesta,
  PulsarElBoton,
  PulsarElTexto,
  PulsarEnLaFila,
} from '../interactions/encuestas'
import { Campana, PantallaEncuestas as E, PantallaSeleccion as S } from '../ui-encuestas'

/**
 * Tareas de Esteban (Screenplay): describen QUÉ quiere hacer el actor en el lenguaje del negocio
 * y se componen de interacciones. Si cambia la pantalla, se tocan las interacciones o `ui-encuestas.ts`,
 * no los escenarios Gherkin.
 */
const tarea = (descripcion: string, pasos: (actor: Actor) => Activity[]): Activity => ({
  descripcion,
  performAs: (actor) => actor.attemptsTo(...pasos(actor)),
})

const AbrirPantalla = (ruta: string): Activity => ({
  descripcion: `abre ${ruta} con la sesión ya iniciada`,
  performAs: () => {
    cy.window().its('localStorage.token', { timeout: 15_000 }).should('match', /^jwt-/)
    cy.visit(ruta)
  },
})

// ───────── Creación de encuestas (RF-ENC-32, RF-ENC-33) ─────────

export const AbrirLasEncuestas = tarea('abre la administración de encuestas', () => [AbrirPantalla(E.ruta)])

export const CrearLaEncuesta = {
  llamada: (nombre: string) =>
    tarea(`crea la encuesta «${nombre}»`, (actor) => {
      actor.remember('encuestaEnPantalla', nombre)
      return [
        PulsarElBoton.llamado(E.crearEncuesta),
        EscribirEnElCampo.etiquetado(E.nombreDeLaEncuesta).elTexto(nombre),
        PulsarElBoton.llamado(E.guardarEncuesta),
      ]
    }),
}

export const AbrirLaEncuesta = {
  llamada: (nombre: string) =>
    tarea(`abre la encuesta «${nombre}»`, (actor) => {
      actor.remember('encuestaEnPantalla', nombre)
      return [PulsarElBoton.llamado(E.editarEncuesta), PulsarElBoton.llamado(nombre), EsperarLaRespuesta.de('preguntas')]
    }),
}

export const AgregarLaPregunta = {
  conElTexto: (texto: string) =>
    tarea(`agrega la pregunta «${texto}»`, () => [
      PulsarElBoton.llamado(E.agregarPregunta),
      EscribirEnElCampo.etiquetado(E.textoDeLaPregunta).elTexto(texto),
      PulsarElBoton.llamado(E.guardarPregunta),
    ]),
}

export const CorregirLaPregunta = {
  que: (actual: string) => ({
    paraQueDiga: (nuevo: string) =>
      tarea(`corrige «${actual}» para que diga «${nuevo}»`, () => [
        PulsarElBoton.con(E.editarLaPregunta(actual), `«Editar» en la pregunta «${actual}»`),
        EscribirEnElCampo.etiquetado(E.textoDeLaPregunta).elTexto(nuevo),
        PulsarElBoton.llamado(E.guardarCorreccion),
      ]),
  }),
}

export const RetirarLaPregunta = {
  que: (texto: string) =>
    tarea(`retira la pregunta «${texto}»`, () => [
      PulsarEnLaFila.de(texto).elBoton(E.desactivar),
      EsperarLaRespuesta.de('retirarPregunta'),
    ]),
}

// ───────── Selección de la encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27) ─────────

export const AbrirLaSeleccionDeEncuesta = tarea('abre la selección de la encuesta', () => [AbrirPantalla(S.ruta)])

export const ElegirLaEncuesta = {
  delDocente: (docente: string) => ({
    enLaMateria: (idMateria: string) => ({
      yElGrupo: (grupo: string) =>
        tarea(`elige a ${docente}, la materia ${idMateria} y el grupo ${grupo}`, () => [
          PulsarElTexto.llamado(docente),
          ElegirEnLaLista.laOpcion(idMateria).en(S.materia),
          PulsarElTexto.llamado(S.grupo(grupo)),
          PulsarElBoton.llamado(S.continuar),
        ]),
    }),
  }),
}

export const IntentarElegirAlDocente = {
  llamado: (docente: string) => tarea(`intenta elegir a ${docente}`, () => [PulsarElTexto.llamado(docente)]),
}

export const BuscarEnLaSeleccion = {
  elTexto: (texto: string) => tarea(`busca «${texto}»`, () => [EscribirEn.elSelector(S.buscador).elTexto(texto)]),
}

// ───────── Notificaciones (RF-NOT-34, RF-NOT-35) ─────────

export const AbrirLaCampana = tarea('abre la campana de notificaciones', () => [
  EsperarLaRespuesta.de('ventanas'),
  PulsarElBoton.con(Campana.boton, 'la campana de notificaciones'),
])

export const MarcarTodasComoLeidas = tarea('marca todas las notificaciones como leídas', () => [
  PulsarElBoton.llamado(Campana.marcarTodas),
])

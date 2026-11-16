import { Actor, Question } from '../actor'
import { GestionarEncuestasSimuladas } from '../abilities/encuestas'
import { Campana, PantallaEncuestas as E } from '../ui-encuestas'

/**
 * Preguntas de Esteban (Screenplay): lo que el actor puede comprobar.
 * Unas leen la pantalla y otras el estado del back simulado (el efecto real de la acción).
 */
const pregunta = <T>(descripcion: string, answeredBy: (actor: Actor) => Cypress.Chainable<T>): Question<T> => ({
  descripcion,
  answeredBy,
})

/** Se evalúa al ejecutar el comando, no al encolarlo: así ve el estado después de las peticiones. */
const delBack = <T>(actor: Actor, leer: (estado: GestionarEncuestasSimuladas['estado']) => T) =>
  cy.wrap(null, { log: false }).then(() => leer(actor.abilityTo(GestionarEncuestasSimuladas).estado))

export const PreguntasEnPantalla = {
  textos: () =>
    pregunta('qué preguntas muestra la tabla', () =>
      cy
        .get(E.filasDePreguntas, { timeout: 15_000 })
        .should('have.length.at.least', 1)
        .then(($filas) => [...$filas].map((f) => f.querySelectorAll('td')[1]?.textContent?.trim() ?? '').filter(Boolean))
    ),
}

export const PreguntasGuardadas = {
  activasDe: (encuesta: string) =>
    pregunta(`qué preguntas activas guarda el back en «${encuesta}»`, (actor) =>
      delBack(actor, (b) => {
        const id = b.encuestaLlamada(encuesta)?.id
        return b.preguntas.filter((p) => p.activa && p.categoria_id === id).map((p) => p.texto_pregunta)
      })
    ),
}

export const EncuestasGuardadas = {
  nombres: () => pregunta('qué encuestas guarda el back', (actor) => delBack(actor, (b) => b.encuestas.map((e) => e.nombre))),
}

export const CorreccionesEnviadas = {
  cantidad: () => pregunta('cuántas correcciones recibió el back', (actor) => delBack(actor, (b) => b.correcciones)),
}

export const AvisoDelDialogo = {
  texto: () =>
    pregunta('qué aviso muestra el diálogo de la pregunta', () =>
      cy.get(E.dialogo, { timeout: 15_000 }).find(E.alerta).invoke('text')
    ),
}

export const DialogoDeLaPregunta = {
  abierto: () => pregunta('si el diálogo de la pregunta sigue abierto', () => cy.get('body').then(($b) => $b.find(E.dialogo).length > 0)),
}

/**
 * La campana anuncia los pendientes en su nombre accesible: «Notificaciones (1 sin leer)» o «Notificaciones».
 * Se devuelve la etiqueta sin transformarla con .then(): así `.should()` reintenta mientras cargan las ventanas.
 */
export const AvisosSinLeer = {
  etiquetaEsperada: (cantidad: number) => (cantidad > 0 ? `Notificaciones (${cantidad} sin leer)` : 'Notificaciones'),
  etiquetaDeLaCampana: () =>
    pregunta('qué pendientes anuncia la campana', () =>
      cy.get(Campana.boton, { timeout: 15_000 }).invoke('attr', 'aria-label')
    ),
}

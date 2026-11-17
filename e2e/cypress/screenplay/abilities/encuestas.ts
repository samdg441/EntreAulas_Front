import { Ability } from '../actor'
import { EncuestasEnMemoria, levantarEncuestasEnMemoria } from '../../support/encuestas-en-memoria'

/**
 * Habilidad de trabajar contra el back simulado de encuestas, selección y ventanas de evaluación.
 * El actor la usa para preparar datos y para responder preguntas sobre lo que quedó guardado.
 */
export class GestionarEncuestasSimuladas implements Ability {
  private back: EncuestasEnMemoria | null = null

  static enMemoria() {
    return new GestionarEncuestasSimuladas()
  }

  /** Registra los intercepts. Debe llamarse dentro de un hook o paso. */
  levantar(): EncuestasEnMemoria {
    this.back = levantarEncuestasEnMemoria()
    return this.back
  }

  get estado(): EncuestasEnMemoria {
    if (!this.back) throw new Error('El back de encuestas no está levantado')
    return this.back
  }
}

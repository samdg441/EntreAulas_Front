import { Ability } from '../actor'
import { BackEnMemoria, levantarBackEnMemoria } from '../../support/back-en-memoria'
import { apiUrl } from '../../support/api'

/** Habilidad de usar el navegador (Cypress controla la pestaña del front). */
export class NavegarLaWeb implements Ability {
  static usandoCypress() {
    return new NavegarLaWeb()
  }
}

/** Habilidad de trabajar contra el back simulado en memoria (cuentas, tokens y buzón de correos). */
export class UsarElBackSimulado implements Ability {
  private back: BackEnMemoria | null = null

  static enMemoria() {
    return new UsarElBackSimulado()
  }

  /** Registra los intercepts. Debe llamarse dentro de un hook o paso (cy.intercept no funciona fuera de un test). */
  levantar(): BackEnMemoria {
    this.back = levantarBackEnMemoria()
    return this.back
  }

  get estado(): BackEnMemoria {
    if (!this.back) throw new Error('El back simulado no está levantado')
    return this.back
  }
}

/** Habilidad de llamar a la API real de EntreAulas con cy.request. */
export class LlamarALaApi implements Ability {
  constructor(readonly baseUrl: string) {}

  static enEntreAulas() {
    return new LlamarALaApi(apiUrl())
  }
}

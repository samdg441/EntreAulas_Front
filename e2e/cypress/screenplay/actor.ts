/**
 * Núcleo del patrón Screenplay sobre Cypress.
 * - Actor: tiene habilidades (Abilities), realiza actividades (Tasks / Interactions) y responde preguntas (Questions).
 * - Las actividades encolan comandos de Cypress: el actor no espera promesas, Cypress ordena la ejecución.
 */
export interface Ability {}
export type ClaseDeHabilidad<A extends Ability> = new (...args: never[]) => A

export interface Activity {
  /** Descripción legible que aparece en el Command Log de Cypress. */
  readonly descripcion: string
  performAs(actor: Actor): void
}

export interface Question<T> {
  readonly descripcion: string
  answeredBy(actor: Actor): Cypress.Chainable<T>
}

export class Actor {
  private readonly habilidades = new Map<Function, Ability>()
  private readonly notas = new Map<string, unknown>()

  constructor(readonly nombre: string) {}

  whoCan(...habilidades: Ability[]): this {
    habilidades.forEach((h) => this.habilidades.set(h.constructor, h))
    return this
  }

  abilityTo<A extends Ability>(clase: ClaseDeHabilidad<A>): A {
    const h = this.habilidades.get(clase)
    if (!h) throw new Error(`${this.nombre} no tiene la habilidad ${clase.name}`)
    return h as A
  }

  attemptsTo(...actividades: Activity[]): this {
    actividades.forEach((a) => {
      Cypress.log({ name: this.nombre, message: a.descripcion })
      a.performAs(this)
    })
    return this
  }

  asksFor<T>(pregunta: Question<T>): Cypress.Chainable<T> {
    Cypress.log({ name: this.nombre, message: `pregunta ${pregunta.descripcion}` })
    return pregunta.answeredBy(this)
  }

  remember(clave: string, valor: unknown): void {
    this.notas.set(clave, valor)
  }

  recall<T>(clave: string): T {
    if (!this.notas.has(clave)) throw new Error(`${this.nombre} no recuerda «${clave}»`)
    return this.notas.get(clave) as T
  }
}

/** Elenco: crea un actor por nombre en cada escenario y lo reutiliza dentro del mismo escenario. */
export class Elenco {
  private actores = new Map<string, Actor>()
  private enEscena: Actor | null = null

  constructor(private readonly preparar: (actor: Actor) => Actor) {}

  actor(nombre: string): Actor {
    if (!this.actores.has(nombre)) this.actores.set(nombre, this.preparar(new Actor(nombre)))
    this.enEscena = this.actores.get(nombre)!
    return this.enEscena
  }

  /** El último actor nombrado (para pasos con «ella» / «él»). */
  actorEnEscena(): Actor {
    if (!this.enEscena) throw new Error('No hay ningún actor en escena')
    return this.enEscena
  }

  despedir(): void {
    this.actores = new Map()
    this.enEscena = null
  }
}

/** Preferencias de visualización: tema, idioma y tamaño de texto. Lógica pura, sin React. */

export type Tema = 'claro' | 'oscuro' | 'sistema'
export type Idioma = 'es' | 'en'
export type TamanoTexto = 'small' | 'standard' | 'large' | 'xlarge'

export interface Preferencias {
  tema: Tema
  idioma: Idioma
  tamano: TamanoTexto
}

export const CLAVE_PREFERENCIAS = 'entreaulas.preferencias'

export const PREFERENCIAS_POR_DEFECTO: Preferencias = { tema: 'sistema', idioma: 'es', tamano: 'standard' }

export const TEMAS: readonly Tema[] = ['claro', 'oscuro', 'sistema']
export const IDIOMAS: readonly Idioma[] = ['es', 'en']
export const TAMANOS: readonly TamanoTexto[] = ['small', 'standard', 'large', 'xlarge']

/** Porcentaje del tamaño de letra base de cada nivel (coincide con index.css). */
export const ESCALA_TAMANO: Record<TamanoTexto, number> = { small: 87.5, standard: 100, large: 112.5, xlarge: 125 }

function esUno<T extends string>(lista: readonly T[], valor: unknown): valor is T {
  return typeof valor === 'string' && (lista as readonly string[]).includes(valor)
}

/** Valida un objeto cualquiera: los valores desconocidos vuelven al predeterminado. */
export function normalizarPreferencias(crudo: unknown): Preferencias {
  const o = (typeof crudo === 'object' && crudo !== null ? crudo : {}) as Record<string, unknown>
  return {
    tema: esUno(TEMAS, o.tema) ? o.tema : PREFERENCIAS_POR_DEFECTO.tema,
    idioma: esUno(IDIOMAS, o.idioma) ? o.idioma : PREFERENCIAS_POR_DEFECTO.idioma,
    tamano: esUno(TAMANOS, o.tamano) ? o.tamano : PREFERENCIAS_POR_DEFECTO.tamano,
  }
}

export function leerPreferencias(almacen: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Preferencias {
  try {
    const texto = almacen?.getItem(CLAVE_PREFERENCIAS)
    return normalizarPreferencias(texto ? JSON.parse(texto) : {})
  } catch {
    return { ...PREFERENCIAS_POR_DEFECTO }
  }
}

export function guardarPreferencias(
  prefs: Preferencias,
  almacen: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage
): void {
  try {
    almacen?.setItem(CLAVE_PREFERENCIAS, JSON.stringify(prefs))
  } catch {
    /* modo privado o cuota llena: la preferencia vale solo para esta sesión */
  }
}

/** `sistema` sigue la preferencia del sistema operativo. */
export function esTemaOscuro(tema: Tema, sistemaOscuro: boolean): boolean {
  return tema === 'oscuro' || (tema === 'sistema' && sistemaOscuro)
}

/** Refleja las preferencias en <html>: clase `dark`, atributo `lang` y `data-text-size`. */
export function aplicarPreferencias(prefs: Preferencias, sistemaOscuro: boolean, raiz: HTMLElement = document.documentElement) {
  raiz.classList.toggle('dark', esTemaOscuro(prefs.tema, sistemaOscuro))
  raiz.lang = prefs.idioma
  if (prefs.tamano === 'standard') raiz.removeAttribute('data-text-size')
  else raiz.setAttribute('data-text-size', prefs.tamano)
}

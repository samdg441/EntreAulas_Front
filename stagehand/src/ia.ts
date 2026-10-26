import type { Action } from '@browserbasehq/stagehand'
import type { TestSession } from './stagehand.js'

/** observe (IA) → acciones candidatas; falla si no encuentra el mínimo pedido. */
export async function observar(session: TestSession, instruccion: string, minimo = 1): Promise<Action[]> {
  const r = await session.stagehand.observe(instruccion, { page: session.page })
  if (r.data.length < minimo) throw new Error(`observe encontró ${r.data.length} elementos para «${instruccion}» (mínimo ${minimo})`)
  console.log(`  observe ✔ ${r.data.length}: ${r.data.map((a) => `${a.description} [${a.selector}]`).join(' | ')}`)
  return r.data
}

/**
 * act guiado por observe: observe (IA) traduce la instrucción en una acción concreta y act la ejecuta.
 * Con qwen2.5:7b en CPU, act("instrucción") devolvía «No action found» tras ~140 s, mientras observe acertaba
 * en ~40–80 s: es el patrón observe → act que Stagehand recomienda para modelos locales y además cachea la acción.
 */
export type OpcionesDeAct = {
  /** Comprueba el efecto esperado; si no se cumple se prueba la siguiente acción observada. */
  verificar?: () => Promise<boolean>
  /** Otras formulaciones de la instrucción si la primera no da con el elemento. */
  alternativas?: string[]
  /** Último recurso determinístico (CSS). Se registra para el análisis de limitaciones del modelo. */
  respaldoCss?: string
}

export const usosDeRespaldo: string[] = []

export async function actuar(session: TestSession, instruccion: string, opciones: OpcionesDeAct = {}): Promise<void> {
  const { verificar, alternativas = [], respaldoCss } = opciones
  for (const intento of [instruccion, ...alternativas]) {
    let acciones: Action[] = []
    try {
      acciones = await observar(session, intento)
    } catch (error) {
      console.log(`  observe ✘ ${(error as Error).message.slice(0, 120)}`)
      continue
    }
    for (const accion of acciones) {
      try {
        await ejecutar(session, accion)
      } catch (error) {
        console.log(`  act ✘ ${(error as Error).message.slice(0, 120)} → siguiente candidata`)
        continue
      }
      if (!verificar || (await verificar())) return
      console.log(`  act ⚠ ${accion.description}: la página no cambió como se esperaba → siguiente candidata`)
    }
  }
  if (respaldoCss) {
    console.log(`  respaldo ⚙ el modelo no encontró «${instruccion}»: clic determinístico en ${respaldoCss}`)
    usosDeRespaldo.push(instruccion)
    await session.page.locator(respaldoCss).first().click()
    if (!verificar || (await verificar())) return
  }
  throw new Error(`Ninguna acción observada cumplió «${instruccion}»`)
}

/** true si el texto aparece en la página antes del límite (para verificar el efecto de un act). */
export async function aparece(session: TestSession, texto: string, timeout = 8_000): Promise<boolean> {
  try {
    await esperarTexto(session, texto, timeout)
    return true
  } catch {
    return false
  }
}

/** Primera acción observada cuya descripción coincide con el patrón (reutiliza un observe en vez de repetirlo). */
export function elegir(acciones: Action[], patron: RegExp): Action {
  const accion = acciones.find((a) => patron.test(a.description))
  if (!accion) throw new Error(`Ninguna acción observada coincide con ${patron}: ${acciones.map((a) => a.description).join(' | ')}`)
  return accion
}

/** act con una acción ya observada (sin nueva inferencia); method/arguments permiten pasar de «encontrar» a «llenar». */
export async function ejecutar(session: TestSession, accion: Action, metodo?: string, valor?: string): Promise<void> {
  const final: Action = { ...accion, ...(metodo ? { method: metodo } : {}), ...(valor !== undefined ? { arguments: [valor] } : {}) }
  const r = await session.stagehand.act(final, { page: session.page })
  if (!r.data.success) throw new Error(`act no pudo ejecutar ${final.description}: ${r.data.message}`)
  console.log(`  act ✔ ${final.method ?? 'acción'} en ${final.description}${valor !== undefined && metodo === 'fill' ? ' (valor oculto)' : ''}`)
}

/** observe ubica el campo descrito y act lo llena con el valor (el valor nunca viaja al modelo). */
export async function escribir(session: TestSession, campo: string, valor: string, respaldoCss?: string): Promise<void> {
  const acciones = await observar(session, `Encuentra ${campo}`)
  for (const accion of acciones) {
    try {
      await ejecutar(session, accion, 'fill', valor)
      return
    } catch (error) {
      console.log(`  act ✘ ${(error as Error).message.slice(0, 120)} → siguiente candidata`)
    }
  }
  if (!respaldoCss) throw new Error(`Ninguna acción observada permitió llenar ${campo}`)
  console.log(`  respaldo ⚙ el modelo no ubicó el <input> de ${campo}: fill determinístico en ${respaldoCss}`)
  usosDeRespaldo.push(campo)
  await session.page.locator(respaldoCss).first().fill(valor)
}

/** Llena con una acción ya observada; si su xpath no es un campo editable, vuelve a observar ese campo. */
export async function llenar(session: TestSession, accion: Action, campo: string, valor: string, respaldoCss?: string): Promise<void> {
  try {
    await ejecutar(session, accion, 'fill', valor)
  } catch (error) {
    console.log(`  act ✘ ${(error as Error).message.slice(0, 120)} → nuevo observe de ${campo}`)
    await escribir(session, campo, valor, respaldoCss)
  }
}

/** Espera determinística a que un texto aparezca en la página. */
export async function esperarTexto(session: TestSession, texto: string, timeout = 30_000): Promise<void> {
  await session.page.waitForFunction((t) => document.body.innerText.includes(t), texto, { timeout })
}

/** Espera determinística a que la ruta cumpla la condición. */
export async function esperarRuta(session: TestSession, condicion: (ruta: string) => boolean, timeout = 60_000): Promise<string> {
  const inicio = Date.now()
  for (;;) {
    const ruta = new URL(await session.page.url()).pathname
    if (condicion(ruta)) return ruta
    if (Date.now() - inicio > timeout) throw new Error(`La ruta ${ruta} no cambió como se esperaba`)
    await session.page.waitForTimeout(250)
  }
}

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export type Medicion = {
  escenario: string
  requisito: string
  repeticiones: number
  minMs: number
  medianaMs: number
  p95Ms: number
  maxMs: number
  presupuestoMs: number
  cumple: boolean
}

function percentil(ordenados: number[], p: number) {
  const indice = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)
  return ordenados[Math.max(0, indice)]
}

const redondear = (n: number) => Math.round(n * 1000) / 1000

/**
 * Mide `fn` varias veces tras un calentamiento (el JIT optimiza las primeras corridas)
 * y compara la mediana contra el presupuesto: la mediana tolera picos aislados del equipo.
 */
export function medir(
  datos: { escenario: string; requisito: string; presupuestoMs: number; repeticiones?: number; calentamiento?: number },
  fn: () => unknown
): Medicion {
  const repeticiones = datos.repeticiones ?? 30
  for (let i = 0; i < (datos.calentamiento ?? 5); i++) fn()

  const tiempos: number[] = []
  for (let i = 0; i < repeticiones; i++) {
    const inicio = performance.now()
    fn()
    tiempos.push(performance.now() - inicio)
  }
  tiempos.sort((a, b) => a - b)

  const medianaMs = percentil(tiempos, 50)
  return {
    escenario: datos.escenario,
    requisito: datos.requisito,
    repeticiones,
    minMs: redondear(tiempos[0]),
    medianaMs: redondear(medianaMs),
    p95Ms: redondear(percentil(tiempos, 95)),
    maxMs: redondear(tiempos.at(-1)!),
    presupuestoMs: datos.presupuestoMs,
    cumple: medianaMs <= datos.presupuestoMs,
  }
}

export function guardarReporte(nombre: string, mediciones: Medicion[]) {
  const carpeta = path.resolve('reports', 'rendimiento')
  mkdirSync(carpeta, { recursive: true })
  const archivo = path.join(carpeta, `${nombre}.json`)
  writeFileSync(
    archivo,
    JSON.stringify({ fecha: new Date().toISOString(), node: process.version, mediciones }, null, 2)
  )
  return archivo
}

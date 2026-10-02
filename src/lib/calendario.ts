import type { VentanaEvaluacion } from '../api/periodos.api'

export type EstadoDia = 'inicio' | 'fin' | 'abierta' | 'normal'

export type ResumenEvaluacion =
  | { tipo: 'abierta'; ventana: VentanaEvaluacion; diasRestantes: number }
  | { tipo: 'proxima'; ventana: VentanaEvaluacion; diasParaInicio: number }
  | { tipo: 'ninguna' }

const MS_DIA = 24 * 60 * 60 * 1000

/** "2026-10-09" → fecha local (sin desfase de zona horaria). */
export function parseFecha(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime()) / MS_DIA)
}

export function estadoDelDia(dia: Date, ventanas: VentanaEvaluacion[]): EstadoDia {
  for (const v of ventanas) {
    const inicio = parseFecha(v.fechaInicio)
    const fin = parseFecha(v.fechaFin)
    if (mismoDia(dia, inicio)) return 'inicio'
    if (mismoDia(dia, fin)) return 'fin'
    if (dia > inicio && dia < fin) return 'abierta'
  }
  return 'normal'
}

export function resumenEvaluacion(hoy: Date, ventanas: VentanaEvaluacion[]): ResumenEvaluacion {
  const dia = inicioDelDia(hoy)
  const ordenadas = [...ventanas].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
  const abierta = ordenadas.find((v) => dia >= parseFecha(v.fechaInicio) && dia <= parseFecha(v.fechaFin))
  if (abierta) return { tipo: 'abierta', ventana: abierta, diasRestantes: diasEntre(dia, parseFecha(abierta.fechaFin)) }
  const proxima = ordenadas.find((v) => parseFecha(v.fechaInicio) > dia)
  if (proxima) return { tipo: 'proxima', ventana: proxima, diasParaInicio: diasEntre(dia, parseFecha(proxima.fechaInicio)) }
  return { tipo: 'ninguna' }
}

/** Mes que conviene mostrar al abrir: el de la evaluación abierta o próxima; si no hay, el actual. */
export function mesInicial(hoy: Date, ventanas: VentanaEvaluacion[]): Date {
  const resumen = resumenEvaluacion(hoy, ventanas)
  if (resumen.tipo === 'proxima') {
    const inicio = parseFecha(resumen.ventana.fechaInicio)
    return new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  }
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
}

/** Celdas del mes empezando en lunes; null = hueco antes/después del mes. */
export function celdasDelMes(mes: Date): (Date | null)[] {
  const ano = mes.getFullYear()
  const m = mes.getMonth()
  const diasMes = new Date(ano, m + 1, 0).getDate()
  const huecos = (new Date(ano, m, 1).getDay() + 6) % 7
  const total = Math.ceil((huecos + diasMes) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const n = i - huecos + 1
    return n >= 1 && n <= diasMes ? new Date(ano, m, n) : null
  })
}

export function formatoFechaLarga(iso: string): string {
  return parseFecha(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

export function textoDias(n: number): string {
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  return `en ${n} días`
}

import type { EventoAuditoria } from '../../api/auditoria.api'

/** Un rango es válido si ambos extremos están vacíos o completos y `desde` no supera a `hasta`. */
export function rangoFechasValido(desde: string, hasta: string): boolean {
  return !desde || !hasta || desde <= hasta
}

/** Evita que Excel ejecute una celda como fórmula (CSV injection): prefija con comilla las que empiezan por = + - @. */
export function celdaCsvSegura(valor: unknown): string {
  let texto = String(valor ?? '')
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function eventosACsv(
  eventos: EventoAuditoria[],
  encabezados: { cuando: string; persona: string; rol: string; accion: string; detalle: string },
  nombreAccion: (accion: string) => string
): string {
  const filas = eventos.map((e) => [e.creadoEn, e.actorNombre, e.actorRol, nombreAccion(e.accion), e.detalle])
  return [[encabezados.cuando, encabezados.persona, encabezados.rol, encabezados.accion, encabezados.detalle], ...filas]
    .map((fila) => fila.map(celdaCsvSegura).join(','))
    .join('\n')
}

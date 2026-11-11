import { describe, expect, it } from 'vitest'
import { celdaCsvSegura, eventosACsv, rangoFechasValido } from '../../../features/dashboard-coordinator/auditoria'
import type { EventoAuditoria } from '../../../api/auditoria.api'

const evento = (parcial: Partial<EventoAuditoria> = {}): EventoAuditoria => ({
  id: 1, actorId: 'u', actorNombre: 'David', actorRol: 'coordinador', accion: 'generar_qr',
  entidad: 'qr', entidadId: null, detalle: '3 códigos', creadoEn: '2026-10-01T10:00:00.000Z', ...parcial,
})

describe('rangoFechasValido', () => {
  it.each([
    ['', '', true],
    ['2026-10-01', '', true],
    ['', '2026-10-01', true],
    ['2026-10-01', '2026-10-01', true],
    ['2026-10-01', '2026-10-02', true],
    ['2026-10-02', '2026-10-01', false],
  ])('desde=%s hasta=%s → %s', (desde, hasta, esperado) => expect(rangoFechasValido(desde, hasta)).toBe(esperado))
})

describe('celdaCsvSegura (protección contra inyección de fórmulas)', () => {
  it.each(['=SUMA(A1)', '+cmd|calc', '-2+3', '@HYPERLINK("x")'])('prefija con comilla la celda peligrosa %s', (valor) => {
    expect(celdaCsvSegura(valor).replace(/^"/, '')).toMatch(/^'/)
  })

  it('entrecomilla y duplica las comillas de un texto con comas y comillas', () => {
    expect(celdaCsvSegura('dijo "hola", y salió')).toBe('"dijo ""hola"", y salió"')
  })

  it('deja intacto un texto normal y convierte null en vacío', () => {
    expect(celdaCsvSegura('Programó una encuesta')).toBe('Programó una encuesta')
    expect(celdaCsvSegura(null)).toBe('')
  })
})

describe('eventosACsv', () => {
  const encabezados = { cuando: 'Fecha', persona: 'Persona', rol: 'Rol', accion: 'Acción', detalle: 'Detalle' }

  it('genera encabezado y una fila por evento, con la acción traducida', () => {
    const csv = eventosACsv([evento()], encabezados, () => 'Generó códigos QR')

    expect(csv.split('\n')).toEqual([
      'Fecha,Persona,Rol,Acción,Detalle',
      '2026-10-01T10:00:00.000Z,David,coordinador,Generó códigos QR,3 códigos',
    ])
  })

  it('neutraliza una fórmula escrita en el nombre de la persona', () => {
    const csv = eventosACsv([evento({ actorNombre: '=1+1' })], encabezados, (a) => a)

    expect(csv.split('\n')[1]).toContain("'=1+1")
  })

  it('sin eventos solo trae el encabezado', () => {
    expect(eventosACsv([], encabezados, (a) => a).split('\n')).toHaveLength(1)
  })
})

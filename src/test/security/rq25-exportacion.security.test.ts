import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { exportCoordinatorReportExcel, usuarioPuedeExportarReporte } from '../../utils/reporte-exportacion'

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }))
vi.mock('file-saver', () => ({ saveAs }))

function leerBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as ArrayBuffer)
    lector.onerror = () => reject(lector.error)
    lector.readAsArrayBuffer(blob)
  })
}

async function libroDescargado() {
  const blob = saveAs.mock.calls[0][0] as Blob
  return XLSX.read(new Uint8Array(await leerBlob(blob)), { type: 'array' })
}

/**
 * RQ25 — El Excel exportado no debe ejecutar nada al abrirse (inyección de fórmulas / CSV injection)
 * y solo los roles de gestión pueden exportar.
 */
describe('RQ25 — Seguridad: exportación del reporte', () => {
  beforeEach(() => saveAs.mockClear())

  it.each([
    '=HYPERLINK("http://evil.co","clic")',
    '+cmd|"/C calc"!A0',
    '-2+3',
    '@SUM(1+1)',
  ])('el texto %j queda como texto, nunca como fórmula', async (malicioso) => {
    exportCoordinatorReportExcel([{ DOCENTE: malicioso, ASIGNATURA: 'Cálculo', PROMEDIO: 4.2 }], 'r.xlsx')

    const libro = await libroDescargado()
    for (const hoja of ['Evaluaciones', 'Consulta', 'Docentes']) {
      const celdas = Object.entries(libro.Sheets[hoja]).filter(([ref]) => !ref.startsWith('!'))
      expect(celdas.some(([, celda]) => (celda as XLSX.CellObject).f)).toBe(false)
    }
    expect(libro.Sheets.Evaluaciones.A2).toMatchObject({ t: 's', v: malicioso })
  })

  it('el archivo se descarga con el nombre pedido y tipo xlsx', () => {
    exportCoordinatorReportExcel([{ DOCENTE: 'Ana' }], 'reporte-coordinador-2026-1.xlsx')

    const [blob, nombre] = saveAs.mock.calls[0]
    expect(nombre).toBe('reporte-coordinador-2026-1.xlsx')
    expect((blob as Blob).type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it.each([
    ['coordinator', true],
    ['dean', true],
    ['teacher', true],
    ['admin', true],
    ['student', false],
    ['', false],
    [undefined, false],
    ['Coordinator', false],
    [' admin', false],
    ['coordinator,admin', false],
  ])('permiso de exportar para %j → %s', (tipo, esperado) => {
    expect(usuarioPuedeExportarReporte(tipo)).toBe(esperado)
  })
})

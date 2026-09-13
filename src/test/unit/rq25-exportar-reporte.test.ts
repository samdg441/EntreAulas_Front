import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  armarModeloExcelCoordinador,
  exportCoordinatorReportExcel,
  nombreArchivoExcelReporte,
  usuarioPuedeExportarReporte,
} from '../../utils/reporte-exportacion'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

class RFREP25ExportarReporte {
  C1_noAutorizado() {
    expect(usuarioPuedeExportarReporte('student')).toBe(false)
    expect(usuarioPuedeExportarReporte(undefined)).toBe(false)
  }

  C2_autorizado() {
    expect(usuarioPuedeExportarReporte('coordinator')).toBe(true)
    expect(usuarioPuedeExportarReporte('dean')).toBe(true)
    expect(usuarioPuedeExportarReporte('teacher')).toBe(true)
    expect(usuarioPuedeExportarReporte('admin')).toBe(true)
  }

  C3_armaArchivoConInformacion() {
    const filas = [
      {
        DOCENTE: 'Ana Pérez',
        ASIGNATURA: 'Cálculo',
        GRUPO: '1',
        ESTUDIANTES: 30,
        ESTUDIANTES_EVALUADORES: 2,
        SABER_ESPECIFICO: 4.5,
        PROMEDIO: 4.2,
      },
    ]
    const modelo = armarModeloExcelCoordinador(filas)
    expect(modelo.headerRow).toContain('DOCENTE')
    expect(modelo.headerRow).toContain('SABER ESPECÍFICO')
    expect(modelo.dataRows[0]).toContain('Ana Pérez')
    expect(modelo.dataRows[0]).toContain(4.2)

    const filename = nombreArchivoExcelReporte('2026-1', true)
    expect(filename).toBe('reporte-coordinador-2026-1.xlsx')

    exportCoordinatorReportExcel(filas, filename)
    expect(saveAs).toHaveBeenCalled()
    const [blob, name] = vi.mocked(saveAs).mock.calls[0]
    expect(name).toBe(filename)
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).size).toBeGreaterThan(0)
    expect((blob as Blob).type).toContain('spreadsheet')
  }

  C4_sinFilasGeneraPlantilla() {
    const modelo = armarModeloExcelCoordinador([])
    expect(modelo.headerRow).not.toHaveLength(0)
    expect(modelo.dataRows).toEqual([])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([modelo.headerRow]), 'Evaluaciones')
    const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    expect(bytes.byteLength).toBeGreaterThan(0)
  }

  C5_ramasDeNombreYCeldasVacias() {
    expect(nombreArchivoExcelReporte('2026-1')).toBe('reporte-2026-1.xlsx')
    expect(nombreArchivoExcelReporte('   ')).toBe('reporte-todo.xlsx')

    const modelo = armarModeloExcelCoordinador([
      {
        DOCENTE: 'Ana',
        METODOLOGIA: 5,
        EVALUACION: null,
        RELACION_ESTUDIANTE: undefined,
      },
    ])
    expect(modelo.headerRow).toContain('METODOLOGÍA')
    expect(modelo.headerRow).toContain('RELACIÓN CON LOS ESTUDIANTES')
    expect(modelo.dataRows[0]).toContain('')
  }
}

const pruebas = new RFREP25ExportarReporte()

describe('RF-REP-25 — Exportación de reportes (frontend)', () => {
  it('C1: estudiante no exporta', () => pruebas.C1_noAutorizado())
  it('C2: roles autorizados pueden exportar', () => pruebas.C2_autorizado())
  it('C3: genera xlsx descargable con la información', () => pruebas.C3_armaArchivoConInformacion())
  it('C4: sin datos igual genera archivo', () => pruebas.C4_sinFilasGeneraPlantilla())
  it('C5: nombre, celdas vacías y categorías', () => pruebas.C5_ramasDeNombreYCeldasVacias())
})

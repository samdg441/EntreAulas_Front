import { describe, expect, it, vi } from 'vitest'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import {
  armarModeloExcelCoordinador,
  exportCoordinatorReportExcel,
  nombreArchivoExcelReporte,
  usuarioPuedeExportarReporte,
} from '../../utils/reporte-exportacion'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    aoa_to_sheet: vi.fn((rows: unknown[]) => ({ rows })),
    encode_col: vi.fn(() => 'G'),
    book_append_sheet: vi.fn(),
  },
  write: vi.fn(() => new Uint8Array([1, 2, 3])),
}))

/**
 * RQ25 en la pantalla — el botón de Excel.
 * La pantalla usa los nombres de rol en inglés que guarda la sesión:
 * coordinator, dean, teacher, admin.
 * Esta prueba no descarga un archivo: solo revisa el permiso, el nombre y las columnas.
 */
describe('RQ25 — exportar el reporte en pantalla', () => {
  it('coordinador, decano, docente y admin pueden exportar', () => {
    // Arrange
    const roles = ['coordinator', 'dean', 'teacher', 'admin']

    // Act
    const permisos = roles.map(usuarioPuedeExportarReporte)

    // Assert
    expect(permisos).toEqual([true, true, true, true])
  })

  it('un estudiante, o alguien sin rol, no puede exportar', () => {
    // Arrange
    const estudiante = 'student'
    const vacio = undefined

    // Act
    const noEstudiante = usuarioPuedeExportarReporte(estudiante)
    const noVacio = usuarioPuedeExportarReporte(vacio)

    // Assert
    expect(noEstudiante).toBe(false)
    expect(noVacio).toBe(false)
  })

  it('el nombre del archivo lleva el periodo', () => {
    // Arrange
    const period = '2026-1'

    // Act
    const deCoordinacion = nombreArchivoExcelReporte(period, true)
    const general = nombreArchivoExcelReporte(period, false)
    const sinPeriodo = nombreArchivoExcelReporte('  ', true)

    // Assert
    expect(deCoordinacion).toBe('reporte-coordinador-2026-1.xlsx')
    expect(general).toBe('reporte-2026-1.xlsx')
    expect(sinPeriodo).toBe('reporte-coordinador-todo.xlsx')
  })

  it('las columnas fijas van primero y el promedio al final', () => {
    // Arrange
    const filas = [
      {
        PROMEDIO: 4.2,
        DOCENTE: 'Ana Pérez',
        METODOLOGIA: 4,
        ASIGNATURA: 'Cálculo',
        GRUPO: 'A',
      },
    ]

    // Act
    const libro = armarModeloExcelCoordinador(filas)

    // Assert
    expect(libro.columns[0]).toBe('DOCENTE')
    expect(libro.columns[1]).toBe('ASIGNATURA')
    expect(libro.columns[libro.columns.length - 1]).toBe('PROMEDIO')
    expect(libro.headerRow).toContain('METODOLOGÍA')
    expect(libro.dataRows[0][0]).toBe('Ana Pérez')
  })

  it('una lista vacía deja los encabezados institucionales, sin filas', () => {
    // Arrange
    const filas: unknown[] = []

    // Act
    const libro = armarModeloExcelCoordinador(filas)

    // Assert
    expect(libro.dataRows).toEqual([])
    expect(libro.headerRow[0]).toBe('DOCENTE')
    expect(libro.headerRow[libro.headerRow.length - 1]).toBe('PROMEDIO')
  })

  it('un valor nulo se escribe como celda vacía', () => {
    // Arrange
    const filas = [{ DOCENTE: 'Ana', PROMEDIO: null }]

    // Act
    const libro = armarModeloExcelCoordinador(filas)

    // Assert
    expect(libro.dataRows[0][1]).toBe('')
  })

  it('si las filas no son una lista, el libro sale vacío y no se rompe', () => {
    // Arrange
    const raro = null as unknown as unknown[]

    // Act
    const libro = armarModeloExcelCoordinador(raro)

    // Assert
    expect(libro.safeRows).toEqual([])
    expect(libro.dataRows).toHaveLength(0)
  })

  it('ordena las categorías y descarga el libro con la hoja de docentes', () => {
    const filas = [
      {
        docente: 'ana',
        DOCENTE: 'Ana Pérez',
        ASIGNATURA: 'Cálculo',
        SABER_ESPECIFICO: 5,
        RELACION_ESTUDIANTES: 2,
        EVALUACION: 3,
        METODOLOGIA: 4,
        OTRA_MEDIDA: 1,
        PROMEDIO: null,
      },
      { DOCENTE: '', ASIGNATURA: 'Física', METODOLOGIA: 1 },
    ]

    const libro = armarModeloExcelCoordinador(filas)
    exportCoordinatorReportExcel(filas, 'reporte-coordinador.xlsx')

    expect(libro.headerRow).toContain('SABER ESPECÍFICO')
    expect(libro.headerRow).toContain('METODOLOGÍA')
    expect(libro.headerRow).toContain('EVALUACIÓN')
    expect(libro.headerRow).toContain('RELACIÓN CON LOS ESTUDIANTES')
    expect(libro.headerRow.indexOf('SABER ESPECÍFICO')).toBeLessThan(libro.headerRow.indexOf('METODOLOGÍA'))
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3)
    expect(saveAs).toHaveBeenCalled()
  })
})

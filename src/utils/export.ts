import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export async function exportElementToPNG(element: HTMLElement, filename = 'reporte.png') {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename)
  })
}

export async function exportElementToPDF(element: HTMLElement, filename = 'reporte.pdf') {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'pt', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let position = 0
  let heightLeft = imgHeight

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    pdf.addPage()
    position = heightLeft - imgHeight
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}

export function exportObjectsToExcel(sheets: { name: string, rows: any[] }[], filename = 'reporte.xlsx') {
  const workbook = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    const safeName = name.substring(0, 31) || 'Hoja'
    const sheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, sheet, safeName)
  })
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}

export function exportFilteredExcel(rows: any[], filename = 'reporte.xlsx', sheetName = 'Resultados') {
  const workbook = XLSX.utils.book_new()
  const safeName = sheetName.substring(0, 31) || 'Hoja'
  const ws = XLSX.utils.json_to_sheet(rows || [])

  const range = ws['!ref'] || 'A1'
  ws['!autofilter'] = { ref: range }

  // Ajuste simple de anchos para legibilidad
  const headers = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(45, Math.max(12, String(h).length + 2)) }))

  XLSX.utils.book_append_sheet(workbook, ws, safeName)
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}

function normalizeCoordinatorKey(key: string) {
  return String(key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Encabezados visibles alineados al formato institucional (correo coordinación). */
function coordinatorExcelHeader(key: string): string {
  const k = String(key || '').trim()
  const n = normalizeCoordinatorKey(k)
  const fixed: Record<string, string> = {
    DOCENTE: 'DOCENTE',
    ASIGNATURA: 'ASIGNATURA',
    GRUPO: 'GRUPO',
    ESTUDIANTES: 'ESTUDIANTES',
    ESTUDIANTES_EVALUADORES: 'ESTUDIANTES EVALUADORES',
    PROMEDIO: 'PROMEDIO'
  }
  if (fixed[k.toUpperCase()]) return fixed[k.toUpperCase()]
  if (n.includes('SABER') && n.includes('ESPECIFICO')) return 'SABER ESPECÍFICO'
  if (n.includes('METODOLOGIA')) return 'METODOLOGÍA'
  if (n.includes('RELACION') && n.includes('ESTUDIANTE')) return 'RELACIÓN CON LOS ESTUDIANTES'
  if (n.includes('EVALUACION')) return 'EVALUACIÓN'
  return k.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}

function categoryColumnSortIndex(key: string): number {
  const n = normalizeCoordinatorKey(key)
  if (n.includes('SABER') && n.includes('ESPECIFICO')) return 10
  if (n.includes('METODOLOGIA')) return 20
  if (n.includes('EVALUACION')) return 30
  if (n.includes('RELACION')) return 40
  return 50
}

export function exportCoordinatorReportExcel(rows: any[], filename = 'reporte-coordinador.xlsx') {
  const workbook = XLSX.utils.book_new()
  const safeRows = Array.isArray(rows) ? rows : []

  const fixedPrefix = ['DOCENTE', 'ASIGNATURA', 'GRUPO', 'ESTUDIANTES', 'ESTUDIANTES_EVALUADORES'] as const
  const fixedSuffix = ['PROMEDIO'] as const

  const allKeys = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row || {}))))
  const prefixPresent = fixedPrefix.filter((col) => allKeys.includes(col))
  const suffixPresent = fixedSuffix.filter((col) => allKeys.includes(col))
  const middleKeys = allKeys.filter(
    (col) => !fixedPrefix.includes(col as any) && !fixedSuffix.includes(col as any)
  )
  middleKeys.sort((a, b) => {
    const ia = categoryColumnSortIndex(a)
    const ib = categoryColumnSortIndex(b)
    if (ia !== ib) return ia - ib
    return coordinatorExcelHeader(a).localeCompare(coordinatorExcelHeader(b), 'es')
  })

  let columns = [...prefixPresent, ...middleKeys, ...suffixPresent]
  if (columns.length === 0) {
    columns = ['DOCENTE', 'ASIGNATURA', 'GRUPO', 'ESTUDIANTES', 'ESTUDIANTES_EVALUADORES', 'PROMEDIO']
  }

  const headerRow = columns.map((col) => coordinatorExcelHeader(col))
  const dataRows = safeRows.map((row) => columns.map((col) => {
    const v = row?.[col]
    if (v === null || v === undefined) return ''
    return v
  }))

  const mainSheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const lastCol = XLSX.utils.encode_col(Math.max(columns.length - 1, 0))
  const lastRow = Math.max(1, dataRows.length + 1)
  mainSheet['!autofilter'] = { ref: `A1:${lastCol}${lastRow}` }
  mainSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  mainSheet['!cols'] = columns.map((col) => {
    const label = coordinatorExcelHeader(col)
    const sample = safeRows.slice(0, 200).map((row) => String(row?.[col] ?? ''))
    const maxContent = Math.max(label.length, ...sample.map((s) => s.length), 8)
    return { wch: Math.min(48, Math.max(10, maxContent + 2)) }
  })

  const docentes = Array.from(new Set(safeRows.map((row) => String(row?.DOCENTE || '').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
  const docentesSheet = XLSX.utils.aoa_to_sheet([
    ['DOCENTE (lista para referencia)'],
    ...docentes.map((d) => [d])
  ])
  docentesSheet['!cols'] = [{ wch: 48 }]

  // Hoja de consulta estilo plantilla: misma vista pero con autofiltro nativo (sin fórmulas dinámicas).
  const queryHeaderRow = 8
  const querySheet = XLSX.utils.aoa_to_sheet([
    ['EVALUACION DOCENTE'],
    ['REPORTE CONSOLIDADO POR DOCENTE'],
    [''],
    ['Usa +Filtrar en la fila de encabezados para filtrar por DOCENTE, ASIGNATURA o GRUPO'],
    [''],
    ['Tip: puedes revisar la hoja "Docentes" para ver nombres disponibles'],
    [''],
    headerRow,
    ...dataRows
  ])
  const queryLastRow = Math.max(queryHeaderRow, queryHeaderRow + dataRows.length)
  querySheet['!autofilter'] = { ref: `A${queryHeaderRow}:${lastCol}${queryLastRow}` }
  querySheet['!freeze'] = { xSplit: 0, ySplit: queryHeaderRow }
  querySheet['!cols'] = columns.map((col) => {
    const label = coordinatorExcelHeader(col)
    const sample = safeRows.slice(0, 200).map((row) => String(row?.[col] ?? ''))
    const maxContent = Math.max(label.length, ...sample.map((s) => s.length), 8)
    return { wch: Math.min(48, Math.max(10, maxContent + 2)) }
  })

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Evaluaciones')
  XLSX.utils.book_append_sheet(workbook, querySheet, 'Consulta')
  XLSX.utils.book_append_sheet(workbook, docentesSheet, 'Docentes')
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}



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

export {
  armarModeloExcelCoordinador,
  exportCoordinatorReportExcel,
  nombreArchivoExcelReporte,
  usuarioPuedeExportarReporte,
} from './reporte-exportacion'



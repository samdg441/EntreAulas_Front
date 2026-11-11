/** Vista de auditoría del coordinador: tabla, resumen, filtros, exportación y estados. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

const fetchAuditoria = vi.fn()
vi.mock('../../api/auditoria.api', async () => {
  const real = await vi.importActual<typeof import('../../api/auditoria.api')>('../../api/auditoria.api')
  return { ...real, fetchAuditoria: (...a: unknown[]) => fetchAuditoria(...a) }
})

import AuditoriaPage from '../../features/dashboard-coordinator/AuditoriaPage'

const evento = (id: number, accion: string, detalle: string, actorNombre = 'David Coordinador') => ({
  id, actorId: 'u', actorNombre, actorRol: 'coordinador', accion, entidad: 'x', entidadId: null, detalle, creadoEn: `2026-10-0${id}T10:00:00.000Z`,
})
const respuesta = (eventos = [evento(2, 'programar_encuesta', 'Periodo 2026-2'), evento(1, 'generar_qr', '4 códigos QR')]) => ({
  disponible: true,
  eventos,
  resumen: { total: eventos.length, porAccion: { programar_encuesta: 1, generar_qr: 1 }, ultimoEvento: eventos[0]?.creadoEn ?? null },
  pagination: { page: 1, pageSize: 10, total: eventos.length, totalPages: eventos.length ? 1 : 0 },
})

describe('AuditoriaPage', () => {
  beforeEach(() => {
    simularMatchMedia(false)
    window.localStorage.clear()
    fetchAuditoria.mockResolvedValue(respuesta())
  })

  it('lista los eventos con fecha, persona, acción y detalle', async () => {
    renderConPreferencias(<AuditoriaPage />)

    const tabla = await screen.findByRole('table')
    const filas = within(tabla).getAllByRole('row')

    expect(filas).toHaveLength(3)
    expect(within(filas[1]).getByText('Programó una encuesta')).toBeInTheDocument()
    expect(within(filas[1]).getByText('Periodo 2026-2')).toBeInTheDocument()
    expect(within(filas[2]).getByText('Generó códigos QR')).toBeInTheDocument()
  })

  it('el resumen muestra el total y cuántos eventos hay por acción', async () => {
    renderConPreferencias(<AuditoriaPage />)

    const resumen = await screen.findByLabelText('Eventos por acción')

    expect(within(resumen).getByText('Eventos registrados')).toBeInTheDocument()
    expect(within(resumen).getAllByText('1')).toHaveLength(2)
    expect(within(resumen).getAllByText('0')).toHaveLength(2)
  })

  it('al elegir una acción pide al servidor ese filtro y vuelve a la página 1', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<AuditoriaPage />)
    await screen.findByRole('table')

    await usuario.selectOptions(screen.getByLabelText('Acción'), 'Generó códigos QR')

    await waitFor(() =>
      expect(fetchAuditoria).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'generar_qr', page: 1, pageSize: 10 }))
    )
  })

  it('un rango de fechas invertido avisa y no consulta al servidor', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<AuditoriaPage />)
    await screen.findByRole('table')
    fetchAuditoria.mockClear()

    await usuario.type(screen.getByLabelText('Desde'), '2026-10-20')
    await usuario.type(screen.getByLabelText('Hasta'), '2026-10-01')

    expect(await screen.findByRole('alert')).toHaveTextContent('La fecha inicial no puede ser posterior a la final.')
    expect(screen.getByLabelText('Desde')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchAuditoria).not.toHaveBeenCalledWith(expect.objectContaining({ desde: '2026-10-20', hasta: '2026-10-01' }))
  })

  it('"Limpiar filtros" aparece solo con filtros activos y los reinicia', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<AuditoriaPage />)
    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()

    await usuario.selectOptions(screen.getByLabelText('Acción'), 'Consultó reportes')
    await usuario.click(await screen.findByRole('button', { name: 'Limpiar filtros' }))

    expect(screen.getByLabelText('Acción')).toHaveValue('todas')
  })

  it('sin eventos muestra un estado vacío que explica cuándo aparecen', async () => {
    fetchAuditoria.mockResolvedValue(respuesta([]))
    renderConPreferencias(<AuditoriaPage />)

    expect(await screen.findByText('No hay eventos con esos filtros.')).toBeInTheDocument()
    expect(screen.getByText(/Los eventos aparecen cuando alguien programa una encuesta/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
  })

  it('si la tabla de auditoría aún no existe muestra un aviso en lugar de la tabla', async () => {
    fetchAuditoria.mockResolvedValue({ ...respuesta([]), disponible: false, aviso: 'Falta crear la tabla' })
    renderConPreferencias(<AuditoriaPage />)

    expect(await screen.findByRole('heading', { name: 'La auditoría aún no está activa' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('si el servidor falla muestra una alerta', async () => {
    fetchAuditoria.mockRejectedValue(new Error('500'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderConPreferencias(<AuditoriaPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la auditoría.')
  })

  it('exportar CSV descarga un archivo con los eventos visibles (Spy sobre Blob y enlace)', async () => {
    const usuario = userEvent.setup()
    const crear = vi.fn(() => 'blob:csv')
    const revocar = vi.fn()
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar })
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderConPreferencias(<AuditoriaPage />)
    await screen.findByRole('table')

    await usuario.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(crear).toHaveBeenCalledOnce()
    const blob = (crear.mock.calls[0] as unknown as [Blob])[0]
    expect(blob.type).toContain('text/csv')
    const contenido = await new Promise<string>((ok) => {
      const lector = new FileReader()
      lector.onload = () => ok(String(lector.result))
      lector.readAsText(blob)
    })
    expect(contenido).toContain('Programó una encuesta')
    expect(clic).toHaveBeenCalledOnce()
    expect(revocar).toHaveBeenCalledWith('blob:csv')
  })

  it('la interfaz de la auditoría cambia a inglés', async () => {
    window.localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: 'claro', idioma: 'en', tamano: 'standard' }))
    renderConPreferencias(<AuditoriaPage />)

    const tabla = await screen.findByRole('table')

    expect(within(tabla).getByText('Scheduled a survey')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument()
  })
})

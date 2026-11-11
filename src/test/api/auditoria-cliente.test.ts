/** Contrato del cliente de la auditoría: construye la consulta exacta que espera el back (Stub de axios). */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('../../api/client', () => ({ apiClient: { get: (...a: unknown[]) => get(...a) } }))

import { fetchAuditoria } from '../../api/auditoria.api'

describe('fetchAuditoria', () => {
  beforeEach(() => get.mockResolvedValue({ data: { disponible: true, eventos: [] } }))

  it('sin filtros pide la ruta sin query', async () => {
    await fetchAuditoria()
    expect(get).toHaveBeenCalledWith('/api/coordinador/auditoria')
  })

  it('incluye solo los filtros con valor y omite "todas"', async () => {
    await fetchAuditoria({ page: 2, pageSize: 10, accion: 'todas', desde: '2026-10-01', search: '  ana  ' })
    expect(get).toHaveBeenCalledWith('/api/coordinador/auditoria?page=2&pageSize=10&desde=2026-10-01&search=ana')
  })

  it('codifica caracteres especiales de la búsqueda', async () => {
    await fetchAuditoria({ search: 'a&b=c#' })
    expect(get).toHaveBeenCalledWith('/api/coordinador/auditoria?search=a%26b%3Dc%23')
  })

  it('devuelve el cuerpo de la respuesta', async () => {
    expect(await fetchAuditoria({ accion: 'generar_qr' })).toEqual({ disponible: true, eventos: [] })
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { createQrEvaluationsBatch, shareQrEvaluationsEmail } from '../../api/evaluations.api'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * RQ18 — Contrato HTTP del envío de QR por correo.
 * Comprueba lo que el front manda al back y cómo interpreta cada respuesta.
 */
describe('RQ18 — API de QR por correo', () => {
  let api: ReturnType<typeof montarApiFalsa>

  afterEach(() => api?.restaurar())

  const pedido = {
    to: 'ana@udemedellin.edu.co',
    subject: 'Evaluación docente',
    message: 'Hola',
    grupoIds: [12, 13],
  }

  it('POST /share-email lleva el token de sesión y el body completo', async () => {
    window.localStorage.setItem('token', 'jwt-coordinador')
    api = montarApiFalsa(() => ({ status: 200, data: { message: 'Correo enviado correctamente', totalLinks: 2 } }))

    const data = await shareQrEvaluationsEmail(pedido)

    expect(data).toEqual({ message: 'Correo enviado correctamente', totalLinks: 2 })
    expect(api.peticiones).toHaveLength(1)
    expect(api.peticiones[0]).toMatchObject({
      metodo: 'POST',
      url: '/api/qr-evaluaciones/share-email',
      authorization: 'Bearer jwt-coordinador',
      body: pedido,
    })
  })

  it('sin sesión no inventa un Authorization', async () => {
    api = montarApiFalsa(() => ({ status: 401, data: { error: 'Token de acceso requerido' } }))
    window.history.pushState({}, '', '/qr-evaluacion/abc')

    await expect(shareQrEvaluationsEmail(pedido)).rejects.toMatchObject({ response: { status: 401 } })
    expect(api.peticiones[0].authorization).toBeUndefined()
  })

  it('un 400 del back conserva el mensaje para mostrarlo al usuario', async () => {
    api = montarApiFalsa(() => ({ status: 400, data: { error: 'Correo de destino inválido.' } }))

    await expect(shareQrEvaluationsEmail({ ...pedido, to: 'no-es-correo' })).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Correo de destino inválido.' } },
    })
  })

  it('un timeout se propaga como error de red, no como éxito silencioso', async () => {
    api = montarApiFalsa(() => ({ error: 'timeout' }))

    await expect(shareQrEvaluationsEmail(pedido)).rejects.toMatchObject({ code: 'ECONNABORTED' })
  })

  it('POST /batch manda solo los grupoIds y devuelve creados y omitidos', async () => {
    api = montarApiFalsa(() => ({
      status: 200,
      data: { created: [{ grupoId: 12, token: 't-12' }], skipped: [{ grupoId: 13, reason: 'sin profesor' }] },
    }))

    const resp = await createQrEvaluationsBatch([12, 13])

    expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/qr-evaluaciones/batch', body: { grupoIds: [12, 13] } })
    expect(resp.created).toHaveLength(1)
    expect(resp.skipped?.[0].reason).toBe('sin profesor')
  })
})

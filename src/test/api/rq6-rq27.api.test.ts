import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { autoEnrollQrEvaluation, createQrEvaluationsBatch, getQrEvaluation, shareQrEvaluationsEmail } from '../../api/evaluations.api'
import { fetchStudentEnrolledSubjects } from '../../api/teachers'
import { sembrarSesion } from '../helpers/render'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * RQ14, RQ15, RQ16, RQ17 y RQ27 — El cliente manda la ruta y el token correctos
 * y conserva el cuerpo que devuelve el back.
 */
describe('RQ14–RQ17 y RQ27 — API del cliente', () => {
  let api: ReturnType<typeof montarApiFalsa>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    sembrarSesion({ tipo_usuario: 'estudiante', roles: ['estudiante'] }, 'jwt-estudiante')
  })
  afterEach(() => api?.restaurar())

  it('RQ17: pide el QR con el token en la ruta', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { grupoId: 63, cursoCodigo: 'SIS-101' } }))

    await expect(getQrEvaluation('tok-14')).resolves.toMatchObject({ grupoId: 63 })

    expect(api.peticiones[0]).toMatchObject({ metodo: 'GET', url: '/api/qr-evaluaciones/tok-14', authorization: 'Bearer jwt-estudiante' })
  })

  it('RQ14: auto-inscribe con POST al token del QR', async () => {
    api = montarApiFalsa(() => ({ status: 201, data: { enrolled: true, created: true, grupoId: 63 } }))

    await expect(autoEnrollQrEvaluation('tok-14')).resolves.toMatchObject({ enrolled: true, grupoId: 63 })

    expect(api.peticiones[0].metodo).toBe('POST')
    expect(api.peticiones[0].url).toBe('/api/qr-evaluaciones/tok-14/auto-enroll')
  })

  it('RQ15: envía los grupos al lote de QR', async () => {
    api = montarApiFalsa(() => ({ status: 201, data: { created: [{ grupoId: 63, token: 'tok-14' }], skipped: [] } }))

    await expect(createQrEvaluationsBatch([63])).resolves.toMatchObject({ created: [{ grupoId: 63, token: 'tok-14' }] })

    expect(api.peticiones[0]).toMatchObject({ metodo: 'POST', url: '/api/qr-evaluaciones/batch', body: { grupoIds: [63] } })
  })

  it('RQ16: un correo rechazado no se da por enviado', async () => {
    api = montarApiFalsa(() => ({ status: 400, data: { error: 'Correo de destino inválido.' } }))

    await expect(
      shareQrEvaluationsEmail({ to: 'no-es-correo', subject: 'QR', message: 'Hola', grupoIds: [63] })
    ).rejects.toBeTruthy()

    expect(api.peticiones[0].url).toBe('/api/qr-evaluaciones/share-email')
  })

  it('RQ27: pide las materias del estudiante autenticado', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { materiasMatriculadas: [{ id: 11 }], total: 1 } }))

    await expect(fetchStudentEnrolledSubjects()).resolves.toMatchObject({ total: 1 })

    expect(api.peticiones[0]).toMatchObject({
      metodo: 'GET',
      url: '/api/teachers/student-enrolled-subjects',
      authorization: 'Bearer jwt-estudiante',
    })
  })

  it('RQ27: si el back niega el rol, el cliente no inventa materias', async () => {
    api = montarApiFalsa(() => ({ status: 403, data: { error: 'Solo los estudiantes pueden acceder a esta información' } }))

    await expect(fetchStudentEnrolledSubjects()).rejects.toThrow('Error al obtener las materias matriculadas')
  })
})

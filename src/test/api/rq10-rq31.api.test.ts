import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fetchStudentStats, submitEvaluation } from '../../api/teachers'
import { usersApi } from '../../api/users'
import { summarizeOpenResponses } from '../../api/ai'
import AISummaryCard from '../../components/AISummaryCard'
import { sembrarSesion } from '../helpers/render'
import { montarApiFalsa } from '../helpers/api-falsa'

/**
 * Contrato del cliente con el back para RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31:
 * método, ruta, cuerpo y cómo se conserva o se rechaza la respuesta.
 */
const evaluacion = {
  teacherId: '7',
  courseId: '31',
  groupId: '4',
  answers: [{ questionId: 1, rating: 5, textAnswer: null }],
  overallRating: 5,
  comments: 'claridad',
}

describe('RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 — API del cliente', () => {
  let api: ReturnType<typeof montarApiFalsa>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    window.history.pushState({}, '', '/login')
    sembrarSesion({ tipo_usuario: 'estudiante', roles: ['estudiante'] }, 'jwt-estudiante')
  })
  afterEach(() => {
    api?.restaurar()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('RQ10: pide las estadísticas del estudiante autenticado y conserva el cuerpo', async () => {
    api = montarApiFalsa(() => ({
      status: 200,
      data: {
        evaluacionesCompletadas: 2,
        evaluacionesPendientes: 0,
        materiasMatriculadas: 2,
        promedioGeneral: 4.5,
        progresoGeneral: 100,
      },
    }))

    await expect(fetchStudentStats()).resolves.toMatchObject({ evaluacionesCompletadas: 2, promedioGeneral: 4.5 })

    expect(api.peticiones[0]).toMatchObject({
      metodo: 'GET',
      url: '/api/teachers/student-stats',
      authorization: 'Bearer jwt-estudiante',
    })
  })

  it('RQ10: si el back niega el rol, el cliente no inventa estadísticas', async () => {
    api = montarApiFalsa(() => ({ status: 403, data: { error: 'Solo los estudiantes pueden acceder a estas estadísticas' } }))

    await expect(fetchStudentStats()).rejects.toThrow('Error al obtener las estadísticas del estudiante')
  })

  it('RQ11: envía la evaluación al back y devuelve el id', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { success: true, message: 'Evaluación guardada', evaluationId: 'eval-1' } }))

    await expect(submitEvaluation(evaluacion)).resolves.toMatchObject({ success: true, evaluationId: 'eval-1' })

    expect(api.peticiones[0]).toMatchObject({
      metodo: 'POST',
      url: '/api/teachers/evaluations',
      authorization: 'Bearer jwt-estudiante',
      body: evaluacion,
    })
  })

  it('RQ11: un rechazo del back no se convierte en un envío exitoso', async () => {
    api = montarApiFalsa(() => ({ status: 409, data: { error: 'Ya has evaluado a este profesor para este curso y grupo' } }))

    await expect(submitEvaluation(evaluacion)).rejects.toMatchObject({ response: { status: 409 } })
  })

  it('RQ13: lista, crea, actualiza y desactiva por las rutas de usuarios', async () => {
    api = montarApiFalsa((peticion) => {
      if (peticion.metodo === 'GET') return { status: 200, data: { users: [{ id: 'u-1', email: 'ana@soyudemedellin.edu.co', nombre: 'Ana' }] } }
      if (peticion.metodo === 'POST') return { status: 201, data: { message: 'Usuario creado exitosamente', user: { id: 'u-2', email: 'luis@soyudemedellin.edu.co' } } }
      if (peticion.metodo === 'PUT') return { status: 200, data: { message: 'Usuario actualizado', user: { id: 'u-1', nombre: 'Ana' } } }
      return { status: 200, data: { message: 'Usuario desactivado', user: { id: 'u-1', activo: false } } }
    })
    sembrarSesion({ tipo_usuario: 'admin', roles: ['admin'] }, 'jwt-admin')

    const lista = await usersApi.list()
    const alta = await usersApi.create({
      email: 'luis@soyudemedellin.edu.co',
      password: 'Clave-Segura2026!',
      nombre: 'Luis',
      apellido: 'Gomez',
      tipo_usuario: 'estudiante',
    })
    await usersApi.update('u-1', { nombre: 'Ana' })
    await usersApi.deactivate('u-2')

    expect(lista.users[0]).toMatchObject({ id: 'u-1' })
    expect(alta.user).not.toHaveProperty('password')
    expect(api.peticiones.map((p) => [p.metodo, p.url])).toEqual([
      ['GET', '/api/users'],
      ['POST', '/api/auth/create-user'],
      ['PUT', '/api/users/u-1'],
      ['DELETE', '/api/users/u-2'],
    ])
    expect(api.peticiones[1].body).toMatchObject({ email: 'luis@soyudemedellin.edu.co', tipo_usuario: 'estudiante' })
    expect(api.peticiones[2].body).toEqual({ nombre: 'Ana' })
    expect(api.peticiones.every((p) => p.authorization === 'Bearer jwt-admin')).toBe(true)
  })

  it('RQ13: un estudiante no crea usuarios', async () => {
    api = montarApiFalsa(() => ({ status: 403, data: { error: 'Permisos insuficientes', code: 'FORBIDDEN_ROLE' } }))

    await expect(
      usersApi.create({
        email: 'ana@soyudemedellin.edu.co',
        password: 'Clave-Segura2026!',
        nombre: 'Ana',
        apellido: 'Pérez',
        tipo_usuario: 'estudiante',
      })
    ).rejects.toMatchObject({ response: { status: 403, data: { code: 'FORBIDDEN_ROLE' } } })
  })

  it('RQ29: manda los comentarios abiertos a /api/ai/summarize', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { summary: 'Resumen local.', topics: ['claridad'] } }))
    sembrarSesion({ tipo_usuario: 'profesor', roles: ['profesor'] }, 'jwt-profesor')

    await expect(summarizeOpenResponses(['La explicación fue clara'])).resolves.toMatchObject({ topics: ['claridad'] })

    expect(api.peticiones[0]).toMatchObject({
      metodo: 'POST',
      url: '/api/ai/summarize',
      authorization: 'Bearer jwt-profesor',
      body: { texts: ['La explicación fue clara'] },
    })
  })

  it.each([
    ['RQ29', 'by-professor', { profesor_id: '7', periodo_id: '2026-1' }],
    ['RQ30', 'by-career', { periodo_id: '2026-1' }],
    ['RQ30', 'by-faculty', { periodo_id: '2026-1' }],
  ] as const)('%s: generar resumen pide GET /api/ai/summarize/%s', async (_rq, endpoint, params) => {
    api = montarApiFalsa(() => ({
      status: 200,
      data: { summary: 'Resumen del alcance.', topics: ['claridad'], textsCount: 1, analysisSource: 'open_text' },
    }))
    sembrarSesion({ tipo_usuario: 'profesor', roles: ['profesor'] }, 'jwt-profesor')

    render(createElement(AISummaryCard, { endpoint, params }))
    await userEvent.click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText('Resumen del alcance.')).toBeTruthy()
    expect(api.peticiones[0]).toMatchObject({
      metodo: 'GET',
      url: `/api/ai/summarize/${endpoint}`,
      authorization: 'Bearer jwt-profesor',
    })
    expect(api.peticiones[0].query).toMatchObject(
      Object.fromEntries(Object.entries(params).map(([clave, valor]) => [clave, String(valor)]))
    )
  })

  it('RQ31: la respuesta con acoso se muestra como alerta y no como un resumen cualquiera', async () => {
    api = montarApiFalsa(() => ({
      status: 200,
      data: {
        summary: 'Resumen de la carrera.',
        topics: ['acoso'],
        textsCount: 1,
        analysisSource: 'open_text',
        acosoDetectado: true,
        mensajeAcoso: 'Hubo acoso en una respuesta.',
        acosoProfesores: [{ profesorId: '7', nombre: 'Ana Perez', menciones: 1, ejemplos: ['Hubo acoso'] }],
      },
    }))

    render(createElement(AISummaryCard, { endpoint: 'by-career', params: { periodo_id: '2026-1' } }))
    await userEvent.click(screen.getByRole('button', { name: /generar resumen ia/i }))

    expect(await screen.findByText('ALERTA DE ACOSO DETECTADO')).toBeTruthy()
    expect(screen.getByText('Ana Perez: 1 mención(es)')).toBeTruthy()
    expect(api.peticiones[0].url).toBe('/api/ai/summarize/by-career')
  })
})

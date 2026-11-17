import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * RF-ENC-33 — Contrato del cliente HTTP para corregir una pregunta (TDD).
 * Mock de módulo: `apiClient` se reemplaza para verificar la petición sin red.
 */
vi.mock('../../../api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '../../../api/client'
import { surveysApi } from '../../../api/surveys.api'

describe('RF-ENC-33 — surveysApi.updateQuestion', () => {
  beforeEach(() => {
    vi.mocked(apiClient.put).mockReset()
  })

  it('hace PUT a /api/evaluations/questions/:id con los datos y devuelve la pregunta', async () => {
    // Dado que el back responde con el sobre { success, data }
    // Arrange
    const guardada = { id: 8, texto_pregunta: 'El docente explica con ejemplos' }
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true, data: guardada } })
    const datos = {
      categoria_id: 1,
      texto_pregunta: 'El docente explica con ejemplos',
      tipo_pregunta: 'likert',
      obligatoria: true,
      orden: 1,
      id_carrera: null,
    }

    // Cuando se llama al cliente
    // Act
    const resultado = await surveysApi.updateQuestion(8, datos)

    // Entonces la petición es la del contrato y se devuelve `data`
    // Assert
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith('/api/evaluations/questions/8', datos)
    expect(resultado).to.deep.equal(guardada)
  })

  it('propaga el error del servidor para que la pantalla lo muestre', async () => {
    // Dado un 400 del back
    // Arrange
    const error = { response: { status: 400, data: { message: 'El texto de la pregunta es obligatorio.' } } }
    vi.mocked(apiClient.put).mockRejectedValue(error)

    // Cuando se llama al cliente
    // Act
    const promesa = surveysApi.updateQuestion(8, {
      categoria_id: 1,
      texto_pregunta: '',
      tipo_pregunta: 'likert',
      orden: 1,
    })

    // Entonces la promesa se rechaza con el mismo error
    // Assert
    await expect(promesa).rejects.toBe(error)
  })
})

describe('RF-ENC-32 y RF-ENC-33 — Contrato del resto de surveysApi', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
  })

  it('lista encuestas y preguntas, y tolera un cuerpo vacío', async () => {
    // Dado respuestas con datos y luego sin ellos
    // Arrange
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { categories: [{ id: 1, nombre: 'Docencia' }] } })
      .mockResolvedValueOnce({ data: { success: true, data: [{ id: 8 }] } })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} })

    // Cuando se listan dos veces
    // Act
    const llenas = [await surveysApi.listCategories(), await surveysApi.listQuestions()]
    const vacias = [await surveysApi.listCategories(), await surveysApi.listQuestions()]

    // Entonces usa las rutas del contrato y nunca devuelve undefined
    // Assert
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/evaluations/categories')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/evaluations/questions')
    expect(llenas).to.deep.equal([[{ id: 1, nombre: 'Docencia' }], [{ id: 8 }]])
    expect(vacias).to.deep.equal([[], []])
  })

  it('crea una pregunta y una encuesta con POST', async () => {
    // Dado que el back confirma ambas
    // Arrange
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: { success: true, data: { id: 9 } } })
      .mockResolvedValueOnce({ data: { category: { id: 3, nombre: 'Cierre' } } })
    const pregunta = { categoria_id: 1, texto_pregunta: 'Llega a tiempo', tipo_pregunta: 'likert', orden: 2 }

    // Cuando se crean
    // Act
    const creada = await surveysApi.createQuestion(pregunta)
    const encuesta = await surveysApi.createCategory({ nombre: 'Cierre', orden: 2 })

    // Entonces cada una va a su ruta
    // Assert
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/api/evaluations/questions', pregunta)
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/api/evaluations/categories', { nombre: 'Cierre', orden: 2 })
    expect(creada).to.have.nested.property('data.id', 9)
    expect(encuesta).to.include({ id: 3, nombre: 'Cierre' })
  })

  it('renombra una encuesta con PUT y retira una pregunta con DELETE', async () => {
    // Dado que el back confirma ambas
    // Arrange
    vi.mocked(apiClient.put).mockResolvedValue({ data: { category: { id: 1, nombre: 'Docencia 2026' } } })
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } })

    // Cuando se renombran y se retiran
    // Act
    const encuesta = await surveysApi.updateCategory(1, { nombre: 'Docencia 2026', orden: 1 })
    const retiro = await surveysApi.deactivateQuestion(8)

    // Entonces usa el id en la ruta
    // Assert
    expect(apiClient.put).toHaveBeenCalledWith('/api/evaluations/categories/1', { nombre: 'Docencia 2026', orden: 1 })
    expect(apiClient.delete).toHaveBeenCalledWith('/api/evaluations/questions/8')
    expect(encuesta).to.have.property('nombre', 'Docencia 2026')
    expect(retiro).to.deep.equal({ success: true })
  })
})

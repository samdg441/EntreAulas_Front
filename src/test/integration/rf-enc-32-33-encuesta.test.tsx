import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import AdminSurveysPage from '../../features/dashboard-admin/AdminSurveysPage'
import { surveysApi } from '../../api/surveys.api'
import { usersApi } from '../../api/users'

vi.mock('../../api/surveys.api', () => ({
  surveysApi: {
    listCategories: vi.fn(),
    listQuestions: vi.fn(),
    createQuestion: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deactivateQuestion: vi.fn(),
  },
}))

vi.mock('../../api/users', () => ({
  usersApi: { academicStructure: vi.fn() },
}))

vi.mock('../../api/periodos.api', () => ({
  getVentanasEvaluacion: vi.fn().mockResolvedValue([]),
}))

const admin = {
  id: 'admin-1',
  email: 'admin@uni.edu',
  nombre: 'Ada',
  apellido: 'Admin',
  tipo_usuario: 'admin',
}

async function abrirDocencia(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Editar encuesta' }))
  await user.click(await screen.findByRole('button', { name: 'Docencia' }))
}

describe('RF-ENC — Pantalla de creación de la encuesta', () => {
  beforeEach(() => {
    vi.mocked(surveysApi.listCategories).mockResolvedValue([{ id: 1, nombre: 'Docencia' }])
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([])
    vi.mocked(usersApi.academicStructure).mockResolvedValue({
      facultades: [{ id: 1, nombre: 'Ingenierías', carreras: [{ id: 4, nombre: 'Sistemas' }] }],
    })
    vi.mocked(surveysApi.createQuestion).mockReset()
    vi.mocked(surveysApi.createCategory).mockReset()
    vi.mocked(surveysApi.deactivateQuestion).mockReset()
  })

  it('RF-ENC-32: el administrador agrega una pregunta y ve la confirmación', async () => {
    // Dado que el banco está vacío y hay una categoría
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.createQuestion).mockResolvedValue({ id: 8 })
    renderConSesion(<AdminSurveysPage />, { user: admin })
    await abrirDocencia(user)
    expect(await screen.findByText('Aún no hay preguntas activas')).toBeInTheDocument()

    // Cuando registra el texto de la pregunta
    // Act
    await user.click(screen.getByRole('button', { name: 'Agregar pregunta' }))
    await user.type(screen.getByLabelText('Texto de la pregunta'), '¿Explica con claridad?')
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }))

    // Entonces el sistema la guarda y confirma
    // Assert
    await waitFor(() =>
      expect(surveysApi.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          categoria_id: 1,
          texto_pregunta: '¿Explica con claridad?',
          tipo_pregunta: 'likert',
          obligatoria: true,
        })
      )
    )
    expect(await screen.findByText('Pregunta agregada a la encuesta')).toBeInTheDocument()
  })

  it('RF-ENC-32: no guarda la pregunta si el texto está en blanco', async () => {
    // Dado que el texto solo tiene espacios
    // Arrange
    const user = userEvent.setup()
    renderConSesion(<AdminSurveysPage />, { user: admin })
    await abrirDocencia(user)
    await screen.findByText('Aún no hay preguntas activas')

    // Cuando intenta agregarla
    // Act
    await user.click(screen.getByRole('button', { name: 'Agregar pregunta' }))
    await user.type(screen.getByLabelText('Texto de la pregunta'), '   ')
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }))

    // Entonces no llama al servicio y explica qué falta
    // Assert
    expect(await screen.findByText('Completa categoría y texto de la pregunta')).toBeInTheDocument()
    expect(surveysApi.createQuestion).not.toHaveBeenCalled()
  })

  it('RF-ENC-32: el administrador crea una encuesta con nombre', async () => {
    // Dado que el banco no tiene encuestas nuevas
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.createCategory).mockResolvedValue({ id: 3, nombre: 'Evaluación de cierre', orden: 2 })
    renderConSesion(<AdminSurveysPage />, { user: admin })
    await screen.findByRole('button', { name: 'Crear encuesta' })

    // Cuando guarda la encuesta
    // Act
    await user.click(screen.getByRole('button', { name: 'Crear encuesta' }))
    await user.type(screen.getByLabelText('Nombre de la encuesta'), 'Evaluación de cierre')
    await user.click(screen.getByRole('button', { name: 'Guardar encuesta' }))

    // Entonces el sistema la registra aparte de las preguntas
    // Assert
    await waitFor(() =>
      expect(surveysApi.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Evaluación de cierre', orden: 2 })
      )
    )
    expect(await screen.findByText('Encuesta agregada')).toBeInTheDocument()
    expect(surveysApi.createQuestion).not.toHaveBeenCalled()
  })

  it('RF-ENC-33: desactiva una pregunta del banco', async () => {
    // Dado que hay una pregunta activa
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([
      {
        id: 8,
        categoria_id: 1,
        texto_pregunta: '¿Explica con claridad?',
        tipo_pregunta: 'likert',
        obligatoria: true,
        orden: 1,
        activa: true,
        categoria: { id: 1, nombre: 'Docencia' },
      },
    ])
    vi.mocked(surveysApi.deactivateQuestion).mockResolvedValue({ success: true })
    renderConSesion(<AdminSurveysPage />, { user: admin })
    await abrirDocencia(user)
    expect(await screen.findByText('¿Explica con claridad?')).toBeInTheDocument()

    // Cuando el administrador la retira
    // Act
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    // Entonces el sistema pide desactivarla
    // Assert
    await waitFor(() => expect(surveysApi.deactivateQuestion).toHaveBeenCalledWith(8))
  })

  it('RF-ENC-33: si el retiro falla, muestra el error y la pregunta sigue en la tabla', async () => {
    // Dado que el servicio rechaza la desactivación
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([
      {
        id: 8,
        categoria_id: 1,
        texto_pregunta: '¿Explica con claridad?',
        tipo_pregunta: 'likert',
        obligatoria: true,
        orden: 1,
        activa: true,
      },
    ])
    vi.mocked(surveysApi.deactivateQuestion).mockRejectedValue({
      response: { data: { error: 'No se pudo desactivar la pregunta' } },
    })
    renderConSesion(<AdminSurveysPage />, { user: admin })
    await abrirDocencia(user)
    await screen.findByText('¿Explica con claridad?')

    // Cuando intenta retirarla
    // Act
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    // Entonces informa el fallo y la pregunta sigue visible
    // Assert
    expect(await screen.findByText('No se pudo desactivar la pregunta')).toBeInTheDocument()
    expect(screen.getByText('¿Explica con claridad?')).toBeInTheDocument()
  })
})

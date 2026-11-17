import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { renderConSesion, sembrarSesion } from '../helpers/render'
import AdminSurveysPage from '../../features/dashboard-admin/AdminSurveysPage'
import TeacherSelection from '../../features/evaluations/TeacherSelection'
import NotificationDropdown from '../../components/NotificationDropdown'
import { notificacionesDeEvaluacion } from '../../lib/notificaciones'
import { surveysApi } from '../../api/surveys.api'
import { usersApi } from '../../api/users'
import { fetchCourseGroups, fetchTeachersWithCourses } from '../../api/teachers'
import { getVentanasEvaluacion } from '../../api/periodos.api'

/**
 * Suite de regresión de Esteban (punto 10).
 *
 * Protege lo que YA funcionaba antes de los cambios del ciclo de pruebas:
 *  - la extracción de `seleccion-encuesta.ts` desde TeacherSelection (refactor),
 *  - la edición de preguntas de RF-ENC-33 en AdminSurveysPage (mejora),
 *  - la corrección de DEF-48 a DEF-50 en el back (ver la suite del back).
 *
 * Solo usa interfaces públicas (pantallas y `notificacionesDeEvaluacion`), no los módulos nuevos.
 * Así la MISMA suite corre contra la línea base (front 73040fd) y contra la versión final,
 * y el resultado de ambas se compara en docs/pruebas/10-REGRESION.md.
 */

vi.mock('../../api/surveys.api', () => ({
  surveysApi: {
    listCategories: vi.fn(),
    listQuestions: vi.fn(),
    createQuestion: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    updateQuestion: vi.fn(),
    deactivateQuestion: vi.fn(),
  },
}))
vi.mock('../../api/users', () => ({ usersApi: { academicStructure: vi.fn() } }))
vi.mock('../../api/teachers', () => ({ fetchTeachersWithCourses: vi.fn(), fetchCourseGroups: vi.fn() }))
vi.mock('../../api/periodos.api', () => ({ getVentanasEvaluacion: vi.fn() }))

const ADMIN = { id: 'admin-1', email: 'ada@udemedellin.edu.co', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' }
const ESTUDIANTE = { id: 'est-1', email: 'eva@soyudemedellin.edu.co', nombre: 'Eva', apellido: 'Ruiz', tipo_usuario: 'estudiante' }

const DOCENCIA = { id: 1, nombre: 'Docencia', descripcion: '', orden: 1 }
const PREGUNTA = {
  id: 8,
  categoria_id: 1,
  texto_pregunta: 'El docente explica con claridad',
  tipo_pregunta: 'likert',
  obligatoria: true,
  orden: 1,
  activa: true,
}

const materia = (parcial: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'Bases de datos',
  code: 'BD-101',
  schedule: 'Lunes 8:00',
  ...parcial,
})
const ANA = { id: '7', name: 'Ana Ruiz', department: 'Sistemas', email: 'ana@udem.edu.co', courses: [materia()] }
const LUIS = {
  id: '8',
  name: 'Luis Gómez',
  department: 'Básica',
  email: 'luis@udem.edu.co',
  courses: [materia({ id: 'c9', name: 'Cálculo', code: 'MAT-2' })],
}

const VENTANA = { periodoId: 2, ano: 2026, semestre: 2, fechaInicio: '2026-11-01', fechaFin: '2026-11-30' }

const alElegir = vi.fn()

function renderSeleccion() {
  sembrarSesion(ESTUDIANTE)
  return render(
    <MemoryRouter initialEntries={['/evaluate/selection']}>
      <AuthProvider>
        <Routes>
          <Route path="/evaluate/selection" element={
              <TeacherSelection
                user={{ id: ESTUDIANTE.id, name: 'Eva Ruiz', type: 'student', email: ESTUDIANTE.email }}
                onTeacherCourseSelected={alElegir}
              />
            } />
          <Route path="/evaluate/form" element={<p>Formulario de evaluación</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

async function abrirDocencia(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Editar encuesta' }))
  await user.click(await screen.findByRole('button', { name: 'Docencia' }))
}

beforeEach(() => {
  vi.mocked(getVentanasEvaluacion).mockResolvedValue([])
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

// ─────────────────────────── Creación de encuestas ───────────────────────────

describe('Regresión — Creación de encuestas (RF-ENC-32, RF-ENC-33)', () => {
  beforeEach(() => {
    vi.mocked(surveysApi.listCategories).mockResolvedValue([DOCENCIA])
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([PREGUNTA])
    vi.mocked(usersApi.academicStructure).mockResolvedValue({ facultades: [] })
  })

  it('R-ENC-01: crear una encuesta la registra y confirma', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.createCategory).mockResolvedValue({ id: 3, nombre: 'Evaluación de cierre', orden: 2 })
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })

    // Act
    await user.click(await screen.findByRole('button', { name: 'Crear encuesta' }))
    await user.type(screen.getByLabelText('Nombre de la encuesta'), 'Evaluación de cierre')
    await user.click(screen.getByRole('button', { name: 'Guardar encuesta' }))

    // Assert
    await waitFor(() =>
      expect(surveysApi.createCategory).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Evaluación de cierre' }))
    )
    expect(await screen.findByText('Encuesta agregada')).toBeInTheDocument()
  })

  it('R-ENC-02: una encuesta sin nombre no se envía', async () => {
    // Arrange
    const user = userEvent.setup()
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })

    // Act
    await user.click(await screen.findByRole('button', { name: 'Crear encuesta' }))
    await user.type(screen.getByLabelText('Nombre de la encuesta'), '   ')
    await user.click(screen.getByRole('button', { name: 'Guardar encuesta' }))

    // Assert
    expect(await screen.findByText('Escribe el nombre de la encuesta')).toBeInTheDocument()
    expect(surveysApi.createCategory).not.toHaveBeenCalled()
  })

  it('R-ENC-03: agregar una pregunta envía sus datos y confirma', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.createQuestion).mockResolvedValue({ success: true, data: { id: 9 } })
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })
    await abrirDocencia(user)

    // Act
    await user.click(await screen.findByRole('button', { name: 'Agregar pregunta' }))
    await user.type(screen.getByLabelText('Texto de la pregunta'), 'El docente llega a tiempo')
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }))

    // Assert
    await waitFor(() =>
      expect(surveysApi.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ categoria_id: 1, texto_pregunta: 'El docente llega a tiempo', tipo_pregunta: 'likert', orden: 2 })
      )
    )
    expect(await screen.findByText('Pregunta agregada a la encuesta')).toBeInTheDocument()
  })

  it('R-ENC-04: una pregunta en blanco no se envía', async () => {
    // Arrange
    const user = userEvent.setup()
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })
    await abrirDocencia(user)

    // Act
    await user.click(await screen.findByRole('button', { name: 'Agregar pregunta' }))
    await user.type(screen.getByLabelText('Texto de la pregunta'), '   ')
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }))

    // Assert
    expect(await screen.findByText('Completa categoría y texto de la pregunta')).toBeInTheDocument()
    expect(surveysApi.createQuestion).not.toHaveBeenCalled()
  })

  it('R-ENC-05: retirar una pregunta la quita de la tabla', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.deactivateQuestion).mockResolvedValue({ success: true })
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })
    await abrirDocencia(user)
    await screen.findByText('El docente explica con claridad')
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([])

    // Act
    await user.click(screen.getByRole('button', { name: /Desactivar/ }))

    // Assert
    await waitFor(() => expect(surveysApi.deactivateQuestion).toHaveBeenCalledWith(8))
    await waitFor(() => expect(screen.queryByText('El docente explica con claridad')).not.toBeInTheDocument())
  })

  it('R-ENC-06: si el retiro falla, la pregunta sigue y se informa el error', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(surveysApi.deactivateQuestion).mockRejectedValue({ response: { data: { error: 'No se pudo desactivar la pregunta' } } })
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })
    await abrirDocencia(user)
    await screen.findByText('El docente explica con claridad')

    // Act
    await user.click(screen.getByRole('button', { name: /Desactivar/ }))

    // Assert
    expect(await screen.findByText('No se pudo desactivar la pregunta')).toBeInTheDocument()
    expect(screen.getByText('El docente explica con claridad')).toBeInTheDocument()
  })
})

// ─────────────────────────── Selección de la encuesta ───────────────────────────

describe('Regresión — Selección de la encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27)', () => {
  beforeEach(() => {
    vi.mocked(fetchCourseGroups).mockResolvedValue([{ id: 'g1', numero_grupo: '01' }])
  })

  it('R-SEL-01: elegir docente, materia y grupo lleva al formulario', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(fetchTeachersWithCourses).mockResolvedValue([ANA] as never)
    renderSeleccion()

    // Act
    await user.click(await screen.findByText('Ana Ruiz'))
    await user.selectOptions(screen.getByRole('combobox'), 'c1')
    await user.click(await screen.findByText('Grupo 01'))
    await user.click(screen.getByRole('button', { name: /Continuar a Evaluación/ }))

    // Assert
    expect(await screen.findByText('Formulario de evaluación')).toBeInTheDocument()
    expect(fetchCourseGroups).toHaveBeenCalledWith('7', 'c1')
    expect(alElegir).toHaveBeenCalledWith(
      expect.objectContaining({ id: '7', name: 'Ana Ruiz' }),
      expect.objectContaining({ id: 'c1', code: 'BD-101' })
    )
  })

  it('R-SEL-02: un docente con todo respondido aparece como «Respondida» y no se selecciona', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(fetchTeachersWithCourses).mockResolvedValue([{ ...ANA, courses: [materia({ evaluada: true })] }] as never)
    renderSeleccion()

    // Act
    await user.click(await screen.findByText('Ana Ruiz'))

    // Assert
    expect(screen.getAllByText('Respondida').length).toBeGreaterThan(0)
    expect(screen.getByText('Primero selecciona un docente')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('R-SEL-03: una materia ya evaluada queda deshabilitada en la lista', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(fetchTeachersWithCourses).mockResolvedValue([
      { ...ANA, courses: [materia(), materia({ id: 'c2', name: 'Redes', code: 'RED-3', evaluada: true })] },
    ] as never)
    renderSeleccion()

    // Act
    await user.click(await screen.findByText('Ana Ruiz'))
    const opciones = within(screen.getByRole('combobox')).getAllByRole('option') as HTMLOptionElement[]

    // Assert
    expect(opciones.find((o) => o.value === 'c1')?.disabled).toBe(false)
    expect(opciones.find((o) => o.value === 'c2')?.disabled).toBe(true)
  })

  it('R-SEL-04: el buscador filtra por código de materia', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(fetchTeachersWithCourses).mockResolvedValue([ANA, LUIS] as never)
    renderSeleccion()
    await screen.findByText('Ana Ruiz')

    // Act
    await user.type(screen.getByPlaceholderText('Buscar docente o materia...'), 'MAT-2')

    // Assert
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument()
    expect(screen.queryByText('Ana Ruiz')).not.toBeInTheDocument()
  })

  it('R-SEL-05: si falla la carga de docentes se ofrece reintentar', async () => {
    // Arrange
    vi.mocked(fetchTeachersWithCourses).mockRejectedValue(new Error('Error al cargar los profesores'))

    // Act
    renderSeleccion()

    // Assert
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

// ─────────────────────────── Notificaciones ───────────────────────────

describe('Regresión — Notificaciones de la ventana (RF-NOT-34, RF-NOT-35)', () => {
  it('R-NOT-01: con la ventana abierta el estudiante recibe el aviso y la acción de evaluar', () => {
    // Arrange
    const hoy = new Date(2026, 10, 16)

    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [VENTANA], 'estudiante')

    // Assert
    expect(aviso).toMatchObject({ titulo: 'Evaluación docente abierta', urgente: false })
    expect(aviso.accion).toEqual({ texto: 'Evaluar ahora', ruta: '/evaluate/selection' })
  })

  it('R-NOT-02: a un día del cierre el aviso es urgente', () => {
    // Arrange
    const hoy = new Date(2026, 10, 29)

    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [VENTANA], 'profesor')

    // Assert
    expect(aviso.urgente).toBe(true)
    expect(aviso.accion).toEqual({ texto: 'Ver reportes', ruta: '/reports' })
  })

  it('R-NOT-03: antes de abrir anuncia la próxima evaluación sin acción', () => {
    // Arrange
    const hoy = new Date(2026, 9, 20)

    // Act
    const [aviso] = notificacionesDeEvaluacion(hoy, [VENTANA], 'estudiante')

    // Assert
    expect(aviso.titulo).toBe('Próxima evaluación docente')
    expect(aviso.accion).toBeUndefined()
  })

  it('R-NOT-04: sin ventanas no hay avisos', () => {
    // Arrange
    const hoy = new Date(2026, 10, 16)

    // Act
    const avisos = notificacionesDeEvaluacion(hoy, [], 'estudiante')

    // Assert
    expect(avisos).toEqual([])
  })

  it('R-NOT-05: marcar todas como leídas quita el pendiente de la campana', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 16))
    vi.mocked(getVentanasEvaluacion).mockResolvedValue([VENTANA])
    const user = userEvent.setup()
    renderConSesion(<NotificationDropdown />, { user: ESTUDIANTE })
    const campana = await screen.findByRole('button', { name: 'Notificaciones (1 sin leer)' })

    // Act
    await user.click(campana)
    await user.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
  })
})

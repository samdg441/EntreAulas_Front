import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import ProtectedRoute from '../../routes/ProtectedRoute'
import { renderConSesion, sembrarSesion } from '../helpers/render'
import AdminSurveysPage from '../../features/dashboard-admin/AdminSurveysPage'
import TeacherSelection from '../../features/evaluations/TeacherSelection'
import NotificationDropdown from '../../components/NotificationDropdown'
import { notificacionesDeEvaluacion } from '../../lib/notificaciones'
import { surveysApi } from '../../api/surveys.api'
import { usersApi } from '../../api/users'
import { fetchTeachersWithCourses } from '../../api/teachers'
import { getVentanasEvaluacion } from '../../api/periodos.api'

/**
 * Punto 13 — Seguridad en el front de Creación de encuestas, Selección y Notificaciones (OWASP Top 10, 2021).
 * El back es quien protege los datos; aquí se comprueba que el front no abre una puerta adicional:
 * no ejecuta HTML que venga de la API, no muestra pantallas a otro rol, no se rompe con datos alterados
 * en el navegador y no envía campos que el usuario no puede editar.
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

/** Si alguno de estos payloads se ejecutara, dejaría la marca en window. */
const XSS_IMG = '<img src=x onerror="window.__xss=1">'
const XSS_SCRIPT = '<script>window.__xss=1</script>'
const VENTANA = { periodoId: 2, ano: 2026, semestre: 2, fechaInicio: '2026-11-01', fechaFin: '2026-11-30' }

declare global {
  interface Window {
    __xss?: number
  }
}

beforeEach(() => {
  delete window.__xss
  vi.mocked(getVentanasEvaluacion).mockResolvedValue([])
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

// ───────────────────────── A03 — Inyección (XSS almacenado) ─────────────────────────
describe('A03 — XSS: lo que guarda la API se muestra como texto, nunca como HTML', () => {
  it('SEC-FE-01 una pregunta y una encuesta con HTML se pintan como texto en la administración', async () => {
    // Arrange: el back devuelve textos con HTML (SEC-09 del back: los guarda tal cual)
    const user = userEvent.setup()
    vi.mocked(usersApi.academicStructure).mockResolvedValue({ facultades: [] })
    vi.mocked(surveysApi.listCategories).mockResolvedValue([{ id: 1, nombre: XSS_SCRIPT, orden: 1 }])
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([
      { id: 8, categoria_id: 1, texto_pregunta: XSS_IMG, tipo_pregunta: 'likert', obligatoria: true, orden: 1, activa: true },
    ])
    const { container } = renderConSesion(<AdminSurveysPage />, { user: ADMIN })

    // Act
    await user.click(await screen.findByRole('button', { name: 'Editar encuesta' }))
    await user.click(await screen.findByRole('button', { name: XSS_SCRIPT }))

    // Assert
    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(window.__xss).toBeUndefined()
  })

  it('SEC-FE-02 un docente o materia con HTML se pinta como texto en la selección', async () => {
    // Arrange
    vi.mocked(fetchTeachersWithCourses).mockResolvedValue([
      { id: '7', name: XSS_IMG, department: XSS_SCRIPT, email: 'a@udem.edu.co', courses: [{ id: 'c1', name: XSS_IMG, code: 'BD-101', schedule: 'L' }] },
    ] as never)
    sembrarSesion(ESTUDIANTE)

    // Act
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <TeacherSelection user={{ id: 'est-1', name: 'Eva', type: 'student', email: ESTUDIANTE.email }} onTeacherCourseSelected={vi.fn()} />
        </AuthProvider>
      </MemoryRouter>
    )

    // Assert
    expect((await screen.findAllByText(XSS_IMG)).length).toBeGreaterThan(0)
    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(window.__xss).toBeUndefined()
  })

  it('SEC-FE-03 una ventana con HTML en sus datos no inyecta nada en la campana', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 16))
    vi.mocked(getVentanasEvaluacion).mockResolvedValue([{ ...VENTANA, ano: XSS_IMG as unknown as number }])
    const user = userEvent.setup()
    const { container } = renderConSesion(<NotificationDropdown />, { user: ESTUDIANTE })

    // Act
    await user.click(await screen.findByRole('button', { name: /Notificaciones/ }))

    // Assert
    expect(await screen.findByText('Evaluación docente abierta')).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(window.__xss).toBeUndefined()
  })
})

// ───────────────────────── A01 — Control de acceso ─────────────────────────
describe('A01 — Cada pantalla solo para su rol (mismas reglas que App.tsx)', () => {
  const rutas = (
    <Routes>
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route path="/forbidden" element={<p>Acceso denegado</p>} />
      <Route
        path="/admin/surveys"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <p>Administración de encuestas</p>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluate/selection"
        element={
          <ProtectedRoute allowedRoles={['estudiante']}>
            <p>Selección de la encuesta</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  )

  it.each([
    ['/admin/surveys', 'estudiante', 'Acceso denegado'],
    ['/admin/surveys', 'profesor', 'Acceso denegado'],
    ['/admin/surveys', 'coordinador', 'Acceso denegado'],
    ['/admin/surveys', 'admin', 'Administración de encuestas'],
    ['/evaluate/selection', 'admin', 'Acceso denegado'],
    ['/evaluate/selection', 'profesor', 'Acceso denegado'],
    ['/evaluate/selection', 'estudiante', 'Selección de la encuesta'],
  ])('SEC-FE-04 %s con rol %s → «%s»', async (ruta, rol, esperado) => {
    renderConSesion(rutas, { route: ruta, user: { tipo_usuario: rol, roles: [rol] } })

    expect(await screen.findByText(esperado)).toBeInTheDocument()
  })

  it('SEC-FE-05 sin sesión, ninguna de las dos pantallas se pinta', async () => {
    renderConSesion(rutas, { route: '/admin/surveys' })

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Administración de encuestas')).not.toBeInTheDocument()
  })

  it('SEC-FE-06 la acción de un aviso siempre es una ruta interna (sin redirección abierta)', () => {
    const roles = ['estudiante', 'profesor', 'coordinador', 'decano', 'admin', '<script>', 'javascript:alert(1)', undefined]

    const rutas = roles.flatMap((rol) => notificacionesDeEvaluacion(new Date(2026, 10, 16), [VENTANA], rol)).map((n) => n.accion?.ruta)

    rutas.filter(Boolean).forEach((r) => expect(r).toMatch(/^\/[a-z]/))
  })
})

// ───────────────────────── A08 — Integridad de datos en el navegador ─────────────────────────
describe('A08 — La campana tolera datos alterados en localStorage', () => {
  it.each(['no-es-json', '{"id":"x"}', '"texto"', 'null', '[1,{"a":2}]'])(
    'SEC-FE-07 «notificaciones-leidas» = %s no rompe la campana ni oculta el aviso',
    async (valor) => {
      // Arrange
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2026, 10, 16))
      vi.mocked(getVentanasEvaluacion).mockResolvedValue([VENTANA])
      window.localStorage.setItem('notificaciones-leidas', valor)

      // Act
      renderConSesion(<NotificationDropdown />, { user: ESTUDIANTE })

      // Assert
      expect(await screen.findByRole('button', { name: 'Notificaciones (1 sin leer)' })).toBeInTheDocument()
    }
  )
})

// ───────────────────────── A04 — Diseño: el front no envía lo que no se puede editar ─────────────────────────
describe('A04 — La corrección envía solo los campos editables', () => {
  it('SEC-FE-08 aunque la API devuelva id, activa y campos extra, el PUT no los reenvía', async () => {
    // Arrange: la pregunta trae campos de solo lectura y uno inesperado
    const user = userEvent.setup()
    vi.mocked(usersApi.academicStructure).mockResolvedValue({ facultades: [] })
    vi.mocked(surveysApi.listCategories).mockResolvedValue([{ id: 1, nombre: 'Docencia', orden: 1 }])
    vi.mocked(surveysApi.listQuestions).mockResolvedValue([
      {
        id: 8,
        categoria_id: 1,
        texto_pregunta: 'El docente explica con claridad',
        tipo_pregunta: 'likert',
        obligatoria: true,
        orden: 1,
        activa: true,
        id_carrera: null,
        categoria: { id: 1, nombre: 'Docencia' },
        es_admin: true,
      } as never,
    ])
    vi.mocked(surveysApi.updateQuestion).mockResolvedValue({} as never)
    renderConSesion(<AdminSurveysPage />, { user: ADMIN })
    await user.click(await screen.findByRole('button', { name: 'Editar encuesta' }))
    await user.click(await screen.findByRole('button', { name: 'Docencia' }))

    // Act
    await user.click(await screen.findByRole('button', { name: 'Editar pregunta El docente explica con claridad' }))
    await user.type(screen.getByLabelText('Texto de la pregunta'), ' y con ejemplos')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios de la pregunta' }))

    // Assert
    await waitFor(() => expect(surveysApi.updateQuestion).toHaveBeenCalledOnce())
    const [id, cuerpo] = vi.mocked(surveysApi.updateQuestion).mock.calls[0]
    expect(id).toBe(8)
    expect(Object.keys(cuerpo).sort()).toEqual(
      ['categoria_id', 'descripcion', 'id_carrera', 'obligatoria', 'orden', 'texto_pregunta', 'tipo_pregunta'].sort()
    )
  })
})

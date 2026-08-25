import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { renderWithRouter } from '../helpers/render'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'

const API = 'http://localhost:3000'
const ADMIN_TOKEN = 'admin-token-abc'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', nombre: 'Admin', apellido: 'Uno', email: 'admin@test.com' },
  }),
}))

vi.mock('../../components/Header', () => ({ default: () => null }))

function renderPage() {
  return renderWithRouter(<AdminUsersPage />, {
    route: '/dashboard-admin/usuarios',
    path: '/dashboard-admin/usuarios',
  })
}

function getModal() {
  return screen.getByRole('heading', { name: 'Agregar usuario' }).parentElement as HTMLElement
}

async function openCreateModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Agregar usuario/i }))
  await screen.findByRole('heading', { name: 'Agregar usuario' })
  return getModal()
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>, modal: HTMLElement) {
  await user.type(within(modal).getByLabelText('Nombre'), 'Nuevo')
  await user.type(within(modal).getByLabelText('Apellido'), 'Usuario')
  await user.type(within(modal).getByLabelText('Email'), 'nuevo@test.com')
  await user.type(within(modal).getByLabelText('Contraseña'), 'password123')
}

function mockList() {
  server.use(http.get(`${API}/api/users`, () => HttpResponse.json({ users: [] })))
}

const originalLocation = window.location


function spyOnLocationHref() {
  let capturedHref: string | null = null
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: new Proxy(originalLocation, {
      set(target, prop, value) {
        if (prop === 'href') {
          capturedHref = value
          return true
        }
        return Reflect.set(target, prop, value)
      },
      get(target, prop) {
        if (prop === 'href') return capturedHref ?? target.href
        return Reflect.get(target, prop)
      },
    }),
  })
  return () => capturedHref
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
})
afterAll(() => server.close())


describe('RQ1 integration Crear usuario como administrador', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('C1: al montar, GET /api/users sale con Authorization: Bearer <token>', async () => {
    localStorage.setItem('token', ADMIN_TOKEN)
    let authHeader: string | null = null
    server.use(
      http.get(`${API}/api/users`, ({ request }) => {
        authHeader = request.headers.get('authorization')
        return HttpResponse.json({ users: [] })
      })
    )
    renderPage()

    await waitFor(() => expect(authHeader).toBe(`Bearer ${ADMIN_TOKEN}`))
  })

  it('C2: envío válido -> POST /api/auth/create-user con el body exacto, 201 real cierra el modal y recarga', async () => {
    localStorage.setItem('token', ADMIN_TOKEN)
    mockList()
    let capturedBody: unknown
    let capturedAuth: string | null = null
    server.use(
      http.post(`${API}/api/auth/create-user`, async ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            message: 'Usuario creado exitosamente',
            user: {
              id: 'new-1',
              email: 'nuevo@test.com',
              nombre: 'Nuevo',
              apellido: 'Usuario',
              tipo_usuario: 'estudiante',
              activo: true,
            },
          },
          { status: 201 }
        )
      })
    )
    const user = userEvent.setup()
    renderPage()
    const modal = await openCreateModal(user)
    await fillCreateForm(user, modal)

    await user.click(within(modal).getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Agregar usuario' })).not.toBeInTheDocument()
    )
    expect(capturedAuth).toBe(`Bearer ${ADMIN_TOKEN}`)
    expect(capturedBody).toEqual({
      email: 'nuevo@test.com',
      password: 'password123',
      nombre: 'Nuevo',
      apellido: 'Usuario',
      tipo_usuario: 'estudiante',
    })
  })

  it('C3: backend responde 400 real (email registrado) -> Front muestra el mensaje exacto del body', async () => {
    localStorage.setItem('token', ADMIN_TOKEN)
    mockList()
    server.use(
      http.post(`${API}/api/auth/create-user`, () =>
        HttpResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
      )
    )
    const user = userEvent.setup()
    renderPage()
    const modal = await openCreateModal(user)
    await fillCreateForm(user, modal)

    await user.click(within(modal).getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Agregar usuario' })).toBeInTheDocument()
  })

  it('C4: sin token -> la petición sale sin Authorization, el 401 real limpia la sesión', async () => {

    localStorage.setItem('user', JSON.stringify({ id: 'admin-1' }))
    mockList()
    let authHeader: string | null | undefined = undefined
    server.use(
      http.post(`${API}/api/auth/create-user`, ({ request }) => {
        authHeader = request.headers.get('authorization')
        return HttpResponse.json(
          { error: 'Token de acceso requerido', code: 'NO_TOKEN' },
          { status: 401 }
        )
      })
    )
    const getHref = spyOnLocationHref()

    const user = userEvent.setup()
    renderPage()
    const modal = await openCreateModal(user)
    await fillCreateForm(user, modal)

    await user.click(within(modal).getByRole('button', { name: 'Crear' }))

    await waitFor(() => expect(authHeader).toBeNull())
    await waitFor(() => expect(getHref()).toBe('/login'))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('C5: token de un usuario no-admin -> 403 real, el interceptor NO limpia el token', async () => {
    localStorage.setItem('token', 'estudiante-token-xyz')
    mockList()
    server.use(
      http.post(`${API}/api/auth/create-user`, () =>
        HttpResponse.json({ error: 'Permisos insuficientes', code: 'FORBIDDEN_ROLE' }, { status: 403 })
      )
    )
    const user = userEvent.setup()
    renderPage()
    const modal = await openCreateModal(user)
    await fillCreateForm(user, modal)

    await user.click(within(modal).getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Permisos insuficientes')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('estudiante-token-xyz')
  })

  it('C6: la petición de creación lleva Content-Type: application/json y el body serializado', async () => {
    localStorage.setItem('token', ADMIN_TOKEN)
    mockList()
    let contentType: string | null = null
    let rawBody: string | undefined
    server.use(
      http.post(`${API}/api/auth/create-user`, async ({ request }) => {
        contentType = request.headers.get('content-type')
        rawBody = await request.text()
        return HttpResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      })
    )
    const user = userEvent.setup()
    renderPage()
    const modal = await openCreateModal(user)
    await fillCreateForm(user, modal)

    await user.click(within(modal).getByRole('button', { name: 'Crear' }))
    await screen.findByText('El email ya está registrado')

    expect(contentType).toContain('application/json')
    expect(() => JSON.parse(rawBody ?? '')).not.toThrow()
  })
})

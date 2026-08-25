import { describe, expect, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { renderWithRouter } from '../helpers/render'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'

const API = 'http://localhost:3000'
const credenciales = { email: 'ana@uni.edu', password: 'password123' }

function renderLogin() {
  return renderWithRouter(
    <AuthProvider>
      <Login />
    </AuthProvider>,
    {
      route: '/login',
      path: '/login',
      extraRoutes: [
        { path: '/dashboard-estudiante', element: <div>Panel estudiante</div> },
        { path: '/dashboard-profesor', element: <div>Panel profesor</div> },
      ],
    }
  )
}

async function fillCredenciales(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Correo Institucional/i), credenciales.email)
  await user.type(screen.getByLabelText('Contraseña'), credenciales.password)
}

function getRoleModal() {
  return screen.getByRole('heading', { name: 'Selecciona tu Rol' }).parentElement!
    .parentElement as HTMLElement
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


describe('RQ2 integration Login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('C1: POST /api/auth/login sale con {email, password} y el 200 real redirige', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API}/api/auth/login`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          message: 'Login exitoso',
          token: 'jwt-estudiante',
          user: {
            id: 'u1',
            email: credenciales.email,
            nombre: 'Ana',
            apellido: 'Perez',
            tipo_usuario: 'estudiante',
            roles: ['estudiante'],
            dashboard: '/dashboard-estudiante',
          },
        })
      })
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    expect(await screen.findByText('Panel estudiante')).toBeInTheDocument()
    expect(capturedBody).toEqual(credenciales)
    expect(localStorage.getItem('token')).toBe('jwt-estudiante')
  })

  it('C2: 401 real del backend → Front muestra el mensaje exacto del body', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
      )
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('C3: 200 con requires_role_selection → Front abre el modal con los roles del body', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({
          message: 'Usuario con múltiples roles detectado',
          requires_role_selection: true,
          available_roles: ['estudiante', 'profesor'],
          user: {
            id: 'u1',
            email: credenciales.email,
            nombre: 'Ana',
            apellido: 'Perez',
            tipo_usuario: 'estudiante',
            roles: ['estudiante', 'profesor'],
            multiple_roles: true,
          },
        })
      )
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    const modal = await screen.findByRole('heading', { name: 'Selecciona tu Rol' })
    expect(modal).toBeInTheDocument()
    const roleModal = getRoleModal()
    expect(within(roleModal).getByRole('button', { name: /Docente/i })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('C4: al confirmar el rol, POST /api/auth/login-with-role sale con el body exacto', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({
          requires_role_selection: true,
          available_roles: ['estudiante', 'profesor'],
          user: { id: 'u1', nombre: 'Ana', apellido: 'Perez', roles: ['estudiante', 'profesor'] },
        })
      ),
      http.post(`${API}/api/auth/login-with-role`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          token: 'jwt-profesor',
          user: {
            id: 'u1',
            email: credenciales.email,
            nombre: 'Ana',
            apellido: 'Perez',
            tipo_usuario: 'profesor',
            roles: ['estudiante', 'profesor'],
            dashboard: '/dashboard-profesor',
          },
        })
      })
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await screen.findByRole('heading', { name: 'Selecciona tu Rol' })
    const roleModal = getRoleModal()

    await user.click(within(roleModal).getByRole('button', { name: /Docente/i }))
    await user.click(within(roleModal).getByRole('button', { name: /Continuar/i }))

    await screen.findByText('Panel profesor')
    expect(capturedBody).toEqual({ ...credenciales, selectedRole: 'profesor' })
  })

  it('C5: 200 de login-with-role → Front guarda token/user y redirige al dashboard del body', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({
          requires_role_selection: true,
          available_roles: ['estudiante', 'profesor'],
          user: { id: 'u1', nombre: 'Ana', apellido: 'Perez', roles: ['estudiante', 'profesor'] },
        })
      ),
      http.post(`${API}/api/auth/login-with-role`, () =>
        HttpResponse.json({
          token: 'jwt-profesor',
          user: {
            id: 'u1',
            email: credenciales.email,
            nombre: 'Ana',
            apellido: 'Perez',
            tipo_usuario: 'profesor',
            roles: ['estudiante', 'profesor'],
            dashboard: '/dashboard-profesor',
          },
        })
      )
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await screen.findByRole('heading', { name: 'Selecciona tu Rol' })
    const roleModal = getRoleModal()
    await user.click(within(roleModal).getByRole('button', { name: /Docente/i }))
    await user.click(within(roleModal).getByRole('button', { name: /Continuar/i }))

    expect(await screen.findByText('Panel profesor')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('jwt-profesor')
    expect(JSON.parse(localStorage.getItem('user') || '{}').tipo_usuario).toBe('profesor')
  })

  it('C6: login-with-role responde 401 → Front muestra el error y no guarda nada', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({
          requires_role_selection: true,
          available_roles: ['estudiante', 'profesor'],
          user: { id: 'u1', nombre: 'Ana', apellido: 'Perez', roles: ['estudiante', 'profesor'] },
        })
      ),
      http.post(`${API}/api/auth/login-with-role`, () =>
        HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
      )
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await screen.findByRole('heading', { name: 'Selecciona tu Rol' })
    const roleModal = getRoleModal()
    await user.click(within(roleModal).getByRole('button', { name: /Estudiante/i }))
    await user.click(within(roleModal).getByRole('button', { name: /Continuar/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(screen.queryByText('Panel estudiante')).not.toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('C7: la petición de login lleva Content-Type: application/json', async () => {
    let contentType: string | null = null
    server.use(
      http.post(`${API}/api/auth/login`, ({ request }) => {
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
      })
    )
    const user = userEvent.setup()
    renderLogin()

    await fillCredenciales(user)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await screen.findByText('Credenciales inválidas')

    expect(contentType).toContain('application/json')
  })
})

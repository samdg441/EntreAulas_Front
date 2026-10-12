import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import { authApi } from '../../api/auth'
import { apiClient } from '../../api/client'
import { montarApiFalsa } from '../helpers/api-falsa'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: () => {
      const raw = window.localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    },
    getToken: () => window.localStorage.getItem('token'),
    isAuthenticated: () => Boolean(window.localStorage.getItem('token')),
    getProfile: vi.fn(),
  },
}))

/** Muestra dónde terminó la navegación para poder afirmar sobre ella. */
function UbicacionActual() {
  const { pathname } = useLocation()
  return <p data-testid="ubicacion">{pathname}</p>
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<UbicacionActual />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const estudiante = { id: '1', email: 'estudiante@uni.edu', nombre: 'Est', apellido: 'Iante', tipo_usuario: 'estudiante' }

async function iniciarSesion() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
  await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
}

describe('RQ2 — Seguridad del login en el front', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset()
  })

  it('el campo de contraseña oculta lo escrito y no pide al navegador autocompletar un valor ajeno', () => {
    renderLogin()

    const campo = screen.getByLabelText(/^contraseña$/i)

    expect(campo).toHaveAttribute('type', 'password')
  })

  it('un mensaje de error con HTML se muestra como texto, sin crear elementos', async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { data: { error: '<img src=x onerror=alert(1)>' } } })
    const { container } = renderLogin()

    await iniciarSesion()

    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).toBeNull()
  })

  it('un login fallido no deja token ni usuario en el almacenamiento', async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' } } })
    renderLogin()

    await iniciarSesion()

    await screen.findByText('Credenciales inválidas')
    expect(window.localStorage.getItem('token')).toBeNull()
    expect(window.localStorage.getItem('user')).toBeNull()
  })

  it('la contraseña nunca se escribe en la consola ni en el almacenamiento', async () => {
    const consola = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })
    renderLogin()

    await iniciarSesion()

    await waitFor(() => expect(window.localStorage.getItem('token')).toBe('tok-123'))
    const volcado = JSON.stringify([...consola.flatMap((s) => s.mock.calls), window.localStorage.getItem('user')])
    expect(volcado).not.toContain('Abcdef1!')
  })

  it('con un login correcto el JWT queda en localStorage (riesgo conocido: lo lee cualquier XSS; ver documento)', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })
    renderLogin()

    await iniciarSesion()

    await waitFor(() => expect(window.localStorage.getItem('token')).toBe('tok-123'))
  })

  it.each([
    ['ruta interna', '/dashboard-estudiante', '/dashboard-estudiante'],
  ])('regreso pendiente a una %s se respeta', async (_caso, redirectTo, esperado) => {
    window.localStorage.setItem('redirectTo', redirectTo)
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })
    renderLogin()

    await iniciarSesion()

    expect(await screen.findByTestId('ubicacion')).toHaveTextContent(esperado)
  })
})

describe('RQ2 — El interceptor de axios ante 401 y 403', () => {
  let api: ReturnType<typeof montarApiFalsa>
  afterEach(() => api?.restaurar())

  it('un 401 en una ruta privada borra token y usuario', async () => {
    window.localStorage.setItem('token', 'tok-viejo')
    window.localStorage.setItem('user', '{"id":1}')
    api = montarApiFalsa(() => ({ status: 401, data: { error: 'Token inválido' } }))
    vi.spyOn(window, 'location', 'get').mockReturnValue({ pathname: '/dashboard-estudiante', href: '' } as Location)

    await expect(apiClient.get('/api/auth/profile')).rejects.toBeTruthy()

    expect(window.localStorage.getItem('token')).toBeNull()
    expect(window.localStorage.getItem('user')).toBeNull()
  })

  it('un 403 NO borra la sesión (es un problema de rol, no de autenticación)', async () => {
    window.localStorage.setItem('token', 'tok-vigente')
    api = montarApiFalsa(() => ({ status: 403, data: { error: 'Prohibido' } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(apiClient.get('/api/users')).rejects.toBeTruthy()

    expect(window.localStorage.getItem('token')).toBe('tok-vigente')
  })

  it('el token viaja solo en la cabecera Authorization, nunca en la URL ni en el cuerpo', async () => {
    window.localStorage.setItem('token', 'tok-secreto-123')
    api = montarApiFalsa(() => ({ status: 200, data: {} }))

    await apiClient.post('/api/auth/create-user', { email: 'a@b.co' })

    const [peticion] = api.peticiones
    expect(peticion.authorization).toBe('Bearer tok-secreto-123')
    expect(peticion.url).not.toContain('tok-secreto-123')
    expect(JSON.stringify(peticion.query)).not.toContain('tok-secreto-123')
    expect(JSON.stringify(peticion.body)).not.toContain('tok-secreto-123')
  })

  it('un login (sin token guardado) no envía cabecera Authorization', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: {} }))

    await apiClient.post('/api/auth/login', { email: 'a@b.co', password: 'x' })

    expect(api.peticiones[0].authorization).toBeUndefined()
  })
})

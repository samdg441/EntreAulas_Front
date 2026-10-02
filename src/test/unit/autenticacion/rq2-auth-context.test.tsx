import { useState } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../../context/AuthContext'
import { authApi } from '../../../api/auth'
import { RoleMismatchError } from '../../../features/auth/errors'

vi.mock('../../../api/auth', () => ({
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

const admin = {
  id: 'admin-1',
  email: 'admin@uni.edu',
  nombre: 'Ada',
  apellido: 'Admin',
  tipo_usuario: 'admin',
  roles: ['admin', 'estudiante'],
  permissions: ['reportes'],
  dashboard: '/dashboard-admin',
}

function Panel() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="ruta">{auth.getDashboardPath()}</span>
      <span data-testid="permiso">{String(auth.hasPermission('reportes'))}</span>
      <span data-testid="otro">{String(auth.hasPermission('borrar'))}</span>
      <span data-testid="rol">{auth.user?.selected_role ?? ''}</span>
      <button type="button" onClick={() => auth.loginWithRole('ada@uni.edu', 'Abcdef1!', 'admin')}>
        entrar con rol
      </button>
      <button type="button" onClick={() => auth.switchUserRole('estudiante')}>
        cambiar rol
      </button>
      <button type="button" onClick={() => auth.switchUserRole('decano')}>
        rol ajeno
      </button>
      <button type="button" onClick={() => auth.logout()}>salir</button>
    </div>
  )
}

describe('RQ2 — sesión del contexto', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.mocked(authApi.loginWithRole).mockReset()
    vi.mocked(authApi.logout).mockReset()
  })

  it('fuera del proveedor no hay sesión', () => {
    expect(() => render(<Panel />)).toThrow(/useAuth must be used within an AuthProvider/)
  })

  it('sin usuario guardado la ruta es el login y no hay permisos', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Panel />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('ruta')).toHaveTextContent('/login')
    expect(screen.getByTestId('permiso')).toHaveTextContent('false')
  })

  it('con sesión reconoce el permiso, cambia de rol y entra con un rol elegido', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('token', 'jwt')
    window.localStorage.setItem('user', JSON.stringify(admin))
    vi.mocked(authApi.loginWithRole).mockResolvedValue({
      token: 'jwt-rol',
      user: { ...admin, selected_role: 'admin' },
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Panel />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('/dashboard-admin')).toBeInTheDocument()
    expect(screen.getByTestId('permiso')).toHaveTextContent('true')
    expect(screen.getByTestId('otro')).toHaveTextContent('false')

    await user.click(screen.getByRole('button', { name: /cambiar rol/i }))
    expect(screen.getByTestId('rol')).toHaveTextContent('estudiante')

    await user.click(screen.getByRole('button', { name: /rol ajeno/i }))
    expect(screen.getByTestId('rol')).toHaveTextContent('estudiante')

    await user.click(screen.getByRole('button', { name: /entrar con rol/i }))
    expect(authApi.loginWithRole).toHaveBeenCalledWith({
      email: 'ada@uni.edu',
      password: 'Abcdef1!',
      selectedRole: 'admin',
    })
    expect(window.localStorage.getItem('token')).toBe('jwt-rol')
  })

  it('un permiso global autoriza cualquier acción y salir limpia la sesión', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('token', 'jwt')
    window.localStorage.setItem(
      'user',
      JSON.stringify({ ...admin, roles: [], permissions: ['all'] }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <Panel />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect((await screen.findByTestId('permiso')).textContent).toBe('true')
    expect(screen.getByTestId('otro').textContent).toBe('true')
    await user.click(screen.getByRole('button', { name: /salir/i }))
    expect(authApi.logout).toHaveBeenCalled()
  })

  it('el login rechaza un tipo que no está en la cuenta y, si hay varios roles, termina el ingreso', async () => {
    const user = userEvent.setup()

    function Acceso() {
      const auth = useAuth()
      const [mensaje, setMensaje] = useState('')
      return (
        <>
          <button
            type="button"
            onClick={() =>
              auth.login('ada@uni.edu', 'Abcdef1!', 'decano').catch((error: unknown) => {
                setMensaje(error instanceof RoleMismatchError ? error.message : 'otro')
              })
            }
          >
            entrar mal
          </button>
          <button
            type="button"
            onClick={() => auth.login('ada@uni.edu', 'Abcdef1!', 'admin')}
          >
            entrar bien
          </button>
          <button type="button" onClick={() => auth.login('ada@uni.edu', 'Abcdef1!')}>
            entrar sin tipo
          </button>
          <span>{mensaje}</span>
        </>
      )
    }

    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'jwt',
      user: { ...admin, roles: ['admin'] },
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Acceso />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /entrar mal/i }))
    expect(await screen.findByText(/no coincide con tu cuenta/i)).toBeInTheDocument()

    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'parcial',
      user: { ...admin, roles: ['admin'] },
      requires_role_selection: true,
    })
    vi.mocked(authApi.loginWithRole).mockResolvedValue({
      token: 'completo',
      user: admin,
    })
    await user.click(screen.getByRole('button', { name: /entrar bien/i }))
    expect(authApi.loginWithRole).toHaveBeenCalledWith({
      email: 'ada@uni.edu',
      password: 'Abcdef1!',
      selectedRole: 'admin',
    })

    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'parcial',
      user: admin,
      requires_role_selection: true,
    })
    await user.click(screen.getByRole('button', { name: /entrar sin tipo/i }))
    expect(window.localStorage.getItem('token')).toBe('completo')
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const login = vi.fn()
const loginWithRole = vi.fn()

vi.mock('../../api/auth', () => ({
  authApi: {
    login: (...args: unknown[]) => login(...args),
    loginWithRole: (...args: unknown[]) => loginWithRole(...args),
    getCurrentUser: () => null,
    isAuthenticated: () => false,
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-estudiante" element={<div>Dashboard estudiante</div>} />
          <Route path="/dashboard-coordinador" element={<div>Dashboard coordinador</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

async function fillCredentials() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/institucional/i), 'samuel@test.com')
  await user.type(screen.getByLabelText(/contraseña/i), 'secret12')
  return user
}

describe('RQ2 integración — Redirigir al dashboard según el rol', () => {
  beforeEach(() => {
    login.mockReset()
    loginWithRole.mockReset()
    localStorage.clear()
  })

  it('Camino 1: un solo rol — back envía dashboard y el front navega', async () => {
    login.mockResolvedValue({
      token: 'jwt',
      user: {
        id: 'u1',
        email: 'samuel@test.com',
        nombre: 'Samuel',
        apellido: 'Gallego',
        tipo_usuario: 'estudiante',
        roles: ['estudiante'],
        dashboard: '/dashboard-estudiante',
      },
    })

    renderLogin()
    const user = await fillCredentials()
    await user.click(screen.getByRole('button', { name: /iniciar sesión como estudiante/i }))

    expect(await screen.findByText('Dashboard estudiante')).toBeInTheDocument()
  })

  it('Camino 2: varios roles — el usuario elige y navega al dashboard elegido', async () => {
    login.mockResolvedValue({
      token: '',
      user: {
        id: 'u1',
        email: 'samuel@test.com',
        nombre: 'Samuel',
        apellido: 'Gallego',
        tipo_usuario: 'profesor',
        roles: ['profesor', 'coordinador'],
      },
      available_roles: ['profesor', 'coordinador'],
      requires_role_selection: true,
    })
    loginWithRole.mockResolvedValue({
      token: 'jwt-role',
      user: {
        id: 'u1',
        email: 'samuel@test.com',
        nombre: 'Samuel',
        apellido: 'Gallego',
        tipo_usuario: 'profesor',
        roles: ['profesor', 'coordinador'],
        selected_role: 'coordinador',
        dashboard: '/dashboard-coordinador',
      },
    })

    renderLogin()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^estudiante$/i }))
    await user.click(screen.getByText('Coordinador'))
    await user.type(screen.getByLabelText(/institucional/i), 'samuel@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secret12')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como coordinador/i }))

    expect(await screen.findByText('Selecciona tu Rol')).toBeInTheDocument()
    await user.click(screen.getByText('Acceso al dashboard de coordinadores'))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(await screen.findByText('Dashboard coordinador')).toBeInTheDocument()
    expect(loginWithRole).toHaveBeenCalledWith({
      email: 'samuel@test.com',
      password: 'secret12',
      selectedRole: 'coordinador',
    })
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const login = vi.fn()

vi.mock('../../api/auth', () => ({
  authApi: {
    login: (...args: unknown[]) => login(...args),
    loginWithRole: vi.fn(),
    getCurrentUser: () => null,
    isAuthenticated: () => false,
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

/** RQ2 integration: login navega con dashboard que envía el back (sin inventar path en Front). */
describe('RQ2 integration — Login → dashboard del back', () => {
  beforeEach(() => {
    login.mockReset()
    localStorage.clear()
  })

  it('C1: back envía dashboard → Front navega ahí', async () => {
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

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard-estudiante" element={<div>Dashboard estudiante</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/institucional/i), 'samuel@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secret12')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como estudiante/i }))

    expect(await screen.findByText('Dashboard estudiante')).toBeInTheDocument()
  })
})

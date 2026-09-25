import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import { authApi } from '../../api/auth'

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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-estudiante" element={<div>Panel del estudiante</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const estudiante = {
  id: '1',
  email: 'estudiante@uni.edu',
  nombre: 'Est',
  apellido: 'Iante',
  tipo_usuario: 'estudiante',
}

describe('RQ2 — Login (pantalla real)', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset()
  })

  it('valida el formato del correo antes de intentar el login', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'correo-invalido')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(
      await screen.findByText('Por favor, ingresa un correo electrónico válido')
    ).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('con credenciales correctas, inicia sesión y redirige al dashboard del rol', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })

    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'estudiante@uni.edu', password: 'Abcdef1!' })
    expect(window.localStorage.getItem('token')).toBe('tok-123')
  })

  it('con contraseña incorrecta, muestra el error del backend y no navega', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { error: 'Credenciales inválidas' } },
    })

    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(screen.queryByText('Panel del estudiante')).not.toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem('token')).toBeNull())
  })

  it('el campo de contraseña es obligatorio a nivel de formulario (HTML5) antes de poder enviarlo', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(authApi.login).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import { useAuth } from '../../context/AuthContext'
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

function LoginProbe({ expectedType }: { expectedType?: string }) {
  const { login, user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const intentarLogin = async () => {
    setStatus('cargando')
    setError('')
    try {
      const respuesta = await login('estudiante@uni.edu', 'Abcdef1!', expectedType)
      if (respuesta && 'requires_role_selection' in respuesta && respuesta.requires_role_selection) {
        setStatus('requiere-rol')
      } else {
        setStatus('ok')
      }
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'error desconocido')
    }
  }

  return (
    <div>
      <button onClick={intentarLogin}>iniciar sesión</button>
      <span data-testid="status">{status}</span>
      <span data-testid="error">{error}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
    </div>
  )
}

const baseUser = {
  id: '1',
  email: 'estudiante@uni.edu',
  nombre: 'Est',
  apellido: 'Iante',
  tipo_usuario: 'estudiante',
}

describe('RQ2 — Login (integración)', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset()
    vi.mocked(authApi.loginWithRole).mockReset()
  })

  it('con credenciales válidas y un solo rol, guarda el token y el usuario en la sesión', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: baseUser })

    renderConSesion(<LoginProbe expectedType="student" />)
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ok'))
    expect(screen.getByTestId('user-email')).toHaveTextContent('estudiante@uni.edu')
    expect(window.localStorage.getItem('token')).toBe('tok-123')
    expect(JSON.parse(window.localStorage.getItem('user') || '{}')).toMatchObject(baseUser)
  })

  it('si el tipo elegido en el formulario no corresponde a ningún rol de la cuenta, rechaza con un mensaje claro y no guarda sesión', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'tok-123',
      user: { ...baseUser, tipo_usuario: 'profesor' },
      available_roles: ['profesor'],
    })

    renderConSesion(<LoginProbe expectedType="student" />)
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(screen.getByTestId('error')).toHaveTextContent(/no coincide con tu cuenta/i)
    expect(screen.getByTestId('error')).toHaveTextContent(/Docente/)
    expect(window.localStorage.getItem('token')).toBeNull()
  })

  it('con una cuenta de varios roles que requiere selección, elige por el usuario el rol que coincide con el formulario', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'tok-temporal',
      user: baseUser,
      available_roles: ['estudiante', 'coordinador'],
      requires_role_selection: true,
    })
    vi.mocked(authApi.loginWithRole).mockResolvedValue({
      token: 'tok-final',
      user: { ...baseUser, selected_role: 'estudiante' },
    })

    renderConSesion(<LoginProbe expectedType="student" />)
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ok'))
    expect(authApi.loginWithRole).toHaveBeenCalledWith({
      email: 'estudiante@uni.edu',
      password: 'Abcdef1!',
      selectedRole: 'estudiante',
    })
    expect(window.localStorage.getItem('token')).toBe('tok-final')
  })

  it('sin tipo de usuario esperado, si la cuenta requiere selección de rol, no guarda sesión todavía', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'tok-temporal',
      user: baseUser,
      available_roles: ['estudiante', 'coordinador'],
      requires_role_selection: true,
    })

    renderConSesion(<LoginProbe />)
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('requiere-rol'))
    expect(window.localStorage.getItem('token')).toBeNull()
    expect(authApi.loginWithRole).not.toHaveBeenCalled()
  })
})

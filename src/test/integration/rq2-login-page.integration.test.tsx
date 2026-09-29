import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import { authStorage } from '../../lib/storage'
import { RoleMismatchError } from '../../features/auth/errors'
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
          <Route path="/forgot-password" element={<div>Recuperar contraseña</div>} />
          <Route path="/destino" element={<div>Destino guardado</div>} />
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

  it('abre los tipos de usuario, limpia el correo y manda a recuperar la contraseña', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /^estudiante$/i }))
    await user.click(screen.getByRole('button', { name: /^docente$/i }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^docente$/i })).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: /^docente$/i }))
    await user.click(screen.getByRole('button', { name: /^coordinador$/i }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^coordinador$/i })).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: /^coordinador$/i }))
    await user.click(screen.getByRole('button', { name: /^decano$/i }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^decano$/i })).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: /^decano$/i }))
    await user.click(screen.getByRole('button', { name: /^administrador$/i }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^administrador$/i })).toHaveLength(1))

    const correo = screen.getByLabelText(/email institucional/i)
    await user.type(correo, 'a')
    await user.clear(correo)
    expect(screen.queryByText('Por favor, ingresa un correo electrónico válido')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }))
    expect(await screen.findByText('Recuperar contraseña')).toBeInTheDocument()
  })

  it('si el rol no coincide, muestra ese error y respeta un regreso pendiente', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockRejectedValueOnce(new RoleMismatchError('El tipo de usuario seleccionado no coincide'))
    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/no coincide/i)).toBeInTheDocument()

    vi.spyOn(authStorage, 'consumeRedirectTo').mockReturnValue('/destino')
    vi.mocked(authApi.login).mockResolvedValueOnce({ token: 'tok-123', user: estudiante })
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Destino guardado')).toBeInTheDocument()
  })

  it('el envío directo sin contraseña o con correo inválido no llama al login', async () => {
    const user = userEvent.setup()
    renderLogin()
    const formulario = screen.getByLabelText(/correo institucional/i).closest('form') as HTMLFormElement

    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    fireEvent.submit(formulario)
    expect(await screen.findByText('Por favor, completa todos los campos')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/correo institucional/i))
    await user.type(screen.getByLabelText(/correo institucional/i), 'correo-invalido')
    fireEvent.submit(formulario)
    expect(authApi.login).not.toHaveBeenCalled()
  })
})

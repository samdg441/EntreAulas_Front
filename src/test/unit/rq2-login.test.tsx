/**
 * RQ2 — Inicio de sesión.
 * Ejercita el código real: <Login/> → AuthContext.login → authApi.login.
 * Único límite mockeado: apiClient (capa axios).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

vi.mock('../../api/client', () => {
  const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { apiClient, default: apiClient }
})

import { apiClient } from '../../api/client'
import Login from '../../features/auth/Login'

const api = apiClient as unknown as Record<'get' | 'post' | 'put' | 'delete', ReturnType<typeof vi.fn>>

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-estudiante" element={<div>Panel estudiante</div>} />
          <Route path="/dashboard-coordinador" element={<div>Panel coordinador</div>} />
          <Route path="/qr-evaluacion/abc" element={<div>Volver al QR</div>} />
          <Route path="/forgot-password" element={<div>Recuperar</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

const usuarioEstudiante = {
  id: '1',
  email: 'ana@uni.edu',
  nombre: 'Ana',
  apellido: 'Pérez',
  tipo_usuario: 'estudiante',
}

beforeEach(() => {
  api.post.mockReset()
  api.get.mockReset()
})

describe('RQ2 — Login', () => {
  it('C1: correo con formato inválido → error inline y NO se llama a la API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'no-es-correo')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText(/ingresa un correo electrónico válido/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C2: credenciales válidas y rol coincide → POST /api/auth/login y redirección al dashboard', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'jwt-123', user: usuarioEstudiante } })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText('Panel estudiante')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'ana@uni.edu',
      password: 'Password123!',
    })
    expect(localStorage.getItem('token')).toBe('jwt-123')
  })

  it('C3: el backend pide selección de rol → aparece el modal "Selecciona tu Rol"', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: {
        requires_role_selection: true,
        available_roles: ['coordinador', 'profesor'],
        user: { ...usuarioEstudiante, nombre: 'Ana', apellido: 'Pérez' },
      },
    })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText(/selecciona tu rol/i)).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('C4: credenciales inválidas (401) → banner con el mensaje del backend', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' }, status: 401 } })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'mala')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('C5: el rol del usuario no coincide con el tipo elegido → banner de discrepancia', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: { token: 'jwt-x', user: { ...usuarioEstudiante, tipo_usuario: 'profesor' } },
    })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText(/no coincide con los roles del usuario/i)).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('C6: selección de rol → loginWithRole (POST /api/auth/login-with-role) y redirección', async () => {
    const user = userEvent.setup()
    api.post.mockImplementation((url: string) =>
      url.includes('login-with-role')
        ? Promise.resolve({
            data: { token: 'jwt-rol', user: { ...usuarioEstudiante, tipo_usuario: 'coordinador' } },
          })
        : Promise.resolve({
            data: {
              requires_role_selection: true,
              available_roles: ['coordinador', 'profesor'],
              user: usuarioEstudiante,
            },
          }),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    await screen.findByText(/selecciona tu rol/i)
    await user.click(screen.getByRole('button', { name: /coordinador/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(await screen.findByText('Panel coordinador')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/api/auth/login-with-role', {
      email: 'ana@uni.edu',
      password: 'Password123!',
      selectedRole: 'coordinador',
    })
  })

  it('C7a: submit con email inválido (guarda de handleSubmit) → error, sin API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    fireEvent.submit(screen.getByRole('button', { name: /iniciar sesión como/i }).closest('form')!)
    expect(await screen.findByText(/ingresa un correo electrónico válido/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C7b: submit sin contraseña → "completa todos los campos", sin API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    fireEvent.submit(screen.getByRole('button', { name: /iniciar sesión como/i }).closest('form')!)
    expect(await screen.findByText(/completa todos los campos/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C7: con redirectTo en localStorage → login vuelve a esa ruta y no al dashboard', async () => {
    const user = userEvent.setup()
    localStorage.setItem('redirectTo', '/qr-evaluacion/abc')
    api.post.mockResolvedValue({ data: { token: 'jwt-123', user: usuarioEstudiante } })
    renderLogin()

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión como/i }))

    expect(await screen.findByText('Volver al QR')).toBeInTheDocument()
    expect(localStorage.getItem('redirectTo')).toBeNull()
  })
})

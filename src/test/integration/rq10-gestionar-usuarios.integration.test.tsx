import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      nombre: 'Ada',
      apellido: 'Admin',
      email: 'ada@test.com',
      tipo_usuario: 'admin',
    },
    loading: false,
    hasRole: (role: string) => role === 'admin',
  }),
}))

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const apiGet = vi.fn()
const apiPost = vi.fn()
const apiPut = vi.fn()
const apiDelete = vi.fn()

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
  default: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}))

const listed = [
  {
    id: 'u-est',
    email: 'ana@test.com',
    nombre: 'Ana',
    apellido: 'Perez',
    tipo_usuario: 'estudiante',
    activo: true,
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>
  )
}

describe('RQ10 integración — Gestionar usuarios', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    apiPut.mockReset()
    apiDelete.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    apiGet.mockResolvedValue({ data: { users: listed } })
  })

  it('Camino 2: POST create-user 400 → error en el formulario', async () => {
    apiPost.mockRejectedValue({
      response: { status: 400, data: { error: 'El email ya está registrado' } },
    })

    renderPage()
    expect(await screen.findByText('ana@test.com')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText('Nombre'), 'Luis')
    await user.type(screen.getByLabelText('Apellido'), 'Gomez')
    await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
    expect(apiPost).toHaveBeenCalledWith(
      '/api/auth/create-user',
      expect.objectContaining({ email: 'nuevo@test.com' })
    )
  })

  it('Camino 3: POST 201 recarga el listado con el usuario nuevo', async () => {
    apiGet
      .mockResolvedValueOnce({ data: { users: listed } })
      .mockResolvedValueOnce({
        data: {
          users: [
            ...listed,
            {
              id: 'u-new',
              email: 'nuevo@test.com',
              nombre: 'Luis',
              apellido: 'Gomez',
              tipo_usuario: 'estudiante',
              activo: true,
            },
          ],
        },
      })
    apiPost.mockResolvedValue({
      data: { message: 'Usuario creado exitosamente', user: { id: 'u-new' } },
    })

    renderPage()
    expect(await screen.findByText('ana@test.com')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText('Nombre'), 'Luis')
    await user.type(screen.getByLabelText('Apellido'), 'Gomez')
    await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(await screen.findByText('nuevo@test.com')).toBeInTheDocument()
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/api/auth/create-user', expect.any(Object))
    })
  })

  it('Camino 7: DELETE 200 marca al usuario inactivo', async () => {
    apiGet
      .mockResolvedValueOnce({ data: { users: listed } })
      .mockResolvedValueOnce({
        data: { users: [{ ...listed[0], activo: false }] },
      })
    apiDelete.mockResolvedValue({
      data: { message: 'Usuario desactivado', user: { ...listed[0], activo: false } },
    })

    renderPage()
    expect(await screen.findByText('ana@test.com')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
    const confirms = screen.getAllByRole('button', { name: /^desactivar$/i })
    await user.click(confirms[confirms.length - 1])

    expect(await screen.findByText('Inactivo')).toBeInTheDocument()
    expect(apiDelete).toHaveBeenCalledWith('/api/users/u-est')
  })
})

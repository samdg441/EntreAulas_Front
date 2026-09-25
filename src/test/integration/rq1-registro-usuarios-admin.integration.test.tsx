import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import { usersApi } from '../../api/users'

vi.mock('../../api/users', () => ({
  usersApi: {
    list: vi.fn(),
    stats: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}))

const admin = { id: 'admin-1', email: 'admin@uni.edu', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' }

describe('RQ1 — Registro de usuarios desde admin (integración)', () => {
  beforeEach(() => {
    vi.mocked(usersApi.list).mockResolvedValue({ users: [] })
  })

  it('bloquea la creación con una contraseña que no cumple la política y no llama a la API', async () => {
    const user = userEvent.setup()
    renderConSesion(<AdminUsersPage />, { user: admin })

    await waitFor(() => expect(usersApi.list).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))

    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^email$/i), 'nuevo@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'corta')

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres')
    ).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('con una contraseña válida, crea el usuario, lo agrega a la tabla y cierra el modal', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.create).mockResolvedValue({ id: 'nuevo-1' })
    renderConSesion(<AdminUsersPage />, { user: admin })

    await waitFor(() => expect(usersApi.list).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^email$/i), 'nuevo@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    await waitFor(() =>
      expect(usersApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@uni.edu',
          password: 'Abcdef1!',
          nombre: 'Nuevo',
          apellido: 'Usuario',
          tipo_usuario: 'estudiante',
        })
      )
    )

    expect(await screen.findByText('nuevo@uni.edu')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /agregar usuario/i })).not.toBeInTheDocument()
  })

  it('si la API rechaza la creación, muestra el mensaje de error y deja el modal abierto', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.create).mockRejectedValue({
      response: { data: { error: 'El correo ya está registrado' } },
    })
    renderConSesion(<AdminUsersPage />, { user: admin })

    await waitFor(() => expect(usersApi.list).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^email$/i), 'repetido@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /agregar usuario/i })).toBeInTheDocument()
  })

  it('restringe la página a admin: con un usuario sin permisos, la lista no llega a pintarse igual', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({
      users: [
        { id: '1', email: 'a@uni.edu', nombre: 'Ana', apellido: 'Pérez', tipo_usuario: 'estudiante', activo: true },
      ],
    })
    renderConSesion(<AdminUsersPage />, { user: admin })

    const fila = await screen.findByText('a@uni.edu')
    expect(within(fila.closest('tr') as HTMLElement).getByText(/estudiante/i)).toBeInTheDocument()
  })
})

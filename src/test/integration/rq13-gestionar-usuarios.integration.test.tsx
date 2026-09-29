import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

function persona(indice: number, extra: Record<string, unknown> = {}) {
  return {
    id: `u-${indice}`,
    email: `user${indice}@uni.edu`,
    nombre: `Nombre${indice}`,
    apellido: 'Pérez',
    tipo_usuario: indice % 2 === 0 ? 'profesor' : 'estudiante',
    activo: indice !== 3,
    ...extra,
  }
}

describe('RQ13 — gestionar usuarios en la pantalla', () => {
  beforeEach(() => {
    vi.mocked(usersApi.list).mockReset()
    vi.mocked(usersApi.update).mockReset()
    vi.mocked(usersApi.deactivate).mockReset()
    vi.mocked(usersApi.create).mockReset()
  })

  it('muestra el error del listado y, si no hay mensaje, uno genérico', async () => {
    vi.mocked(usersApi.list).mockRejectedValueOnce({ response: { data: { error: 'sin permiso' } } })
    const { unmount } = renderConSesion(<AdminUsersPage />, { user: admin })
    expect(await screen.findByText('sin permiso')).toBeInTheDocument()
    unmount()

    vi.mocked(usersApi.list).mockRejectedValueOnce(new Error('red'))
    renderConSesion(<AdminUsersPage />, { user: admin })
    expect(await screen.findByText('No se pudo cargar el listado')).toBeInTheDocument()
  })

  it('filtra por búsqueda, rol y estado, y pagina el listado', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({
      users: Array.from({ length: 11 }, (_, indice) => persona(indice)),
    })
    renderConSesion(<AdminUsersPage />, { user: admin })

    expect(await screen.findByText('user0@uni.edu')).toBeInTheDocument()
    expect(screen.queryByText('user10@uni.edu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(await screen.findByText('user10@uni.edu')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /anterior/i }))
    expect(await screen.findByText('user0@uni.edu')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'user10')
    expect(await screen.findByText('user10@uni.edu')).toBeInTheDocument()
    expect(screen.queryByText('user0@uni.edu')).not.toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText(/buscar por nombre/i))

    const [roles, estados] = screen.getAllByRole('combobox')
    await user.selectOptions(roles, 'profesor')
    expect(screen.queryByText('user1@uni.edu')).not.toBeInTheDocument()
    expect(screen.getByText('user0@uni.edu')).toBeInTheDocument()

    await user.selectOptions(roles, 'all')
    await user.selectOptions(estados, 'inactivo')
    expect(screen.getByText('user3@uni.edu')).toBeInTheDocument()
    expect(screen.queryByText('user0@uni.edu')).not.toBeInTheDocument()

    await user.selectOptions(estados, 'activo')
    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'nadie-con-este-nombre')
    expect(await screen.findByText(/no hay usuarios que coincidan/i)).toBeInTheDocument()
  })

  it('actualiza, rechaza correo o rol o clave inválidos, y cierra el formulario', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [persona(1)] })
    vi.mocked(usersApi.update).mockResolvedValue({})
    renderConSesion(<AdminUsersPage />, { user: admin })

    const fila = await screen.findByText('user1@uni.edu')
    await user.click(within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /editar/i }))

    await user.clear(screen.getByLabelText(/^nombre$/i))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Ana María')
    await user.click(screen.getByRole('button', { name: /actualizar/i }))
    await waitFor(() => expect(usersApi.update).toHaveBeenCalled())
    expect(screen.queryByRole('heading', { name: /actualizar usuario/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /editar/i }))
    await user.clear(screen.getByLabelText(/^correo$/i))
    await user.type(screen.getByLabelText(/^correo$/i), 'ana pérez!')
    await user.click(screen.getByRole('button', { name: /actualizar/i }))
    expect(await screen.findByText(/sin @ ni dominio/i)).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /estudiante/i }))
    await user.click(screen.getByRole('button', { name: /actualizar/i }))
    expect(await screen.findByText('Selecciona al menos un rol')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /profesor/i }))
    await user.clear(screen.getByLabelText(/^correo$/i))
    await user.type(screen.getByLabelText(/^correo$/i), 'ana')
    await user.type(screen.getByLabelText(/nueva contraseña/i), 'corta')
    await user.click(screen.getByRole('button', { name: /actualizar/i }))
    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByRole('heading', { name: /actualizar usuario/i })).not.toBeInTheDocument()
  })

  it('desactiva un usuario activo', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [persona(1, { activo: true })] })
    vi.mocked(usersApi.deactivate).mockResolvedValue({})

    renderConSesion(<AdminUsersPage />, { user: admin })
    const fila = await screen.findByText('user1@uni.edu')
    await user.click(within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /desactivar/i }))
    const titulo = await screen.findByRole('heading', { name: /desactivar usuario/i })
    await user.click(within(titulo.closest('.bg-white') as HTMLElement).getByRole('button', { name: /^desactivar$/i }))
    await waitFor(() => expect(usersApi.deactivate).toHaveBeenCalledWith('u-1'))
  })

  it('si activar falla, el error reemplaza el listado', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [persona(3, { activo: false })] })
    vi.mocked(usersApi.update).mockRejectedValueOnce(new Error('red'))

    renderConSesion(<AdminUsersPage />, { user: admin })
    const fila = await screen.findByText('user3@uni.edu')
    await user.click(within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /^activar$/i }))
    const titulo = await screen.findByRole('heading', { name: /activar usuario/i })
    await user.click(within(titulo.closest('.bg-white') as HTMLElement).getByRole('button', { name: /^activar$/i }))
    expect(await screen.findByText('No se pudo activar el usuario')).toBeInTheDocument()
  })

  it('activar un usuario inactivo llama a la actualización', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [persona(3, { activo: false })] })
    vi.mocked(usersApi.update).mockResolvedValue({})

    renderConSesion(<AdminUsersPage />, { user: admin })
    const fila = await screen.findByText('user3@uni.edu')
    await user.click(within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /^activar$/i }))
    const titulo = await screen.findByRole('heading', { name: /activar usuario/i })
    await user.click(within(titulo.closest('.bg-white') as HTMLElement).getByRole('button', { name: /^activar$/i }))
    await waitFor(() => expect(usersApi.update).toHaveBeenCalledWith('u-3', { activo: true }))
  })

  it('no deja crear un usuario si el correo local no es válido y cambia el dominio según el tipo', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [] })
    renderConSesion(<AdminUsersPage />, { user: admin })

    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
    await user.selectOptions(screen.getByLabelText(/^tipo de usuario$/i), 'profesor')
    expect(screen.getByText('@udemedellin.edu.co')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'ana pérez')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
    fireEvent.submit(screen.getByRole('button', { name: /^crear$/i }).closest('form') as HTMLFormElement)

    expect(await screen.findByText(/sin @ ni dominio/i)).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('si desactivar falla, el error queda en la lista', async () => {
    const user = userEvent.setup()
    vi.mocked(usersApi.list).mockResolvedValue({ users: [persona(1)] })
    vi.mocked(usersApi.deactivate).mockRejectedValue({
      response: { data: { error: 'No se pudo desactivar el usuario' } },
    })
    renderConSesion(<AdminUsersPage />, { user: admin })

    const fila = await screen.findByText('user1@uni.edu')
    await user.click(within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /desactivar/i }))
    const confirmar = screen.getAllByRole('button', { name: /^desactivar$/i })
    await user.click(confirmar[confirmar.length - 1])

    expect(await screen.findByText('No se pudo desactivar el usuario')).toBeInTheDocument()
  })
})

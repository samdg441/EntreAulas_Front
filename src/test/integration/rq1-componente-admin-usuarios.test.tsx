import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import { usersApi } from '../../api/users'

vi.mock('../../api/users', () => ({
  usersApi: { list: vi.fn(), stats: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))

const admin = { id: 'admin-1', email: 'admin@uni.edu', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' }
const montar = () => renderConSesion(<AdminUsersPage />, { user: admin })
const crearBtn = () => screen.getByRole('button', { name: /^crear$|guardando/i })

async function abrirModalYLlenar(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(usersApi.list).toHaveBeenCalled())
  await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
  await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
  await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
  await user.type(screen.getByLabelText(/^correo$/i), 'nuevo')
  await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
}

describe('RQ1 — Componente AdminUsersPage', () => {
  beforeEach(() => {
    vi.mocked(usersApi.list).mockReset().mockResolvedValue({ users: [] })
    vi.mocked(usersApi.create).mockReset()
  })

  it('RQ1·C-P1 (cargando la lista): muestra "Cargando usuarios…" y luego lo oculta', async () => {
    let resolver!: (v: { users: [] }) => void
    vi.mocked(usersApi.list).mockReturnValue(new Promise((r) => (resolver = r)))
    montar()

    expect(await screen.findByText(/cargando usuarios/i)).toBeInTheDocument()
    resolver({ users: [] })

    await waitFor(() => expect(screen.queryByText(/cargando usuarios/i)).not.toBeInTheDocument())
  })

  it('RQ1·C-P2 (lista vacía): muestra el mensaje de "sin coincidencias" y ninguna fila de usuario', async () => {
    montar()

    expect(await screen.findByText(/no hay usuarios que coincidan/i)).toBeInTheDocument()
  })

  it('RQ1·C-N1 (error al listar): muestra el mensaje del servidor y no la tabla', async () => {
    vi.mocked(usersApi.list).mockRejectedValue({ response: { data: { error: 'Error interno del servidor' } } })
    montar()

    expect(await screen.findByText('Error interno del servidor')).toBeInTheDocument()
    expect(screen.queryByText(/no hay usuarios que coincidan/i)).not.toBeInTheDocument()
  })

  it('RQ1·C-P3 (abrir y cerrar el modal): "Cerrar" descarta el formulario sin llamar a la API', async () => {
    const user = userEvent.setup()
    montar()
    await waitFor(() => expect(usersApi.list).toHaveBeenCalled())
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
    expect(screen.getByRole('heading', { name: /agregar usuario/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar/i }))

    expect(screen.queryByRole('heading', { name: /agregar usuario/i })).not.toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('RQ1·C-P4 (guardando): el botón se deshabilita con "Guardando…" y varios clics producen UNA sola creación', async () => {
    vi.mocked(usersApi.create).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    montar()
    await abrirModalYLlenar(user)

    await user.click(crearBtn())
    await user.click(crearBtn())

    await waitFor(() => expect(crearBtn()).toBeDisabled())
    expect(crearBtn()).toHaveTextContent(/guardando/i)
    expect(usersApi.create).toHaveBeenCalledTimes(1)
  })

  it('RQ1·C-P5 (éxito): envía el correo institucional completo, cierra el modal y agrega la fila', async () => {
    vi.mocked(usersApi.create).mockResolvedValue({ user: { id: 'n-1' } })
    const user = userEvent.setup()
    montar()
    await abrirModalYLlenar(user)

    await user.click(crearBtn())

    expect(await screen.findByText('nuevo@soyudemedellin.edu.co')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /agregar usuario/i })).not.toBeInTheDocument()
    expect(usersApi.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'nuevo@soyudemedellin.edu.co', tipo_usuario: 'estudiante' }))
  })

  it.each([
    ['400 correo duplicado', { response: { status: 400, data: { error: 'El email ya está registrado' } } }, 'El email ya está registrado'],
    ['401 sesión vencida', { response: { status: 401, data: { error: 'Token expirado', code: 'TOKEN_EXPIRED' } } }, 'Token expirado'],
    ['403 sin permiso', { response: { status: 403, data: { error: 'No tienes permisos' } } }, 'No tienes permisos'],
    ['500 interno', { response: { status: 500, data: { error: 'Error interno del servidor' } } }, 'Error interno del servidor'],
    ['sin respuesta (red caída)', new Error('Network Error'), 'Error al crear usuario'],
  ])('RQ1·C-N2 (error %s) muestra "%s", deja el modal abierto y rehabilita el botón', async (_caso, falla, mensaje) => {
    vi.mocked(usersApi.create).mockRejectedValue(falla)
    const user = userEvent.setup()
    montar()
    await abrirModalYLlenar(user)

    await user.click(crearBtn())

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /agregar usuario/i })).toBeInTheDocument()
    await waitFor(() => expect(crearBtn()).toBeEnabled())
    expect(screen.queryByText('nuevo@soyudemedellin.edu.co')).not.toBeInTheDocument()
  })

  it.each([
    ['contraseña corta', 'corta', 'La contraseña debe tener al menos 8 caracteres'],
    ['sin mayúscula', 'abcdef1!', 'La contraseña debe contener al menos una letra mayúscula'],
  ])('RQ1·C-N3 (validación) %s → "%s" y ninguna petición', async (_caso, clave, mensaje) => {
    const user = userEvent.setup()
    montar()
    await waitFor(() => expect(usersApi.list).toHaveBeenCalled())
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'nuevo')
    await user.type(screen.getByLabelText(/^contraseña$/i), clave)

    await user.click(crearBtn())

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('RQ1·C-N4 (dominio impuesto): aunque se escriba otro dominio, el correo enviado tiene una sola @ y es el institucional del tipo elegido', async () => {
    vi.mocked(usersApi.create).mockResolvedValue({ user: { id: 'n-1' } })
    const user = userEvent.setup()
    montar()
    await waitFor(() => expect(usersApi.list).toHaveBeenCalled())
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'ana@evil.co')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(crearBtn())

    await waitFor(() => expect(usersApi.create).toHaveBeenCalledTimes(1))
    const enviado = vi.mocked(usersApi.create).mock.calls[0][0].email
    expect(enviado).toMatch(/^[^@\s]+@soyudemedellin\.edu\.co$/)
    expect(enviado.split('@')).toHaveLength(2)
  })

  it('RQ1·C-N5 (caracteres inválidos): un usuario de correo con símbolos no se envía y se explica el formato', async () => {
    const user = userEvent.setup()
    montar()
    await waitFor(() => expect(usersApi.list).toHaveBeenCalled())
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'ana<b>!')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(crearBtn())

    expect(await screen.findByText(/solo el usuario del correo/i)).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('RQ1·C-P6 (búsqueda): filtra la tabla por texto y muestra el mensaje cuando nada coincide', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({
      users: [
        { id: '1', email: 'ana@soyudemedellin.edu.co', nombre: 'Ana', apellido: 'Pérez', tipo_usuario: 'estudiante', activo: true },
        { id: '2', email: 'luis@udemedellin.edu.co', nombre: 'Luis', apellido: 'Gómez', tipo_usuario: 'profesor', activo: true },
      ],
    })
    const user = userEvent.setup()
    montar()
    await screen.findByText('ana@soyudemedellin.edu.co')

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'luis')
    expect(screen.queryByText('ana@soyudemedellin.edu.co')).not.toBeInTheDocument()
    expect(screen.getByText('luis@udemedellin.edu.co')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText(/buscar por nombre/i))
    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'zzz')
    expect(await screen.findByText(/no hay usuarios que coincidan/i)).toBeInTheDocument()
  })
})

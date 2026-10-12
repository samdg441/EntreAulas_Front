import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import { usersApi } from '../../api/users'
import { decidirAccesoRuta } from '../../features/auth/dashboard-path'

vi.mock('../../api/users', () => ({
  usersApi: { list: vi.fn(), stats: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))

const admin = { id: 'admin-1', email: 'admin@uni.edu', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' }
const sesion = '{"id":1}'

describe('RQ1 — Acceso a la pantalla de alta de usuarios (solo admin)', () => {
  it.each([
    ['estudiante', { tipo_usuario: 'estudiante' }],
    ['profesor', { roles: ['profesor'] }],
    ['coordinador', { roles: ['coordinador'] }],
    ['decano', { roles: ['decano'] }],
    ['tipo con mayúsculas', { tipo_usuario: 'ESTUDIANTE' }],
    ['sin rol', {}],
  ])('un %s es enviado a /forbidden', (_caso, user) => {
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: sesion, user, allowedRoles: ['admin'] })).toBe('forbidden')
  })

  it('sin token o sin usuario guardado va al login', () => {
    expect(decidirAccesoRuta({ token: null, savedUser: sesion, user: { roles: ['admin'] }, allowedRoles: ['admin'] })).toBe('login')
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: null, user: { roles: ['admin'] }, allowedRoles: ['admin'] })).toBe('login')
  })

  it('un admin entra', () => {
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: sesion, user: { tipo_usuario: 'admin' }, allowedRoles: ['admin'] })).toBe('ok')
  })
})

describe('RQ1 — Entradas del formulario de alta', () => {
  beforeEach(() => {
    vi.mocked(usersApi.list).mockResolvedValue({ users: [] })
    vi.mocked(usersApi.create).mockReset()
  })

  async function abrirFormulario() {
    const user = userEvent.setup()
    renderConSesion(<AdminUsersPage />, { user: admin })
    await waitFor(() => expect(usersApi.list).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
    return user
  }

  it.each([
    ['con arroba y dominio ajeno', 'intruso@evil.co'],
    ['con arroba', 'ana@soyudemedellin.edu.co'],
    ['con espacios', 'ana gomez'],
    ['con salto de línea (CRLF)', 'ana\r\nBcc: x@evil.co'],
  ])('un usuario de correo %s no puede cambiar el dominio ni inyectar cabeceras', async (_caso, local) => {
    vi.mocked(usersApi.create).mockResolvedValue({ id: 'n-1' })
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), local)
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    // Si se envía, el correo es siempre uno solo, institucional y sin espacios ni saltos de línea.
    for (const [payload] of vi.mocked(usersApi.create).mock.calls) {
      expect(payload.email).toMatch(/^[^\s@]+@soyudemedellin\.edu\.co$/)
    }
  })

  it.each(['12345678', 'abcdefgh', 'ABCDEFGH', 'Abcdefgh', 'Abcdefg1'])('contraseña débil "%s" → no se llama a la API', async (clave) => {
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'nuevo')
    await user.type(screen.getByLabelText(/^contraseña$/i), clave)

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('el campo de contraseña del alta oculta lo escrito', async () => {
    await abrirFormulario()

    expect(screen.getByLabelText(/^contraseña$/i)).toHaveAttribute('type', 'password')
  })

  it('un mensaje de error del back con HTML se muestra como texto', async () => {
    vi.mocked(usersApi.create).mockRejectedValue({ response: { data: { error: '<b onmouseover=alert(1)>boom</b>' } } })
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Usuario')
    await user.type(screen.getByLabelText(/^correo$/i), 'nuevo')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')

    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    expect(await screen.findByText('<b onmouseover=alert(1)>boom</b>')).toBeInTheDocument()
    expect(document.querySelector('b[onmouseover]')).toBeNull()
  })

  it('nombres con HTML que llegan de la API se pintan como texto en la tabla (sin XSS almacenado)', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({
      users: [{ id: 'u-9', email: 'x@soyudemedellin.edu.co', nombre: '<img src=x onerror=alert(1)>', apellido: '<script>alert(2)</script>', tipo_usuario: 'estudiante', activo: true }],
    })
    const { container } = renderConSesion(<AdminUsersPage />, { user: admin })

    await screen.findByText(/<img src=x onerror=alert\(1\)>/)

    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })
})

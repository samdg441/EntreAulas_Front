import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import ForgotPassword from '../../features/auth/ForgotPassword'
import ResetPassword from '../../features/auth/ResetPassword'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import { renderConSesion } from '../helpers/render'
import { validateResetToken } from '../../api/passwordReset'
import { usersApi } from '../../api/users'

vi.mock('../../api/passwordReset', () => ({ requestPasswordReset: vi.fn(), resetPassword: vi.fn(), validateResetToken: vi.fn() }))
vi.mock('../../api/users', () => ({ usersApi: { list: vi.fn(), stats: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() } }))

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

/** Un campo es accesible si tiene <label for>, aria-label o aria-labelledby que lo nombre. */
function camposSinNombre(contenedor: HTMLElement) {
  return Array.from(contenedor.querySelectorAll('input:not([type=hidden]), select, textarea')).filter((el) => {
    const id = el.getAttribute('id')
    const conLabel = id && contenedor.querySelector(`label[for="${id}"]`)
    return !conLabel && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')
  })
}

describe('RQ1–RQ5 — Accesibilidad básica de las pantallas', () => {
  it('RQ2·AX-P1: Login — todos los campos tienen etiqueta y el botón de envío tiene texto', () => {
    const { container } = renderLogin()

    expect(camposSinNombre(container)).toHaveLength(0)
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toHaveAttribute('type', 'submit')
  })

  it('RQ2·AX-P2: Login — con solo el teclado se llega correo → contraseña → botón de envío (y Enter lo activa)', async () => {
    const user = userEvent.setup()
    renderLogin()
    screen.getByLabelText(/correo institucional/i).focus()

    await user.tab()
    expect(screen.getByLabelText(/^contraseña$/i)).toHaveFocus()
    // El botón es alcanzable: máximo 2 tabulaciones (la segunda por un contenedor extra, ver DEF-FE-11).
    await user.tab()
    if (document.activeElement !== screen.getByRole('button', { name: /iniciar sesión/i })) await user.tab()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toHaveFocus()
  })

  it('RQ3·AX-P3: ForgotPassword — el campo de correo tiene etiqueta y es de tipo email', () => {
    const { container } = renderConSesion(<ForgotPassword />, { route: '/forgot-password' })

    expect(camposSinNombre(container)).toHaveLength(0)
    expect(screen.getByLabelText(/correo institucional/i)).toHaveAttribute('type', 'email')
  })

  it('RQ5·AX-P4: ResetPassword — los tres campos tienen etiqueta', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    const { container } = renderConSesion(<ResetPassword />, { route: '/reset-password?token=t&email=a%40b.co' })
    await screen.findByLabelText(/^nueva contraseña$/i)

    expect(camposSinNombre(container)).toHaveLength(0)
  })

  it('RQ1·AX-P5: AdminUsersPage — los campos del modal de alta tienen etiqueta y "Cerrar" tiene nombre', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({ users: [] })
    const user = userEvent.setup()
    renderConSesion(<AdminUsersPage />, { user: { id: 'a', email: 'a@uni.edu', nombre: 'Ada', apellido: 'Admin', tipo_usuario: 'admin' } })
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))

    const modal = screen.getByRole('heading', { name: /agregar usuario/i }).closest('div') as HTMLElement
    expect(camposSinNombre(modal.parentElement as HTMLElement)).toHaveLength(0)
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument()
  })
})

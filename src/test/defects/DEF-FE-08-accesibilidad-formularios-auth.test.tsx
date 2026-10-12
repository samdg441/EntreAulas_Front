/**
 * DEF-FE-08 / DEF-FE-09 / DEF-FE-10 — Accesibilidad de los formularios de autenticación (RQ2, RQ3, RQ5)
 *
 * Severidad: Media | Estado: ABIERTO. Estas pruebas expresan el comportamiento CORRECTO y fallan a propósito.
 *
 * DEF-FE-08  Los botones de «mostrar/ocultar contraseña» de ResetPassword solo contienen un icono: un lector de
 *            pantalla anuncia «botón» sin nombre. Falta aria-label (WCAG 4.1.2 Nombre, función, valor).
 * DEF-FE-09  Los mensajes de error (credenciales inválidas, token expirado, error del servidor) aparecen en un <div>/<p>
 *            sin role="alert" ni aria-live: quien usa lector de pantalla no se entera de que el envío falló
 *            (WCAG 4.1.3 Mensajes de estado).
 * DEF-FE-11  El botón «Iniciar sesión» va envuelto en un <div tabindex="0"> (efecto de framer-motion `whileTap`):
 *            quien navega con teclado necesita DOS tabulaciones para llegar al botón y el primer foco no hace nada
 *            (WCAG 2.4.3 Orden del foco).
 * DEF-FE-10  Un campo con error no declara aria-invalid ni aria-describedby que lo una con su mensaje
 *            (WCAG 3.3.1 Identificación de errores).
 */
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import ForgotPassword from '../../features/auth/ForgotPassword'
import ResetPassword from '../../features/auth/ResetPassword'
import { renderConSesion } from '../helpers/render'
import { authApi } from '../../api/auth'
import { requestPasswordReset, resetPassword, validateResetToken } from '../../api/passwordReset'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(), getProfile: vi.fn(),
    getCurrentUser: () => null, getToken: () => null, isAuthenticated: () => false,
  },
}))
vi.mock('../../api/passwordReset', () => ({ requestPasswordReset: vi.fn(), resetPassword: vi.fn(), validateResetToken: vi.fn() }))

const CLAVE = 'Nueva-Clave2026!'

describe('DEF-FE-08 — Botones de icono con nombre accesible', () => {
  it('los botones de mostrar/ocultar contraseña de ResetPassword tienen aria-label', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    const { container } = renderConSesion(<ResetPassword />, { route: '/reset-password?token=t&email=a%40b.co' })
    await screen.findByLabelText(/^nueva contraseña$/i)

    const sinNombre = Array.from(container.querySelectorAll('button[type=button]')).filter(
      (b) => !(b.textContent ?? '').trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby')
    )

    expect(sinNombre).toHaveLength(0)
  })
})

describe('DEF-FE-09 — Los errores se anuncian (role="alert" o aria-live)', () => {
  it('Login: «Credenciales inválidas» está en una región de alerta', async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' } } })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/correo institucional/i), 'estudiante@uni.edu')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'mala')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await screen.findByText('Credenciales inválidas')

    expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
  })

  it('ForgotPassword: el error del servidor está en una región de alerta', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ success: false, message: 'Error interno del servidor' })
    const user = userEvent.setup()
    renderConSesion(<ForgotPassword />, { route: '/forgot-password' })
    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@soyudemedellin.edu.co')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await screen.findByText('Error interno del servidor')

    expect(screen.getByRole('alert')).toHaveTextContent('Error interno del servidor')
  })

  it('ResetPassword: el rechazo del servidor está en una región de alerta', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    vi.mocked(resetPassword).mockResolvedValue({ success: false, message: 'Token inválido o ya utilizado' })
    const user = userEvent.setup()
    renderConSesion(<ResetPassword />, { route: '/reset-password?token=t&email=a%40b.co' })
    await user.type(await screen.findByLabelText(/^nueva contraseña$/i), CLAVE)
    await user.type(screen.getByLabelText(/^confirmar nueva contraseña$/i), CLAVE)
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    await screen.findByText('Token inválido o ya utilizado')

    expect(screen.getByRole('alert')).toHaveTextContent('Token inválido o ya utilizado')
  })
})

describe('DEF-FE-10 — El campo con error queda enlazado a su mensaje', () => {
  it('ResetPassword: una contraseña débil marca el campo con aria-invalid', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'ok' })
    const user = userEvent.setup()
    renderConSesion(<ResetPassword />, { route: '/reset-password?token=t&email=a%40b.co' })
    const campo = await screen.findByLabelText(/^nueva contraseña$/i)
    await user.type(campo, 'Ab1!')
    await user.type(screen.getByLabelText(/^confirmar nueva contraseña$/i), 'Ab1!')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    await screen.findByText('La contraseña debe tener al menos 8 caracteres')

    await waitFor(() => expect(campo).toHaveAttribute('aria-invalid', 'true'))
  })
})

describe('DEF-FE-11 — Un solo punto de tabulación para el botón de login', () => {
  it('desde la contraseña, UNA tabulación llega al botón «Iniciar sesión»', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    screen.getByLabelText(/^contraseña$/i).focus()

    await user.tab()

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toHaveFocus()
  })
})

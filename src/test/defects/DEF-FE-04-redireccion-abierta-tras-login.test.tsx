/**
 * DEF-FE-04 — El login navega a cualquier valor guardado en `redirectTo` sin validarlo (RQ2)
 *
 * Severidad: Baja (hoy) | Estado: ABIERTO
 *
 * `Login.tsx` hace `navigate(authStorage.consumeRedirectTo())` sin validar el destino. Con React Router 7
 * una URL absoluta se interpreta como ruta relativa (`/login/https://evil...`, pantalla rota) y `//host`
 * hace fallar `history.pushState`, así que hoy NO se sale del sitio; pero la protección es accidental:
 * si alguien cambia a `window.location` o a `<Navigate>` externo, pasa a ser una redirección abierta
 * (phishing tras autenticarse). El valor vive en localStorage (lo escribe el flujo del QR y cualquier XSS).
 * Corrección: aceptar solo rutas internas que empiecen por una sola "/" y no por "//" ni esquema.
 *
 * Esta prueba expresa el comportamiento CORRECTO esperado y falla a propósito mientras siga abierto.
 */
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
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

function Ubicacion() {
  const { pathname } = useLocation()
  return <p data-testid="ubicacion">{pathname}</p>
}

describe('DEF-FE-04 — Redirección tras el login solo a rutas internas', () => {
  it.each(['https://evil.example/phishing', '//evil.example/phishing', 'javascript:alert(1)', 'http://localhost.evil.example'])(
    'redirectTo = %s no se usa como destino',
    async (peligroso) => {
      window.localStorage.setItem('redirectTo', peligroso)
      vi.mocked(authApi.login).mockResolvedValue({
        token: 'tok-123',
        user: { id: '1', email: 'e@uni.edu', nombre: 'E', apellido: 'I', tipo_usuario: 'estudiante' },
      })
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Ubicacion />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/correo institucional/i), 'e@uni.edu')
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Abcdef1!')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      const ubicacion = await screen.findByTestId('ubicacion')
      expect(ubicacion.textContent).toBe('/dashboard-estudiante')
    }
  )
})

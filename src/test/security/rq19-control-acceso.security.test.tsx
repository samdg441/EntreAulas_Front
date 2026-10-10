import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../routes/ProtectedRoute'
import { decidirAccesoRuta, getDashboardPathForUser } from '../../features/auth/dashboard-path'
import { renderConSesion, sembrarSesion } from '../helpers/render'

/**
 * RQ19 — Control de acceso por rol en el front.
 * El front decide qué pantalla mostrar; los datos los protege el back con 401/403
 * (ver e2e/cypress/e2e/api/rq19-seguridad-api.cy.ts).
 */
describe('RQ19 — Seguridad: control de acceso', () => {
  const sesion = '{"id":1}'

  it.each([
    { caso: 'sin token', token: null, savedUser: sesion, user: { roles: ['admin'] }, esperado: 'login' },
    { caso: 'token sin usuario guardado', token: 'jwt', savedUser: null, user: { roles: ['admin'] }, esperado: 'login' },
    { caso: 'token y usuario pero sin estado en memoria', token: 'jwt', savedUser: sesion, user: null, esperado: 'login' },
    { caso: 'estudiante en ruta de admin', token: 'jwt', savedUser: sesion, user: { tipo_usuario: 'estudiante' }, esperado: 'forbidden' },
    { caso: 'profesor en ruta de admin', token: 'jwt', savedUser: sesion, user: { roles: ['profesor'] }, esperado: 'forbidden' },
    { caso: 'rol con mayúsculas no se cuela como otro', token: 'jwt', savedUser: sesion, user: { tipo_usuario: 'ESTUDIANTE' }, esperado: 'forbidden' },
    { caso: 'rol vacío', token: 'jwt', savedUser: sesion, user: { tipo_usuario: '' }, esperado: 'forbidden' },
    { caso: 'admin con sinónimo administrator', token: 'jwt', savedUser: sesion, user: { tipo_usuario: 'administrator' }, esperado: 'ok' },
    { caso: 'multirol que incluye admin', token: 'jwt', savedUser: sesion, user: { roles: ['estudiante', 'admin'] }, esperado: 'ok' },
  ])('$caso → $esperado', ({ token, savedUser, user, esperado }) => {
    expect(decidirAccesoRuta({ token, savedUser, user, allowedRoles: ['admin'] })).toBe(esperado)
  })

  it('un rol desconocido no abre ningún dashboard privilegiado', () => {
    expect(getDashboardPathForUser({ roles: ['superusuario'] })).toBe('/dashboard')
    expect(getDashboardPathForUser({ tipo_usuario: '<script>' })).toBe('/dashboard')
  })

  it('Límite conocido: el guard confía en el usuario guardado en el navegador', () => {
    // Quien edite localStorage puede ver la pantalla, pero el back responde 403 a sus peticiones.
    const manipulado = { roles: ['estudiante'], selected_role: 'admin' }
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: sesion, user: manipulado, allowedRoles: ['admin'] })).toBe('ok')
  })

  describe('ProtectedRoute renderizado', () => {
    const rutas = (
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/forbidden" element={<p>Acceso denegado</p>} />
        <Route
          path="/dashboard-admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <p>Panel de admin</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    )

    it('sin sesión manda al login y nunca pinta el panel', async () => {
      renderConSesion(rutas, { route: '/dashboard-admin' })

      expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
      expect(screen.queryByText('Panel de admin')).not.toBeInTheDocument()
    })

    it('un estudiante con sesión va a acceso denegado', async () => {
      renderConSesion(rutas, { route: '/dashboard-admin', user: { tipo_usuario: 'estudiante', roles: ['estudiante'] } })

      expect(await screen.findByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.queryByText('Panel de admin')).not.toBeInTheDocument()
    })

    it('un admin ve el panel', async () => {
      renderConSesion(rutas, { route: '/dashboard-admin', user: { tipo_usuario: 'admin', roles: ['admin'] } })

      expect(await screen.findByText('Panel de admin')).toBeInTheDocument()
    })

    it('Regresión RQ19: un usuario guardado corrupto no rompe la app ni abre el panel', async () => {
      sembrarSesion({})
      window.localStorage.setItem('user', '{no es json')
      renderConSesion(rutas, { route: '/dashboard-admin' })

      expect(await screen.findByText(/Pantalla de login|Acceso denegado/)).toBeInTheDocument()
      expect(screen.queryByText('Panel de admin')).not.toBeInTheDocument()
    })
  })
})

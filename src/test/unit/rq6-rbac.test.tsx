import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../routes/ProtectedRoute'
import { AuthProvider } from '../../context/AuthContext'
import { mockEstudiante } from '../fixtures/users'

vi.mock('../../api/auth', () => ({
  authApi: {
    getCurrentUser: () => (globalThis as { __rq6User?: unknown }).__rq6User ?? null,
    isAuthenticated: () => Boolean((globalThis as { __rq6User?: unknown }).__rq6User),
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

function renderProtected(user: Record<string, unknown> | null) {
  ;(globalThis as { __rq6User?: unknown }).__rq6User = user
  if (user) {
    localStorage.setItem('token', 'jwt')
    localStorage.setItem('user', JSON.stringify(user))
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin/qr']}>
        <Routes>
          <Route path="/login" element={<div>Página login</div>} />
          <Route path="/forbidden" element={<div>Página forbidden</div>} />
          <Route
            path="/admin/qr"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>UI admin QR</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

/** RQ6 Front — ProtectedRoute C1 sin token | C2 sin user | C3 sin rol | C4 OK */
describe('RQ6 unit — Control de acceso (frontend)', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(globalThis as { __rq6User?: unknown }).__rq6User = undefined
  })

  it('C1: sin token → /login', async () => {
    renderProtected(null)
    expect(await screen.findByText('Página login')).toBeInTheDocument()
  })

  it('C2: token pero sin user en contexto → /login', async () => {
    localStorage.setItem('token', 'jwt')
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }))
    renderProtected(null)
    expect(await screen.findByText('Página login')).toBeInTheDocument()
  })

  it('C3: autenticado sin rol admin → /forbidden', async () => {
    renderProtected({
      id: mockEstudiante.id,
      email: mockEstudiante.email,
      nombre: 'Estu',
      apellido: 'Diante',
      tipo_usuario: 'estudiante',
      roles: ['estudiante'],
    })
    expect(await screen.findByText('Página forbidden')).toBeInTheDocument()
  })

  it('C4: autenticado con rol admin → UI', async () => {
    renderProtected({
      id: 'u-admin',
      email: 'admin@test.com',
      nombre: 'Ada',
      apellido: 'Admin',
      tipo_usuario: 'admin',
      roles: ['admin'],
    })
    expect(await screen.findByText('UI admin QR')).toBeInTheDocument()
  })
})

import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../routes/ProtectedRoute'
import { vi } from 'vitest'

vi.mock('../../api/auth', () => ({
  authApi: {
    getCurrentUser: () => (globalThis as { __rq19User?: unknown }).__rq19User ?? null,
    isAuthenticated: () => Boolean((globalThis as { __rq19User?: unknown }).__rq19User),
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

function PathProbe({ user }: { user: Record<string, unknown> }) {
  const { getDashboardPathForUser } = useAuth()
  return <span data-testid="path">{getDashboardPathForUser(user as never)}</span>
}

function renderPath(user: Record<string, unknown>) {
  return render(
    <AuthProvider>
      <PathProbe user={user} />
    </AuthProvider>
  )
}

/** RQ19 Front — solo getDashboardPathForUser (C1–C4) */
describe('RQ19 unit — Redirigir dashboard (frontend)', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(globalThis as { __rq19User?: unknown }).__rq19User = undefined
  })

  it('C1: usa dashboard del back', async () => {
    renderPath({ dashboard: '/dashboard-admin' })
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard-admin')
  })

  it('C2: prioridad de roles', async () => {
    renderPath({ roles: ['estudiante', 'coordinador'] })
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard-coordinador')
  })

  it('C3: roles sin match → tipo_usuario', async () => {
    renderPath({ roles: ['otro'], tipo_usuario: 'profesor' })
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard-profesor')
  })

  it('C4: sin roles → tipo_usuario o /dashboard', async () => {
    renderPath({ tipo_usuario: 'decano' })
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard-decano')
  })

  it('C4b: tipo desconocido → /dashboard', async () => {
    renderPath({ tipo_usuario: 'desconocido' })
    // Coincidencia exacta: `toHaveTextContent('/dashboard')` también aceptaría
    // '/dashboard-admin' y daría verde con un resultado incorrecto.
    expect(await screen.findByTestId('path')).toHaveTextContent(/^\/dashboard$/)
  })

  it('C5: estudiante + allowedRoles admin → /forbidden', async () => {
    const estudiante = {
      id: 'u1',
      email: 'est@test.com',
      nombre: 'Estu',
      apellido: 'Diante',
      tipo_usuario: 'estudiante',
      roles: ['estudiante'],
    }
    ;(globalThis as { __rq19User?: unknown }).__rq19User = estudiante
    localStorage.setItem('token', 'jwt')
    localStorage.setItem('user', JSON.stringify(estudiante))

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard-admin']}>
          <Routes>
            <Route
              path="/dashboard-admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Panel admin</div>
                </ProtectedRoute>
              }
            />
            <Route path="/forbidden" element={<div>Acceso no permitido</div>} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })
})

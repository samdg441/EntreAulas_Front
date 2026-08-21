import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../context/AuthContext'

vi.mock('../../api/auth', () => ({
  authApi: {
    getCurrentUser: () => null,
    isAuthenticated: () => false,
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

function PathProbe({ user }: { user: Record<string, unknown> }) {
  const { getDashboardPathForUser } = useAuth()
  return <span data-testid="dashboard-path">{getDashboardPathForUser(user as never)}</span>
}

function renderPath(user: Record<string, unknown>) {
  return render(
    <AuthProvider>
      <PathProbe user={user} />
    </AuthProvider>
  )
}

describe('RQ2 unitarias — Redirigir al dashboard según el rol (frontend)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Camino 1 (1-2-3-9-10): back ya envió user.dashboard', async () => {
    renderPath({ dashboard: '/dashboard-admin' })
    expect(await screen.findByTestId('dashboard-path')).toHaveTextContent('/dashboard-admin')
  })

  it('Camino 2 (1-2-4-5-6-7-9-10): sin dashboard; hay roles; usa prioridad', async () => {
    renderPath({ roles: ['estudiante', 'coordinador'] })
    expect(await screen.findByTestId('dashboard-path')).toHaveTextContent('/dashboard-coordinador')
  })

  it('Camino 3 (1-2-4-5-6-8-9-10): roles sin match útil → tipo_usuario o /dashboard', async () => {
    renderPath({ roles: ['otro'], tipo_usuario: 'profesor' })
    expect(await screen.findByTestId('dashboard-path')).toHaveTextContent('/dashboard-profesor')
  })

  it('Camino 4 (1-2-4-8-9-10): sin roles[] → path por tipo_usuario o /dashboard', async () => {
    renderPath({ tipo_usuario: 'decano' })
    expect(await screen.findByTestId('dashboard-path')).toHaveTextContent('/dashboard-decano')

    renderPath({ tipo_usuario: 'desconocido' })
    expect((await screen.findAllByTestId('dashboard-path')).at(-1)).toHaveTextContent('/dashboard')
  })
})

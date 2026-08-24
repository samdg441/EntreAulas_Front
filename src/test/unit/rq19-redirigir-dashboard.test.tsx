import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import { vi } from 'vitest'

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
  return <span data-testid="path">{getDashboardPathForUser(user as never)}</span>
}

function renderPath(user: Record<string, unknown>) {
  return render(
    <AuthProvider>
      <PathProbe user={user} />
    </AuthProvider>
  )
}

/** RQ2 Front — solo getDashboardPathForUser (C1–C4) */
describe('RQ2 unit — Redirigir dashboard (frontend)', () => {
  beforeEach(() => localStorage.clear())

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
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard')
  })
})

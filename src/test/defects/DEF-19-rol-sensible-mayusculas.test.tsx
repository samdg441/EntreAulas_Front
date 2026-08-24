/**
 * DEF-19 — El cálculo de dashboard en el front distingue mayúsculas (RQ19)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * Espejo de DEF-05 del backend. `getDashboardPathForUser` recorre
 * `rolePriority` con `roles.includes(role)` exacto, mientras que el
 * fallback de `tipo_usuario` sí hace `.toLowerCase()`. Un rol `Admin`
 * no coincide y el usuario cae en `/dashboard`.
 */
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

describe('DEF-19 — El rol Admin debe abrir el dashboard de administrador', () => {
  beforeEach(() => localStorage.clear())

  it("roles: ['Admin'] → /dashboard-admin", async () => {
    render(
      <AuthProvider>
        <PathProbe user={{ roles: ['Admin'] }} />
      </AuthProvider>
    )
    expect(await screen.findByTestId('path')).toHaveTextContent('/dashboard-admin')
  })
})

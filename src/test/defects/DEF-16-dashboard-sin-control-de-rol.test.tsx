/**
 * DEF-16 — Un estudiante autenticado abre dashboards que no le corresponden (RQ19)
 *
 * Severidad: Alta | Estado: ABIERTO
 *
 * `ProtectedRoute` sí sabe bloquear por rol (`allowedRoles`), y /dashboard-admin
 * lo usa. Los demás paneles no: `/dashboard-coordinador`, `/dashboard-profesor`,
 * `/dashboard-estudiante` y `/dashboard-decano` solo preguntan si hay sesión.
 *
 * Con la sesión ya hidratada (el caso normal después de login), un estudiante
 * que navega a `/dashboard-coordinador` ve el panel del coordinador.
 *
 * App.tsx:125-148.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../routes/ProtectedRoute'

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const estudiante = {
  id: 'u1',
  email: 'est@test.com',
  nombre: 'Estu',
  apellido: 'Diante',
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
  dashboard: '/dashboard-estudiante',
}

vi.mock('../../api/auth', () => ({
  authApi: {
    getCurrentUser: () => estudiante,
    isAuthenticated: () => true,
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}))

/** Copia del guard de App.tsx:137-141: solo mira si hay usuario, no el rol. */
function CoordinatorGuardAsInApp() {
  const { user } = useAuth()
  return user ? <div>Panel coordinador</div> : <Navigate to="/login" replace />
}

function ProfesorGuardAsInApp() {
  const { user } = useAuth()
  return user ? <div>Panel profesor</div> : <Navigate to="/login" replace />
}

/** Monta el router cuando la sesión ya está hidratada (después del login). */
function HydratedRouter({
  entry,
  children,
}: {
  entry: string
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  if (loading || !user) return <div>hidratando</div>
  return (
    <MemoryRouter initialEntries={[entry]}>
      {children}
    </MemoryRouter>
  )
}

describe('DEF-16 — Un estudiante no debe ver paneles de otro rol', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'jwt')
    localStorage.setItem('user', JSON.stringify(estudiante))
  })

  it('control: ProtectedRoute con allowedRoles sí bloquea /dashboard-admin', async () => {
    render(
      <AuthProvider>
        <HydratedRouter entry="/dashboard-admin">
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
        </HydratedRouter>
      </AuthProvider>
    )

    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })

  it('un estudiante no debe ver el panel del coordinador', async () => {
    render(
      <AuthProvider>
        <HydratedRouter entry="/dashboard-coordinador">
          <Routes>
            <Route path="/dashboard-coordinador" element={<CoordinatorGuardAsInApp />} />
            <Route path="/forbidden" element={<div>Acceso no permitido</div>} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </HydratedRouter>
      </AuthProvider>
    )

    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument()
    expect(screen.queryByText('Panel coordinador')).not.toBeInTheDocument()
  })

  it('un estudiante no debe ver el panel del profesor', async () => {
    render(
      <AuthProvider>
        <HydratedRouter entry="/dashboard-profesor">
          <Routes>
            <Route path="/dashboard-profesor" element={<ProfesorGuardAsInApp />} />
            <Route path="/forbidden" element={<div>Acceso no permitido</div>} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </HydratedRouter>
      </AuthProvider>
    )

    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument()
    expect(screen.queryByText('Panel profesor')).not.toBeInTheDocument()
  })
})

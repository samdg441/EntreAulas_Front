import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../routes/ProtectedRoute'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import type { UserSummary } from '../../api/users'

const useAuth = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}))

vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const list = vi.fn()
const create = vi.fn()
const update = vi.fn()
const deactivate = vi.fn()

vi.mock('../../api/users', async () => {
  const actual = await vi.importActual<typeof import('../../api/users')>('../../api/users')
  return {
    ...actual,
    usersApi: {
      list: (...args: unknown[]) => list(...args),
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
      deactivate: (...args: unknown[]) => deactivate(...args),
      stats: vi.fn(),
      academicStructure: vi.fn(),
      gruposByCareer: vi.fn(),
    },
  }
})

const listed: UserSummary[] = [
  {
    id: 'u-est',
    email: 'ana@test.com',
    nombre: 'Ana',
    apellido: 'Perez',
    tipo_usuario: 'estudiante',
    activo: true,
  },
]

const adminAuth = {
  user: {
    id: 'admin-1',
    nombre: 'Ada',
    apellido: 'Admin',
    email: 'ada@test.com',
    tipo_usuario: 'admin',
  },
  loading: false,
  hasRole: (role: string) => role === 'admin',
}

function renderPage() {
  useAuth.mockReturnValue(adminAuth)
  return render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>
  )
}

async function tablaLista() {
  expect(await screen.findByText('ana@test.com')).toBeInTheDocument()
}

/**
 * RQ10 Frontend — Gestionar usuarios (grafo Front)
 * C1 1-2-3-4-5-18 → login/forbidden
 * C2 1-2-3-4-6-7-8-9-18 → error alta
 * C3 1-2-3-4-6-7-8-10-18 → alta OK
 * C4 1-2-3-4-6-11-12-13-14-18 → error edición
 * C5 1-2-3-4-6-11-12-13-15-18 → edición OK
 * C6 1-2-3-4-6-11-16-14-18 → error desactivar
 * C7 1-2-3-4-6-11-16-17-18 → desactivar OK
 */
describe('RQ10 unitarias — Gestionar usuarios (frontend)', () => {
  beforeEach(() => {
    list.mockReset()
    create.mockReset()
    update.mockReset()
    deactivate.mockReset()
    useAuth.mockReset()
    localStorage.clear()
    list.mockResolvedValue({ users: listed })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('caminos que fallan', () => {
    it('Camino 1 (1-2-3-4-5-18): sin sesión o sin rol admin → login/forbidden', async () => {
      useAuth.mockReturnValue({ user: null, loading: false, hasRole: () => false })

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route path="/login" element={<div>Pantalla login</div>} />
            <Route path="/forbidden" element={<div>Acceso no permitido</div>} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Panel usuarios</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText('Pantalla login')).toBeInTheDocument()
      expect(screen.queryByText('Panel usuarios')).not.toBeInTheDocument()

      useAuth.mockReturnValue({
        user: { id: 'p1', tipo_usuario: 'profesor' },
        loading: false,
        hasRole: () => false,
      })
      localStorage.setItem('token', 'jwt')
      localStorage.setItem('user', JSON.stringify({ id: 'p1' }))

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route path="/login" element={<div>Pantalla login</div>} />
            <Route path="/forbidden" element={<div>Acceso no permitido</div>} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Panel usuarios</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument()
    })

    it('Camino 2 (1-2-3-4-6-7-8-9-18): POST create-user falla → error en el modal', async () => {
      create.mockRejectedValue({
        response: { status: 400, data: { error: 'El email ya está registrado' } },
      })
      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
      expect(await screen.findByRole('heading', { name: 'Agregar usuario' })).toBeInTheDocument()

      await user.type(screen.getByLabelText('Nombre'), 'Luis')
      await user.type(screen.getByLabelText('Apellido'), 'Gomez')
      await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'password123')
      await user.click(screen.getByRole('button', { name: /^crear$/i }))

      expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Agregar usuario' })).toBeInTheDocument()
      expect(create).toHaveBeenCalled()
    })

    it('Camino 4 (1-2-3-4-6-11-12-13-14-18): PUT falla → error y el modal no cierra', async () => {
      update.mockRejectedValue({
        response: { status: 400, data: { error: 'El email ya está registrado' } },
      })
      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /editar/i }))
      expect(await screen.findByRole('heading', { name: 'Actualizar usuario' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^actualizar$/i }))

      expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Actualizar usuario' })).toBeInTheDocument()
    })

    it('Camino 6 (1-2-3-4-6-11-16-14-18): DELETE falla → error en la página', async () => {
      deactivate.mockRejectedValue({
        response: { status: 400, data: { error: 'No puedes desactivar tu propia cuenta' } },
      })
      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
      expect(await screen.findByText('Desactivar usuario')).toBeInTheDocument()
      const confirms = screen.getAllByRole('button', { name: /^desactivar$/i })
      await user.click(confirms[confirms.length - 1])

      expect(await screen.findByText('No puedes desactivar tu propia cuenta')).toBeInTheDocument()
    })
  })

  describe('caminos que funcionan', () => {
    it('Camino 3 (1-2-3-4-6-7-8-10-18): POST 201 cierra modal y recarga listado', async () => {
      const creado: UserSummary = {
        id: 'u-new',
        email: 'nuevo@test.com',
        nombre: 'Luis',
        apellido: 'Gomez',
        tipo_usuario: 'estudiante',
        activo: true,
      }
      list
        .mockResolvedValueOnce({ users: listed })
        .mockResolvedValueOnce({ users: [...listed, creado] })
      create.mockResolvedValue({ user: creado })

      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /agregar usuario/i }))
      await user.type(screen.getByLabelText('Nombre'), 'Luis')
      await user.type(screen.getByLabelText('Apellido'), 'Gomez')
      await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'password123')
      await user.click(screen.getByRole('button', { name: /^crear$/i }))

      expect(await screen.findByText('nuevo@test.com')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Agregar usuario' })).not.toBeInTheDocument()
      })
    })

    it('Camino 5 (1-2-3-4-6-11-12-13-15-18): PUT 200 cierra modal y actualiza la fila', async () => {
      list
        .mockResolvedValueOnce({ users: listed })
        .mockResolvedValueOnce({
          users: [{ ...listed[0], nombre: 'Ana Maria' }],
        })
      update.mockResolvedValue({ user: { ...listed[0], nombre: 'Ana Maria' } })

      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /editar/i }))
      const nombre = screen.getByLabelText('Nombre')
      await user.clear(nombre)
      await user.type(nombre, 'Ana Maria')
      await user.click(screen.getByRole('button', { name: /^actualizar$/i }))

      expect(await screen.findByText('Ana Maria Perez')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Actualizar usuario' })).not.toBeInTheDocument()
      })
    })

    it('Camino 7 (1-2-3-4-6-11-16-17-18): DELETE 200 marca inactivo y quita Desactivar', async () => {
      list
        .mockResolvedValueOnce({ users: listed })
        .mockResolvedValueOnce({ users: [{ ...listed[0], activo: false }] })
      deactivate.mockResolvedValue({ user: { ...listed[0], activo: false } })

      renderPage()
      await tablaLista()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
      expect(await screen.findByText('Desactivar usuario')).toBeInTheDocument()
      const confirms = screen.getAllByRole('button', { name: /^desactivar$/i })
      await user.click(confirms[confirms.length - 1])

      expect(await screen.findByText('Inactivo')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /^desactivar$/i })).not.toBeInTheDocument()
      })
    })
  })
})

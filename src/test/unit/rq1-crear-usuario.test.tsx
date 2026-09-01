import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../api/client', () => {
  const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { apiClient, default: apiClient }
})

import { apiClient } from '../../api/client'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'

const api = apiClient as unknown as Record<'get' | 'post' | 'put' | 'delete', ReturnType<typeof vi.fn>>

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

async function abrirModalYRellenar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /agregar usuario/i }))
  const form = (await screen.findByRole('button', { name: 'Crear' })).closest('form') as HTMLFormElement
  const w = within(form)
  await user.type(w.getByLabelText('Nombre'), 'Ana')
  await user.type(w.getByLabelText('Apellido'), 'Pérez')
  await user.type(w.getByLabelText('Email'), 'ana@uni.edu')
  await user.type(w.getByLabelText('Contraseña'), 'Password123!')
  return { form, w }
}

beforeEach(() => {
  api.get.mockReset()
  api.post.mockReset()
  api.get.mockResolvedValue({ data: { users: [] } }) // loadUsers en el montaje
})

describe('RQ1 — Crear usuario como administrador', () => {
  it('C1: camino ideal → POST /api/auth/create-user con el payload y cierre del modal', async () => {
    const user = userEvent.setup()
    renderPage()
    const { w } = await abrirModalYRellenar(user)

    api.post.mockResolvedValue({ data: { id: '1' } })
    await user.click(w.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/api/auth/create-user', {
        email: 'ana@uni.edu',
        password: 'Password123!',
        nombre: 'Ana',
        apellido: 'Pérez',
        tipo_usuario: 'estudiante',
      }),
    )
    // se recarga el listado y se cierra el modal
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Crear' })).not.toBeInTheDocument())
  })

  it('C2: la API responde error → se muestra el mensaje del backend y el modal permanece abierto', async () => {
    const user = userEvent.setup()
    renderPage()
    const { w } = await abrirModalYRellenar(user)

    api.post.mockRejectedValue({ response: { data: { error: 'El correo ya está registrado' } } })
    await user.click(w.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
  })

  it('C3: error sin cuerpo → mensaje por defecto "Error al crear usuario"', async () => {
    const user = userEvent.setup()
    renderPage()
    const { w } = await abrirModalYRellenar(user)

    api.post.mockRejectedValue({})
    await user.click(w.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Error al crear usuario')).toBeInTheDocument()
  })

  it('C4: tipo de usuario elegido en el select viaja en el payload', async () => {
    const user = userEvent.setup()
    renderPage()
    const { form, w } = await abrirModalYRellenar(user)
    await user.selectOptions(within(form).getByRole('combobox'), 'admin')

    api.post.mockResolvedValue({ data: { id: '2' } })
    await user.click(w.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/api/auth/create-user',
        expect.objectContaining({ tipo_usuario: 'admin' }),
      ),
    )
  })
})

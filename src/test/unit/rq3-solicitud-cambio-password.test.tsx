/**
 * RQ3 — Solicitud de cambio de contraseña (paso "request" de <ForgotPassword/>).
 * Ejercita: handleRequestReset + validateForm(rama request) + validateEmail.
 * Único límite mockeado: apiClient (capa axios).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../api/client', () => {
  const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { apiClient, default: apiClient }
})

import { apiClient } from '../../api/client'
import ForgotPassword from '../../features/auth/ForgotPassword'

const api = apiClient as unknown as Record<'get' | 'post', ReturnType<typeof vi.fn>>

function renderForgot() {
  return renderWithRouter(<ForgotPassword />, {
    route: '/forgot-password',
    path: '/forgot-password',
    extraRoutes: [{ path: '/login', element: <div>Login</div> }],
  })
}

const enviarBtn = () => screen.getByRole('button', { name: /enviar enlace de recuperación/i })

beforeEach(() => {
  api.post.mockReset()
  api.get.mockReset()
})

describe('RQ3 — Solicitud de cambio de contraseña', () => {
  it('C1: correo vacío → "requerido" y NO se llama a la API', async () => {
    renderForgot()
    // submit directo al form: probamos la guarda de validateForm, no la validación nativa del navegador
    fireEvent.submit(enviarBtn().closest('form') as HTMLFormElement)
    expect(await screen.findByText(/el correo electrónico es requerido/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C2: correo con formato inválido → mensaje de formato y NO se llama a la API', async () => {
    const user = userEvent.setup()
    renderForgot()
    // "a@b" pasa la validación nativa de type=email pero falla el regex del componente
    await user.type(screen.getByLabelText(/correo institucional/i), 'a@b')
    await user.click(enviarBtn())
    expect(await screen.findByText(/ingresa un correo electrónico válido/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('C3: camino ideal → POST /api/auth/forgot-password y pantalla de confirmación', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: {} })
    renderForgot()
    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.click(enviarBtn())

    expect(
      await screen.findByText(/se ha enviado un enlace de recuperación a tu correo/i),
    ).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'ana@uni.edu' })
  })

  it('C4: error del servidor → banner rojo con el mensaje de la API y se mantiene el formulario', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({ response: { data: { error: 'Servicio no disponible' }, status: 500 } })
    renderForgot()
    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@uni.edu')
    await user.click(enviarBtn())

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    expect(enviarBtn()).toBeInTheDocument()
  })
})

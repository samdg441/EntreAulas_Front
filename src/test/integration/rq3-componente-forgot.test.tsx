import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import ForgotPassword from '../../features/auth/ForgotPassword'
import { requestPasswordReset } from '../../api/passwordReset'

vi.mock('../../api/passwordReset', () => ({ requestPasswordReset: vi.fn() }))

const MENSAJE = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
const montar = () => renderConSesion(<ForgotPassword />, { route: '/forgot-password' })
const correo = () => screen.getByLabelText(/correo institucional/i) as HTMLInputElement
const boton = () => screen.getByRole('button', { name: /enviar enlace de recuperación|enviando/i })

describe('RQ3 / RQ3.1 — Componente ForgotPassword', () => {
  beforeEach(() => {
    vi.mocked(requestPasswordReset).mockReset()
  })

  it('RQ3·C-P1 (estado inicial): formulario vacío, botón habilitado y sin mensajes', () => {
    montar()

    expect(correo()).toHaveValue('')
    expect(boton()).toBeEnabled()
    expect(screen.queryByText(MENSAJE)).not.toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it('RQ3·C-P2 (cargando): el botón se deshabilita con "Enviando…" y una segunda orden no duplica la petición', async () => {
    vi.mocked(requestPasswordReset).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    montar()

    await user.type(correo(), 'ana@soyudemedellin.edu.co')
    await user.click(boton())
    await user.click(boton())
    await user.type(correo(), '{Enter}')

    await waitFor(() => expect(boton()).toBeDisabled())
    expect(boton()).toHaveTextContent(/enviando/i)
    expect(requestPasswordReset).toHaveBeenCalledTimes(1)
  })

  it('RQ3·C-P3 (éxito): llama con el correo escrito y muestra la confirmación genérica del servidor', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ success: true, message: MENSAJE })
    const user = userEvent.setup()
    montar()

    await user.type(correo(), 'ana@soyudemedellin.edu.co')
    await user.click(boton())

    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument()
    expect(screen.getByText(MENSAJE)).toBeInTheDocument()
    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'ana@soyudemedellin.edu.co' })
    expect(screen.queryByLabelText(/correo institucional/i)).not.toBeInTheDocument()
  })

  it('RQ3·C-N1 (error del servidor): muestra el mensaje, mantiene el formulario y rehabilita el botón', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ success: false, message: 'Error interno del servidor' })
    const user = userEvent.setup()
    montar()

    await user.type(correo(), 'ana@soyudemedellin.edu.co')
    await user.click(boton())

    expect(await screen.findByText('Error interno del servidor')).toBeInTheDocument()
    expect(correo()).toHaveValue('ana@soyudemedellin.edu.co')
    await waitFor(() => expect(boton()).toBeEnabled())
    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument()
  })

  it('RQ3·C-N2 (excepción inesperada): muestra un mensaje de respaldo y no se queda cargando', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    montar()

    await user.type(correo(), 'ana@soyudemedellin.edu.co')
    await user.click(boton())

    expect(await screen.findByText('Error al enviar la solicitud')).toBeInTheDocument()
    await waitFor(() => expect(boton()).toBeEnabled())
  })

  it('RQ3·C-N3 (validación propia): un correo que el navegador acepta pero la regla rechaza → mensaje y ninguna petición', async () => {
    const user = userEvent.setup()
    montar()

    await user.type(correo(), 'usuario@sindominio')
    await user.click(boton())

    expect(await screen.findByText('Por favor, ingresa un correo electrónico válido')).toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it.each([
    ['vacío', ''],
    ['sin dominio', 'ana@'],
    ['sin arroba', 'ana.soyudemedellin.edu.co'],
  ])('RQ3·C-N4 (validación nativa) correo %s → el navegador bloquea el envío y no hay petición', async (_caso, texto) => {
    const user = userEvent.setup()
    montar()

    if (texto) await user.type(correo(), texto)
    await user.click(boton())

    expect(correo().checkValidity()).toBe(false)
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it('RQ3·C-P4 (navegación): "volver" desde el formulario regresa al login', async () => {
    montar()

    const volver = screen.queryByRole('button', { name: /volver|iniciar sesión|regresar/i })

    expect(volver).toBeInTheDocument()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import ResetPassword from '../../features/auth/ResetPassword'
import { resetPassword, validateResetToken } from '../../api/passwordReset'

vi.mock('../../api/passwordReset', () => ({ resetPassword: vi.fn(), validateResetToken: vi.fn() }))

const CLAVE = 'Nueva-Clave2026!'
const ENLACE = '?token=tok-123&email=ana%40soyudemedellin.edu.co'
const montar = (query = ENLACE) => renderConSesion(<ResetPassword />, { route: `/reset-password${query}` })
const nueva = () => screen.findByLabelText(/^nueva contraseña$/i) as Promise<HTMLInputElement>
const confirmar = () => screen.getByLabelText(/^confirmar nueva contraseña$/i) as HTMLInputElement
const enviar = () => screen.getByRole('button', { name: /actualizar contraseña|actualizando/i })
async function llenar(user: ReturnType<typeof userEvent.setup>, clave = CLAVE, confirmacion = clave) {
  await user.type(await nueva(), clave)
  await user.type(confirmar(), confirmacion)
}

describe('RQ3 / RQ5 — Componente ResetPassword', () => {
  beforeEach(() => {
    vi.mocked(validateResetToken).mockReset()
    vi.mocked(resetPassword).mockReset()
    vi.mocked(validateResetToken).mockResolvedValue({ success: true, message: 'Token válido' })
  })

  it('RQ5·C-P1 (validando): mientras el servidor revisa el token se ve "Validando…" y todavía no hay formulario', async () => {
    vi.mocked(validateResetToken).mockReturnValue(new Promise(() => {}))
    montar()

    expect(await screen.findByText(/validando el enlace/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^nueva contraseña$/i)).not.toBeInTheDocument()
  })

  it('RQ5·C-P2 (token válido): aparece el formulario con el correo bloqueado y el botón habilitado', async () => {
    montar()

    expect(await nueva()).toBeInTheDocument()
    expect(screen.getByLabelText(/correo institucional/i)).toBeDisabled()
    expect(screen.getByLabelText(/correo institucional/i)).toHaveValue('ana@soyudemedellin.edu.co')
    expect(enviar()).toBeEnabled()
    expect(validateResetToken).toHaveBeenCalledWith('tok-123', 'ana@soyudemedellin.edu.co')
  })

  it.each([
    ['sin parámetros', ''],
    ['sin correo', '?token=tok-123'],
    ['sin token', '?email=ana%40soyudemedellin.edu.co'],
  ])('RQ5·C-N1 (enlace incompleto: %s): "enlace inválido", sin formulario y sin consultar al servidor', async (_caso, query) => {
    montar(query)

    expect(await screen.findByText(/inválido o está incompleto/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^nueva contraseña$/i)).not.toBeInTheDocument()
    expect(validateResetToken).not.toHaveBeenCalled()
  })

  it('RQ5·C-N2 (token rechazado): muestra el motivo y ofrece solicitar otro enlace', async () => {
    vi.mocked(validateResetToken).mockResolvedValue({ success: false, message: 'El token ha expirado. Solicita uno nuevo.' })
    montar()

    expect(await screen.findByText('El token ha expirado. Solicita uno nuevo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solicitar un nuevo enlace/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^nueva contraseña$/i)).not.toBeInTheDocument()
  })

  it('RQ5·C-P3 (cargando): al enviar, el botón se deshabilita con "Actualizando…" y no se duplica la petición', async () => {
    vi.mocked(resetPassword).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    montar()
    await llenar(user)

    await user.click(enviar())
    await user.click(enviar())

    await waitFor(() => expect(enviar()).toBeDisabled())
    expect(enviar()).toHaveTextContent(/actualizando/i)
    expect(resetPassword).toHaveBeenCalledTimes(1)
  })

  it('RQ5·C-P4 (éxito): envía token, correo y contraseña, y muestra "Contraseña actualizada" con acceso al login', async () => {
    vi.mocked(resetPassword).mockResolvedValue({ success: true, message: 'Contraseña actualizada exitosamente' })
    const user = userEvent.setup()
    montar()
    await llenar(user)

    await user.click(enviar())

    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument()
    expect(screen.getByText('Contraseña actualizada exitosamente')).toBeInTheDocument()
    expect(resetPassword).toHaveBeenCalledWith({ token: 'tok-123', email: 'ana@soyudemedellin.edu.co', newPassword: CLAVE, confirmPassword: CLAVE })
    expect(screen.getByRole('button', { name: /ir al inicio de sesión/i })).toBeInTheDocument()
  })

  it('RQ5·C-N3 (rechazo del servidor): muestra el motivo, conserva el formulario y rehabilita el botón', async () => {
    vi.mocked(resetPassword).mockResolvedValue({ success: false, message: 'Token inválido o ya utilizado' })
    const user = userEvent.setup()
    montar()
    await llenar(user)

    await user.click(enviar())

    expect(await screen.findByText('Token inválido o ya utilizado')).toBeInTheDocument()
    await waitFor(() => expect(enviar()).toBeEnabled())
    expect(screen.queryByText('Contraseña actualizada')).not.toBeInTheDocument()
  })

  it('RQ5·C-N4 (excepción inesperada): mensaje de respaldo y no queda cargando', async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    montar()
    await llenar(user)

    await user.click(enviar())

    expect(await screen.findByText('Error al actualizar la contraseña')).toBeInTheDocument()
    await waitFor(() => expect(enviar()).toBeEnabled())
  })

  it.each([
    ['menos de 8 caracteres', 'Ab1!', 'La contraseña debe tener al menos 8 caracteres'],
    ['sin mayúscula', 'passw0rd!', 'La contraseña debe contener al menos una letra mayúscula'],
    ['sin minúscula', 'PASSW0RD!', 'La contraseña debe contener al menos una letra minúscula'],
    ['sin número', 'Password!', 'La contraseña debe contener al menos un número'],
    ['sin carácter especial', 'Passw0rd1', 'La contraseña debe contener al menos un carácter especial'],
  ])('RQ5·C-N5 (política) contraseña %s → "%s" y ninguna petición', async (_caso, clave, mensaje) => {
    const user = userEvent.setup()
    montar()
    await llenar(user, clave)

    await user.click(enviar())

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('RQ5·C-N6 (confirmación distinta): "Las contraseñas no coinciden" y ninguna petición', async () => {
    const user = userEvent.setup()
    montar()
    await llenar(user, CLAVE, 'Otra-Clave2026!')

    await user.click(enviar())

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('RQ5·C-N7 (campos vacíos): el navegador bloquea el envío (required) y no se llama al servidor', async () => {
    const user = userEvent.setup()
    montar()
    const campo = await nueva()

    await user.click(enviar())

    expect(campo.checkValidity()).toBe(false)
    expect(confirmar().checkValidity()).toBe(false)
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('RQ5·C-P5 (corrección): al volver a escribir se limpia el error del campo', async () => {
    const user = userEvent.setup()
    montar()
    await llenar(user, 'Ab1!')
    await user.click(enviar())
    await screen.findByText('La contraseña debe tener al menos 8 caracteres')

    await user.type(await nueva(), 'x')

    expect(screen.queryByText('La contraseña debe tener al menos 8 caracteres')).not.toBeInTheDocument()
  })
})

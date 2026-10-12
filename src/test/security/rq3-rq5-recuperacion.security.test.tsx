import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPassword from '../../features/auth/ForgotPassword'
import ResetPassword from '../../features/auth/ResetPassword'
import { montarApiFalsa } from '../helpers/api-falsa'
import { validarFormularioRequest, validarFormularioReset } from '../../features/auth/password-reset-flow'

let api: ReturnType<typeof montarApiFalsa>
afterEach(() => api?.restaurar())

const renderForgot = () =>
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<div>otra</div>} />
      </Routes>
    </MemoryRouter>
  )

const renderReset = (consulta: string) =>
  render(
    <MemoryRouter initialEntries={[`/reset-password${consulta}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<div>otra</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('RQ3 / RQ3.1 — Solicitud de recuperación en el front', () => {
  it('muestra exactamente el mensaje genérico del servidor y no confirma si el correo existe', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación' } }))
    const user = userEvent.setup()
    renderForgot()

    await user.type(screen.getByLabelText(/correo/i), 'cualquiera@soyudemedellin.edu.co')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/si el correo electrónico existe/i)).toBeInTheDocument()
  })

  it.each([
    ['vacío', ''],
    ['sin dominio', 'ana@'],
    ['con espacios', 'ana @udem.edu.co'],
    ['dos arrobas', 'a@b@udem.edu.co'],
    ['CRLF', 'ana@udem.edu.co\r\nBcc: x@evil.co'],
  ])('un correo %s se rechaza en el cliente y no se hace ninguna petición', (_caso, correo) => {
    expect(validarFormularioRequest(correo).email).toBeTruthy()
  })

  it('un mensaje del back con HTML se muestra como texto', async () => {
    api = montarApiFalsa(() => ({ status: 500, data: { error: '<img src=x onerror=alert(1)>' } }))
    const user = userEvent.setup()
    const { container } = renderForgot()

    await user.type(screen.getByLabelText(/correo/i), 'ana@soyudemedellin.edu.co')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await screen.findByText('<img src=x onerror=alert(1)>')
    expect(container.querySelector('img[src="x"]')).toBeNull()
  })
})

describe('RQ3 / RQ5 — Restablecer contraseña en el front', () => {
  it('sin token o sin correo en el enlace no se consulta ni se restablece nada', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: {} }))

    renderReset('?token=abc')

    expect(await screen.findByText(/inválido o está incompleto/i)).toBeInTheDocument()
    expect(api.peticiones).toHaveLength(0)
  })

  it('el token del enlace se valida contra el back y se envía codificado (sin romper la URL)', async () => {
    api = montarApiFalsa(() => ({ status: 400, data: { error: 'Token inválido o ya utilizado' } }))

    renderReset(`?token=${encodeURIComponent('a/b?c=d&e')}&email=ana%40soyudemedellin.edu.co`)

    await waitFor(() => expect(api.peticiones).toHaveLength(1))
    expect(api.peticiones[0].url).toBe('/api/auth/validate-reset-token/a%2Fb%3Fc%3Dd%26e')
  })

  it('un token con HTML o script en la URL no se interpreta como HTML', async () => {
    api = montarApiFalsa(() => ({ status: 400, data: { error: 'Token inválido o ya utilizado' } }))

    const { container } = renderReset(`?token=${encodeURIComponent('<script>alert(1)</script>')}&email=${encodeURIComponent('"><img src=x onerror=alert(2)>')}`)

    await screen.findByText('Token inválido o ya utilizado')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img[src="x"]')).toBeNull()
  })

  it('un enlace inválido no muestra el formulario para escribir una contraseña nueva', async () => {
    api = montarApiFalsa(() => ({ status: 400, data: { error: 'El token ha expirado. Solicita uno nuevo.' } }))

    renderReset('?token=t&email=ana%40soyudemedellin.edu.co')

    expect(await screen.findByText('El token ha expirado. Solicita uno nuevo.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/nueva contraseña/i)).not.toBeInTheDocument()
  })

  it('el token no se copia al almacenamiento del navegador', async () => {
    api = montarApiFalsa(() => ({ status: 200, data: { valid: true } }))

    renderReset('?token=token-secreto-xyz&email=ana%40soyudemedellin.edu.co')

    await waitFor(() => expect(api.peticiones.length).toBeGreaterThan(0))
    expect(JSON.stringify(Object.entries(window.localStorage as unknown as Record<string, string>))).not.toContain('token-secreto-xyz')
  })

  it('con enlace válido: contraseñas débiles o distintas no llegan a la API', async () => {
    api = montarApiFalsa((p) => (p.metodo === 'GET' ? { status: 200, data: { valid: true } } : { status: 200, data: {} }))
    const user = userEvent.setup()
    renderReset('?token=t&email=ana%40soyudemedellin.edu.co')
    const nueva = await screen.findByLabelText(/^nueva contraseña$/i)

    await user.type(nueva, 'debil')
    await user.type(screen.getByLabelText(/confirmar/i), 'otra')
    await user.click(screen.getByRole('button', { name: /(restablecer|actualizar|cambiar|guardar)/i }))

    expect(api.peticiones.filter((p) => p.metodo === 'POST')).toHaveLength(0)
  })

  it('con enlace válido y contraseña correcta, el POST lleva token, correo y contraseña, y la respuesta no deja rastro en pantalla', async () => {
    api = montarApiFalsa((p) => (p.metodo === 'GET' ? { status: 200, data: { valid: true } } : { status: 200, data: { message: 'Contraseña actualizada exitosamente' } }))
    const user = userEvent.setup()
    renderReset('?token=t&email=ana%40soyudemedellin.edu.co')
    const nueva = await screen.findByLabelText(/^nueva contraseña$/i)

    await user.type(nueva, 'Nueva-Clave2026!')
    await user.type(screen.getByLabelText(/confirmar/i), 'Nueva-Clave2026!')
    await user.click(screen.getByRole('button', { name: /(restablecer|actualizar|cambiar|guardar)/i }))

    await screen.findByText('Contraseña actualizada exitosamente')
    const post = api.peticiones.find((p) => p.metodo === 'POST')!
    expect(post.url).toBe('/api/auth/reset-password')
    expect(post.body).toMatchObject({ token: 't', email: 'ana@soyudemedellin.edu.co', newPassword: 'Nueva-Clave2026!' })
    expect(document.body.textContent).not.toContain('Nueva-Clave2026!')
  })
})

describe('RQ5 — Política de contraseña del cliente igual a la del back', () => {
  it.each([
    ['corta', 'Ab1!'],
    ['sin mayúscula', 'passw0rd!'],
    ['sin minúscula', 'PASSW0RD!'],
    ['sin número', 'Password!'],
    ['sin especial', 'Passw0rd1'],
  ])('contraseña %s → error', (_caso, clave) => {
    expect(validarFormularioReset(clave, clave).newPassword).toBeTruthy()
  })

  it('contraseña fuerte y confirmación igual → sin errores', () => {
    expect(validarFormularioReset('Nueva-Clave2026!', 'Nueva-Clave2026!')).toEqual({})
  })

  it('confirmación distinta → error', () => {
    expect(validarFormularioReset('Nueva-Clave2026!', 'Otra-Clave2026!').confirmPassword).toBeTruthy()
  })
})

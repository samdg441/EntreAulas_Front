import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import { authApi } from '../../api/auth'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    loginWithRole: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: () => {
      const raw = window.localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    },
    getToken: () => window.localStorage.getItem('token'),
    isAuthenticated: () => Boolean(window.localStorage.getItem('token')),
    getProfile: vi.fn(),
  },
}))

const estudiante = { id: '1', email: 'estudiante@uni.edu', nombre: 'Est', apellido: 'Iante', tipo_usuario: 'estudiante' }

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-estudiante" element={<div>Panel del estudiante</div>} />
          <Route path="/forgot-password" element={<div>Recuperar contraseña</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}
const campos = () => ({
  correo: screen.getByLabelText(/correo institucional/i) as HTMLInputElement,
  clave: screen.getByLabelText(/^contraseña$/i) as HTMLInputElement,
  boton: () => screen.getByRole('button', { name: /iniciar sesión|iniciando sesión/i }),
})
/** Promesa que el test resuelve a mano para congelar la pantalla en el estado "cargando". */
function promesaPendiente<T>() {
  let resolver!: (v: T) => void
  let rechazar!: (e: unknown) => void
  const promesa = new Promise<T>((res, rej) => ((resolver = res), (rechazar = rej)))
  return { promesa, resolver, rechazar }
}

describe('RQ2 — Componente Login', () => {
  beforeAll(() => {
    // framer-motion dispara PointerEvent al perder el foco el botón; jsdom no lo implementa.
    if (!('PointerEvent' in window)) Object.defineProperty(window, 'PointerEvent', { value: class extends MouseEvent {}, configurable: true })
  })
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset()
  })

  it('RQ2·C-P1 (estado inicial): campos vacíos, botón habilitado, sin mensaje de error y sin llamadas', () => {
    renderLogin()
    const { correo, clave, boton } = campos()

    expect(correo).toHaveValue('')
    expect(clave).toHaveValue('')
    expect(clave).toHaveAttribute('type', 'password')
    expect(boton()).toBeEnabled()
    expect(screen.queryByText(/credenciales inválidas/i)).not.toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('RQ2·C-P2 (cargando): mientras espera, el botón queda deshabilitado con "Iniciando sesión…"', async () => {
    const { promesa } = promesaPendiente<never>()
    vi.mocked(authApi.login).mockReturnValue(promesa)
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())

    await waitFor(() => expect(boton()).toBeDisabled())
    expect(boton()).toHaveTextContent(/iniciando sesión/i)
  })

  it('RQ2·C-N1 (anti doble envío): varios clics y Enter durante la espera producen UNA sola petición', async () => {
    const { promesa } = promesaPendiente<never>()
    vi.mocked(authApi.login).mockReturnValue(promesa)
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())
    await user.click(boton())
    await user.click(boton())
    await user.type(clave, '{Enter}{Enter}')

    expect(authApi.login).toHaveBeenCalledTimes(1)
  })

  it('RQ2·C-P3 (éxito): guarda el token, entra al panel y deja de mostrar el formulario', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())

    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'estudiante@uni.edu', password: 'Abcdef1!' })
    expect(window.localStorage.getItem('token')).toBe('tok-123')
    expect(screen.queryByLabelText(/^contraseña$/i)).not.toBeInTheDocument()
  })

  it('RQ2·C-P4 (teclado): se puede enviar con Enter desde el campo de contraseña', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-123', user: estudiante })
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'Abcdef1!{Enter}')

    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument()
  })

  it('RQ2·C-N2 (error del servidor): muestra el mensaje, conserva el correo, rehabilita el botón y no guarda sesión', async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' } } })
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'mala')
    await user.click(boton())

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(correo).toHaveValue('estudiante@uni.edu')
    await waitFor(() => expect(boton()).toBeEnabled())
    expect(window.localStorage.getItem('token')).toBeNull()
    expect(screen.queryByText('Panel del estudiante')).not.toBeInTheDocument()
  })

  it.each([
    ['sin mensaje del servidor (red caída)', {}, 'Error en la autenticación'],
    ['con 500 y mensaje', { response: { data: { error: 'Error interno del servidor' } } }, 'Error interno del servidor'],
  ])('RQ2·C-N3 (error %s) muestra un mensaje comprensible y permite reintentar', async (_caso, falla, mensaje) => {
    vi.mocked(authApi.login).mockRejectedValue(falla)
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    await waitFor(() => expect(boton()).toBeEnabled())
  })

  it('RQ2·C-N4 (reintento): tras un error, un segundo intento correcto entra y borra el mensaje', async () => {
    vi.mocked(authApi.login)
      .mockRejectedValueOnce({ response: { data: { error: 'Credenciales inválidas' } } })
      .mockResolvedValueOnce({ token: 'tok-123', user: estudiante })
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, 'estudiante@uni.edu')
    await user.type(clave, 'mala')
    await user.click(boton())
    await screen.findByText('Credenciales inválidas')
    await user.clear(clave)
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())

    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['sin arroba', 'estudiante.uni.edu'],
    ['sin dominio', 'estudiante@'],
    ['con espacios', 'est udiante@uni.edu'],
  ])('RQ2·C-N5 (validación) correo %s → mensaje de formato y ninguna petición', async (_caso, correoMalo) => {
    const user = userEvent.setup()
    renderLogin()
    const { correo, clave, boton } = campos()

    await user.type(correo, correoMalo)
    await user.type(clave, 'Abcdef1!')
    await user.click(boton())

    expect(await screen.findByText('Por favor, ingresa un correo electrónico válido')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('RQ2·C-P5 (navegación): el enlace "¿Olvidaste tu contraseña?" lleva a la recuperación', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }))

    expect(await screen.findByText('Recuperar contraseña')).toBeInTheDocument()
  })
})

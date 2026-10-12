import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../../features/auth/Login'
import ForgotPassword from '../../features/auth/ForgotPassword'
import ResetPassword from '../../features/auth/ResetPassword'
import AdminUsersPage from '../../features/dashboard-admin/AdminUsersPage'
import { usersApi } from '../../api/users'
import { validarFormularioReset } from '../../features/auth/password-reset-flow'
import { isValidEmail, validatePasswordStrength } from '../../lib/validation'
import { guardarReporte, medir, type Medicion } from '../helpers/medicion'
import { sembrarSesion } from '../helpers/render'

vi.mock('../../api/users', () => ({
  usersApi: { list: vi.fn(), stats: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))
vi.mock('../../api/passwordReset', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  validateResetToken: vi.fn(() => new Promise(() => {})),
}))


const mediciones: Medicion[] = []
const registrar = (m: Medicion) => {
  mediciones.push(m)
  return m
}

const renderEn = (ruta: string, elemento: JSX.Element, path = ruta.split('?')[0]) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={elemento} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

const usuariosFalsos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `u-${i}`,
    email: `usuario${i}@soyudemedellin.edu.co`,
    nombre: `Nombre${i}`,
    apellido: `Apellido${i}`,
    tipo_usuario: ['estudiante', 'profesor', 'coordinador'][i % 3],
    activo: i % 11 !== 0,
  }))

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterAll(() => {
  guardarReporte('front-rq1-rq5', mediciones)
})

describe('RQ2 / RQ3 / RQ5 — render inicial de las pantallas de autenticación', () => {
  it.each([
    ['Login', () => renderEn('/login', <Login />), 'RQ2', 60],
    ['ForgotPassword', () => renderEn('/forgot-password', <ForgotPassword />), 'RQ3', 40],
    ['ResetPassword', () => renderEn('/reset-password?token=t&email=a%40b.co', <ResetPassword />, '/reset-password'), 'RQ5', 40],
  ])('%s se monta dentro del presupuesto (mediana)', (nombre, montar, requisito, presupuestoMs) => {
    const m = registrar(
      medir({ escenario: `render-${nombre}`, requisito, presupuestoMs, repeticiones: 20, calentamiento: 3 }, () => {
        montar()
        cleanup()
      })
    )
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })
})

describe('RQ1 — pantalla de usuarios del admin con volumen', () => {
  beforeAll(() => sembrarSesion({ id: 'a', email: 'a@uni.edu', nombre: 'A', apellido: 'B', tipo_usuario: 'admin' }))

  it.each([
    [1_000, 300],
    [5_000, 500],
  ])('listar %i usuarios (paginado) se monta en ≤ %i ms (mediana)', async (n, presupuestoMs) => {
    vi.mocked(usersApi.list).mockResolvedValue({ users: usuariosFalsos(n) })
    const tiempos: number[] = []
    for (let i = 0; i < 6; i++) {
      const inicio = performance.now()
      renderEn('/admin/usuarios', <AdminUsersPage />)
      await screen.findByText('usuario1@soyudemedellin.edu.co')
      tiempos.push(performance.now() - inicio)
      cleanup()
    }
    const ordenados = tiempos.slice(1).sort((a, b) => a - b) // se descarta el primero (calentamiento)
    const mediana = ordenados[Math.floor(ordenados.length / 2)]
    registrar({
      escenario: `admin-usuarios-${n}`, requisito: 'RQ1', repeticiones: ordenados.length,
      minMs: ordenados[0], medianaMs: mediana, p95Ms: ordenados.at(-1)!, maxMs: ordenados.at(-1)!,
      presupuestoMs, cumple: mediana <= presupuestoMs,
    })
    expect(mediana).toBeLessThanOrEqual(presupuestoMs)
  })

  it('buscar entre 5.000 usuarios responde en ≤ 300 ms', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({ users: usuariosFalsos(5_000) })
    renderEn('/admin/usuarios', <AdminUsersPage />)
    await screen.findByText('usuario1@soyudemedellin.edu.co')
    const buscador = screen.getByPlaceholderText(/buscar por nombre/i)

    const inicio = performance.now()
    fireEvent.change(buscador, { target: { value: 'usuario4999' } })
    await waitFor(() => expect(screen.getByText('usuario4999@soyudemedellin.edu.co')).toBeInTheDocument())
    const ms = performance.now() - inicio

    registrar({ escenario: 'admin-buscar-5000', requisito: 'RQ1', repeticiones: 1, minMs: ms, medianaMs: ms, p95Ms: ms, maxMs: ms, presupuestoMs: 300, cumple: ms <= 300 })
    expect(ms).toBeLessThanOrEqual(300)
  })
})

describe('RQ1 / RQ5 — validaciones del cliente (por pulsación de tecla)', () => {
  it('validar correo y política de contraseña tarda < 0,2 ms (mediana) por pulsación', () => {
    const m = registrar(
      medir({ escenario: 'validaciones-por-tecla', requisito: 'RQ1/RQ5', presupuestoMs: 0.2, repeticiones: 200, calentamiento: 50 }, () => {
        isValidEmail('nuevo.usuario@soyudemedellin.edu.co')
        validatePasswordStrength('Nueva-Clave2026!')
        validarFormularioReset('Nueva-Clave2026!', 'Nueva-Clave2026!')
      })
    )
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('el correo del cliente no sufre ReDoS con una entrada de 100.000 caracteres', () => {
    const hostil = `${'a'.repeat(100_000)}@${'b'.repeat(50_000)}`
    const inicio = performance.now()
    isValidEmail(hostil)
    isValidEmail(`${'a.'.repeat(50_000)}!`)
    const ms = performance.now() - inicio

    registrar({ escenario: 'redos-correo', requisito: 'RQ1/RQ3', repeticiones: 1, minMs: ms, medianaMs: ms, p95Ms: ms, maxMs: ms, presupuestoMs: 100, cumple: ms <= 100 })
    expect(ms).toBeLessThanOrEqual(100)
  })
})

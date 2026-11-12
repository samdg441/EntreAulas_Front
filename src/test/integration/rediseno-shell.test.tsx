/** AppShell y barra lateral: navegación por rol, estado activo y comportamiento en rutas públicas. */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppShell from '../../components/shell/AppShell'
import Header from '../../components/Header'
import { AuthProvider } from '../../context/AuthContext'
import { PreferenciasProvider } from '../../preferencias/PreferenciasContext'
import { sembrarSesion } from '../helpers/render'
import { COORDINADOR, simularMatchMedia } from '../helpers/render-rediseno'

const ESTUDIANTE = { id: 'u-est', email: 'eva@soyudemedellin.edu.co', nombre: 'Eva', apellido: 'E', tipo_usuario: 'estudiante', roles: ['estudiante'] }

function montar(ruta: string, usuario?: Record<string, unknown>) {
  simularMatchMedia(false)
  window.localStorage.clear()
  if (usuario) sembrarSesion(usuario)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <PreferenciasProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="*" element={<main><h1>Contenido de {ruta}</h1></main>} />
            </Route>
          </Routes>
        </AuthProvider>
      </PreferenciasProvider>
    </MemoryRouter>
  )
}

describe('AppShell + Sidebar', () => {
  it('el coordinador ve su navegación agrupada por secciones, con Auditoría en Control', () => {
    montar('/dashboard-coordinador', COORDINADOR)

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })

    for (const seccion of ['Principal', 'Docentes', 'Encuestas', 'Reportes y resultados', 'Control', 'Mi cuenta']) {
      expect(within(nav).getByText(seccion)).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: 'Auditoría' })).toHaveAttribute('href', '/auditoria')
    expect(within(nav).getByRole('link', { name: 'Gestión de profesores' })).toHaveAttribute('href', '/profesores/gestionar')
  })

  it('marca con aria-current la página actual y solo esa', () => {
    montar('/auditoria', COORDINADOR)

    const actuales = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page')

    expect(actuales).toHaveLength(1)
    expect(actuales[0]).toHaveTextContent('Auditoría')
  })

  it('un estudiante no ve enlaces del coordinador', () => {
    montar('/dashboard-estudiante', ESTUDIANTE)

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })

    expect(within(nav).queryByRole('link', { name: 'Auditoría' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Gestión de profesores' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Evaluar docentes' })).toBeInTheDocument()
  })

  it('responder la encuesta mantiene la barra y el control de tono', () => {
    simularMatchMedia(false)
    window.localStorage.clear()
    sembrarSesion(ESTUDIANTE)
    render(
      <MemoryRouter initialEntries={['/evaluate/form']}>
        <PreferenciasProvider>
          <AuthProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/evaluate/form" element={<Header title="Evaluación docente" />} />
              </Route>
            </Routes>
          </AuthProvider>
        </PreferenciasProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Evaluar docentes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preferencias de visualización' })).toBeInTheDocument()
  })

  it('en /login no se dibuja la barra lateral ni el enlace de salto', () => {
    montar('/login')

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Saltar al contenido')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contenido de /login' })).toBeInTheDocument()
  })

  it('ofrece un enlace para saltar al contenido que apunta a #contenido', () => {
    montar('/dashboard-coordinador', COORDINADOR)

    const enlace = screen.getByRole('link', { name: 'Saltar al contenido' })

    expect(enlace).toHaveAttribute('href', '#contenido')
    expect(document.getElementById('contenido')).toContainElement(screen.getByRole('main'))
  })

  it('el botón de cerrar menú cierra el panel en móvil (sin errores)', async () => {
    const usuario = userEvent.setup()
    montar('/dashboard-coordinador', COORDINADOR)

    await usuario.click(screen.getByRole('button', { name: 'Cerrar menú de navegación' }))

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('el botón de flecha oculta y muestra la barra lateral, y la elección se recuerda', async () => {
    const usuario = userEvent.setup()
    montar('/dashboard-coordinador', COORDINADOR)
    const boton = screen.getByRole('button', { name: 'Ocultar la barra lateral' })
    expect(boton).toHaveAttribute('aria-expanded', 'true')

    await usuario.click(boton)

    expect(screen.getByRole('button', { name: 'Mostrar la barra lateral' })).toHaveAttribute('aria-expanded', 'false')
    expect(window.localStorage.getItem('entreaulas.sidebar-colapsada')).toBe('1')
    expect(screen.getByRole('link', { name: 'Auditoría' })).toHaveAttribute('title', 'Auditoría')

    await usuario.click(screen.getByRole('button', { name: 'Mostrar la barra lateral' }))
    expect(window.localStorage.getItem('entreaulas.sidebar-colapsada')).toBe('0')
  })
})

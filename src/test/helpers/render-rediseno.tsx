import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { PreferenciasProvider } from '../../preferencias/PreferenciasContext'
import { sembrarSesion } from './render'

export const COORDINADOR = {
  id: 'u-coord',
  email: 'david@udemedellin.edu.co',
  nombre: 'David',
  apellido: 'Coordinador',
  tipo_usuario: 'coordinador',
  roles: ['coordinador'],
  selected_role: 'coordinador',
}

/** Renderiza con sesión, preferencias (tema/idioma) y router en memoria. */
export function renderConPreferencias(ui: ReactElement, opciones: { user?: Record<string, unknown>; route?: string } = {}) {
  sembrarSesion(opciones.user ?? COORDINADOR)
  return render(
    <MemoryRouter initialEntries={[opciones.route ?? '/']}>
      <PreferenciasProvider>
        <AuthProvider>{ui}</AuthProvider>
      </PreferenciasProvider>
    </MemoryRouter>
  )
}

/** Un `matchMedia` falso: lo necesita el proveedor de preferencias y jsdom no lo trae. */
export function simularMatchMedia(oscuro = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (consulta: string) => ({
      matches: oscuro && consulta.includes('dark'),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
  })
}

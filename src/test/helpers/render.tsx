import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'

export function sembrarSesion(user: Record<string, unknown>, token = 'token-de-prueba') {
  window.localStorage.setItem('token', token)
  window.localStorage.setItem('user', JSON.stringify(user))
}

export function renderConSesion(
  ui: ReactElement,
  options: { user?: Record<string, unknown>; route?: string } = {}
) {
  if (options.user) sembrarSesion(options.user)
  return render(
    <MemoryRouter initialEntries={[options.route ?? '/']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}

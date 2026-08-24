import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'

/** Render con MemoryRouter (soporte para pruebas de rutas / RQ). */
export function renderWithRouter(
  ui: ReactElement,
  options?: {
    route?: string
    path?: string
    extraRoutes?: Array<{ path: string; element: ReactNode }>
  } & Omit<RenderOptions, 'wrapper'>
) {
  const { route = '/', path = '/', extraRoutes = [], ...renderOptions } = options ?? {}

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
        {extraRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </MemoryRouter>,
    renderOptions
  )
}

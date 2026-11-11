import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { mostrarBarraLateral } from '../../lib/navegacion'
import Sidebar from './Sidebar'
import { ShellCtx } from './ShellContext'

/**
 * Estructura común de las pantallas con sesión: enlace para saltar la navegación,
 * barra lateral por rol y el contenido. La barra superior la dibuja el Header de cada página.
 */
export default function AppShell() {
  const { pathname } = useLocation()
  const { t } = usePreferencias()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const conBarra = mostrarBarraLateral(pathname)
  const cerrar = useCallback(() => setMenuAbierto(false), [])

  const contexto = useMemo(
    () => ({ dentroDelShell: conBarra, abrirMenu: () => setMenuAbierto(true) }),
    [conBarra]
  )

  if (!conBarra) {
    return (
      <ShellCtx.Provider value={contexto}>
        <Outlet />
      </ShellCtx.Provider>
    )
  }

  return (
    <ShellCtx.Provider value={contexto}>
      <a href="#contenido" className="skip-link">
        {t('shell.saltar')}
      </a>
      <div className="fondo-entreaulas flex min-h-screen bg-gray-50">
        <Sidebar abierto={menuAbierto} onCerrar={cerrar} />
        <div id="contenido" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Outlet />
        </div>
      </div>
    </ShellCtx.Provider>
  )
}

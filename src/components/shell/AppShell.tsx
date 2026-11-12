import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { mostrarBarraLateral } from '../../lib/navegacion'
import Sidebar from './Sidebar'
import { ShellCtx } from './ShellContext'

/** Los dos grupos del admin (administración y encuestas) cambian de ruta: la entrada se desliza. */
function apartadoAdmin(ruta: string): boolean {
  return ruta.startsWith('/dashboard-admin') || ruta.startsWith('/admin') || ruta.startsWith('/surveys/schedule')
}

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
  const yaPintado = useRef(false)
  const reducir = useReducedMotion()
  useEffect(() => {
    yaPintado.current = true
  }, [])
  const animarAdmin = apartadoAdmin(pathname) && yaPintado.current && !reducir

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
          <motion.div
            key={pathname}
            initial={animarAdmin ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </ShellCtx.Provider>
  )
}

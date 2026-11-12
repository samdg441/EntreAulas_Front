import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import logoUniversidad from '../../assets/logo_conciencia.webp'

const enlaces = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#beneficios', label: 'Beneficios' },
]

export default function LandingNavbar() {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6">
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-6xl rounded-3xl border border-gray-200 bg-white/90 px-3 py-2 shadow-md backdrop-blur-xl sm:rounded-full sm:px-5"
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          <a href="#inicio" className="flex items-center gap-2.5 justify-self-start" onClick={cerrar}>
            <img
              src={logoUniversidad}
              alt="Escudo Universidad de Medellín"
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight text-[#2D3748]">EntreAulas</span>
              <span className="block text-[11px] text-[#718096]">Universidad de Medellín</span>
            </span>
          </a>

          <div className="hidden items-center justify-center gap-8 md:flex">
            {enlaces.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="text-sm text-[#718096] transition hover:text-[#E30613]"
              >
                {enlace.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/login"
              className="rounded-full bg-[#E30613] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B8050F] focus:outline-none focus:ring-2 focus:ring-[#E30613] focus:ring-offset-2"
            >
              Iniciar Sesión
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#2D3748] md:hidden"
              aria-expanded={abierto}
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setAbierto((valor) => !valor)}
            >
              {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="mt-2 flex flex-col items-center gap-1 border-t border-gray-200 px-2 py-3">
                {enlaces.map((enlace) => (
                  <a
                    key={enlace.href}
                    href={enlace.href}
                    onClick={cerrar}
                    className="w-full rounded-xl px-3 py-2 text-center text-sm text-[#2D3748] hover:bg-[#FEF2F2] hover:text-[#E30613]"
                  >
                    {enlace.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  )
}

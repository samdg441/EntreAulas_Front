import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileBarChart,
  Home,
  QrCode,
  ScrollText,
  UserCircle,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { rolDeNavegacion, rutaActiva, seccionesPorRol, type IconoNav } from '../../lib/navegacion'
import logo from '../../assets/logo_conciencia.webp'

const ICONOS: Record<IconoNav, LucideIcon> = {
  inicio: Home,
  evaluar: ClipboardCheck,
  perfil: UserCircle,
  docentes: Users,
  encuestas: CalendarClock,
  reportes: FileBarChart,
  resultados: BarChart3,
  auditoria: ScrollText,
  materias: BookOpen,
  usuarios: UserCog,
  academico: Building2,
  qr: QrCode,
}

interface SidebarProps {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Barra lateral. En pantallas grandes está fija; en móvil es un panel que se abre desde la barra superior.
 * Las secciones agrupan las rutas por tipo y cambian según el rol de la sesión.
 */
export default function Sidebar({ abierto, onCerrar }: Readonly<SidebarProps>) {
  const { user } = useAuth()
  const { t } = usePreferencias()
  const { pathname } = useLocation()
  const secciones = seccionesPorRol(rolDeNavegacion(user))
  const activa = rutaActiva(secciones, pathname)
  const panel = useRef<HTMLElement>(null)

  // Al navegar en móvil se cierra el panel.
  useEffect(() => {
    onCerrar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPulsar)
    panel.current?.querySelector<HTMLElement>('a,button')?.focus()
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, onCerrar])

  return (
    <>
      {abierto && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-hidden="true" onClick={onCerrar} />}

      <aside
        ref={panel}
        id="barra-lateral"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <NavLink
            to="/dashboard"
            aria-label={t('shell.irInicio')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FFFFFF] p-1.5"
          >
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </NavLink>
          <div className="min-w-0">
            <p className="text-subtitle font-semibold leading-tight">{t('app.nombre')}</p>
            <p className="truncate text-small text-slate-300">{t('app.universidad')}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label={t('shell.cerrarMenu')}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-50/10 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t('shell.navegacion')} className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
          {secciones.map((seccion) => (
            <div key={seccion.clave}>
              <p className="px-3 pb-1 text-small font-medium text-slate-300">{t(seccion.clave)}</p>
              <ul className="space-y-0.5">
                {seccion.enlaces.map((enlace) => {
                  const Icono = ICONOS[enlace.icono]
                  const esActiva = activa === enlace.ruta
                  return (
                    <li key={`${seccion.clave}-${enlace.ruta}`}>
                      <NavLink
                        to={enlace.ruta}
                        aria-current={esActiva ? 'page' : undefined}
                        className={`relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-body transition-colors ${
                          esActiva
                            ? 'bg-slate-50/10 font-semibold text-white'
                            : 'text-slate-200 hover:bg-slate-50/5 hover:text-white'
                        }`}
                      >
                        {esActiva && (
                          <span className="absolute -left-3 top-2 h-[calc(100%-1rem)] w-1 rounded-r bg-red-600" aria-hidden="true" />
                        )}
                        <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>{t(enlace.clave)}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

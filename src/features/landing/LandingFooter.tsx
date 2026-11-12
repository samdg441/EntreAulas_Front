import { Link } from 'react-router-dom'
import logoUniversidad from '../../assets/logo_conciencia.webp'

const anclas = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#beneficios', label: 'Beneficios' },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
        <div className="flex items-center gap-3">
          <img src={logoUniversidad} alt="" className="h-12 w-12 object-contain" />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#2D3748]">EntreAulas</p>
            <p className="text-xs text-[#718096]">Universidad de Medellín</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#718096]" aria-label="Pie de página">
          {anclas.map((ancla) => (
            <a key={ancla.href} href={ancla.href} className="hover:text-[#E30613]">
              {ancla.label}
            </a>
          ))}
          <Link to="/login" className="hover:text-[#E30613]">
            Iniciar Sesión
          </Link>
        </nav>
        <p className="text-xs text-[#718096]">
          © {new Date().getFullYear()} Universidad de Medellín. Evaluación docente del campus.
        </p>
      </div>
    </footer>
  )
}

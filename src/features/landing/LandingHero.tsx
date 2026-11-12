import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { aparecer } from './motion'

const filas = [
  { titulo: 'Evaluaciones pendientes', valor: '0', nota: 'Deben completarse pronto', tono: 'text-[#E30613]' },
  { titulo: 'Evaluaciones completadas', valor: '4', nota: 'Este periodo académico', tono: 'text-[#48BB78]' },
  { titulo: 'Cursos matriculados', valor: '4', nota: 'Este semestre', tono: 'text-[#4299E1]' },
]

function PanelDemo() {
  const reducido = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <motion.div
        animate={reducido ? undefined : { y: [0, -8, 0] }}
        transition={reducido ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-3xl border border-gray-200 bg-white p-3 shadow-xl sm:p-4"
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#718096]">Panel del estudiante</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4 text-center sm:p-6">
          <p className="text-lg font-semibold text-[#2D3748]">Buenas noches, campus</p>
          <p className="mt-1 text-sm text-[#718096]">Resumen de tu actividad en el periodo vigente.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {filas.map((fila, indice) => (
              <motion.div
                key={fila.titulo}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + indice * 0.12 }}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center shadow-sm"
              >
                <p className="text-[11px] text-[#718096]">{fila.titulo}</p>
                <p className={`mt-2 text-3xl font-semibold tracking-tight ${fila.tono}`}>{fila.valor}</p>
                <p className="mt-1 text-[11px] text-[#718096]">{fila.nota}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function LandingHero() {
  return (
    <section id="inicio" className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-8 pt-32 text-center sm:px-6 sm:pt-36 lg:pt-40">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="flex w-full max-w-3xl flex-col items-center"
      >
        <motion.p
          variants={aparecer}
          className="inline-flex items-center gap-2 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-xs font-medium text-[#991B1B]"
        >
          <motion.span
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E30613]" aria-hidden="true" />
          </motion.span>
          La evolución en la gestión de aulas
        </motion.p>
        <motion.h1
          variants={aparecer}
          className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-[#2D3748] sm:text-5xl lg:text-6xl"
        >
          La evaluación docente, <span className="text-[#E30613]">clara</span> para todo el <span className="text-[#4299E1]">campus</span>.
        </motion.h1>
        <motion.p variants={aparecer} className="mt-5 max-w-2xl text-base leading-relaxed text-[#718096] sm:text-lg">
          Estudiantes responden en el aula. Profesores ven sus métricas. Coordinación y decanatura siguen el periodo sin armar el reporte a mano.
        </motion.p>
        <motion.div variants={aparecer} className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E30613] px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#B8050F] focus:outline-none focus:ring-2 focus:ring-[#E30613] focus:ring-offset-2"
            >
              Ingresar a la Plataforma
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.a
            href="#caracteristicas"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center rounded-full bg-[#E8ECF0] px-6 py-3 text-sm font-medium text-[#2D3748] transition hover:bg-[#1D3557] hover:text-white"
          >
            Conocer más
          </motion.a>
        </motion.div>
      </motion.div>
      <div className="mt-12 w-full">
        <PanelDemo />
      </div>
    </section>
  )
}

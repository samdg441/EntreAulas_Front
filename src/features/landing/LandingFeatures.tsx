import { motion } from 'framer-motion'
import {
  Building2,
  ClipboardCheck,
  Gauge,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { aparecer, icono, lista } from './motion'

function Titulo({ kicker, children }: { kicker: string; children: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      variants={aparecer}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E30613]">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2D3748] sm:text-4xl">{children}</h2>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="mx-auto mt-4 block h-1 w-12 origin-center rounded-full bg-[#E30613]"
      />
    </motion.div>
  )
}

function Tarjeta({
  icono: Icono,
  titulo,
  texto,
  tono = 'rojo',
}: {
  icono: LucideIcon
  titulo: string
  texto: string
  tono?: 'rojo' | 'marino' | 'azul'
}) {
  const pozo = {
    rojo: 'bg-[#FEF2F2] text-[#E30613]',
    marino: 'bg-[#1D3557]/10 text-[#1D3557]',
    azul: 'bg-[#4299E1]/15 text-[#4299E1]',
  }[tono]

  return (
    <motion.article
      variants={aparecer}
      whileHover={{ y: -6 }}
      className="flex h-full flex-col items-center rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:border-[#E30613]/40 hover:shadow-md"
    >
      <motion.span
        variants={icono}
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${pozo}`}
      >
        <Icono className="h-5 w-5" aria-hidden="true" />
      </motion.span>
      <h3 className="mt-5 text-lg font-semibold text-[#2D3748]">{titulo}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#718096]">{texto}</p>
    </motion.article>
  )
}

const caracteristicas = [
  {
    icono: Building2,
    titulo: 'Gestión institucional',
    texto: 'Facultades, carreras, periodos y ventanas de evaluación viven en el mismo tablero. Cada rol ve solo el alcance que le corresponde.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Acceso por roles',
    texto: 'Estudiante, profesor, coordinación, decanatura y administración entran por la misma puerta y llegan a su panel.',
  },
  {
    icono: Gauge,
    titulo: 'Control en tiempo real',
    texto: 'Pendientes, respuestas y promedios del periodo se actualizan con lo que ya está registrado.',
  },
]

const modulos = [
  { icono: ClipboardCheck, titulo: 'Estudiante', texto: 'Materias del semestre y evaluaciones abiertas, en fecha o con el QR de la clase.' },
  { icono: Users, titulo: 'Profesor', texto: 'Promedio, volumen de respuestas y comentarios del curso, en escala de 1 a 5.' },
  { icono: QrCode, titulo: 'Coordinación', texto: 'Docentes en seguimiento, ventanas de encuesta y códigos para el aula.' },
  { icono: Sparkles, titulo: 'Decanatura', texto: 'Lectura de facultad: carreras, profesores y el promedio que pide atención.' },
]

const beneficios = [
  { cifra: '1', detalle: 'ingreso para todo el campus, con el panel de cada rol.', tono: 'text-[#E30613]' },
  { cifra: 'QR', detalle: 'para evaluar en el aula, sin buscar la materia a mano.', tono: 'text-[#1D3557]' },
  { cifra: 'IA', detalle: 'que resume comentarios cuando ya hay respuestas abiertas.', tono: 'text-[#4299E1]' },
]

export default function LandingFeatures() {
  return (
    <>
      <section id="caracteristicas" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Titulo kicker="Características">Lo que el campus necesita ver, sin otra hoja de cálculo.</Titulo>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={lista}
          className="mt-10 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3"
        >
          {caracteristicas.map((item) => (
            <Tarjeta key={item.titulo} {...item} />
          ))}
        </motion.div>
      </section>

      <section id="modulos" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Titulo kicker="Módulos">Un panel para cada quien.</Titulo>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={lista}
          className="mt-10 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {modulos.map((item) => (
            <Tarjeta key={item.titulo} {...item} tono="marino" />
          ))}
        </motion.div>
      </section>

      <section id="beneficios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Titulo kicker="Beneficios">Menos trámite entre el aula y la decisión.</Titulo>
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={lista}
          className="mt-10 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3"
        >
          {beneficios.map((item) => (
            <motion.li
              key={item.cifra}
              variants={aparecer}
              whileHover={{ y: -6 }}
              className="flex h-full flex-col items-center rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm"
            >
              <p className={`text-4xl font-semibold tracking-tight ${item.tono}`}>{item.cifra}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#718096]">{item.detalle}</p>
            </motion.li>
          ))}
        </motion.ol>
      </section>
    </>
  )
}

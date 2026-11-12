import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { aparecer } from './motion'

export default function LandingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.45 }}
        variants={aparecer}
        className="rounded-[2rem] bg-[#1D3557] px-6 py-14 text-center text-white shadow-lg sm:px-12"
      >
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          El periodo ya está abierto. Entra con tu cuenta institucional.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          EntreAulas reconoce tu rol y te deja en el panel que te corresponde: aula, coordinación o facultad.
        </p>
        <motion.div className="mt-8" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E30613] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#B8050F] focus:outline-none focus:ring-2 focus:ring-[#E30613] focus:ring-offset-2 focus:ring-offset-[#1D3557]"
          >
            Iniciar Sesión
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

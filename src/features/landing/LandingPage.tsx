import { motion, useReducedMotion } from 'framer-motion'
import fondo from '../../assets/fondo.webp'
import LandingCta from './LandingCta'
import LandingFeatures from './LandingFeatures'
import LandingFooter from './LandingFooter'
import LandingHero from './LandingHero'
import LandingNavbar from './LandingNavbar'

export default function LandingPage() {
  const reducido = useReducedMotion()

  return (
    <div className="relative min-h-screen scroll-smooth overflow-x-hidden bg-[#F8FAFC] text-[#2D3748]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.12]">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondo})` }}
          animate={reducido ? undefined : { scale: [1, 1.05, 1] }}
          transition={reducido ? undefined : { duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 top-32 h-56 w-56 rounded-full bg-[#E30613]/15 blur-3xl"
        animate={reducido ? undefined : { y: [0, 24, 0], x: [0, 12, 0] }}
        transition={reducido ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -right-20 bottom-24 h-64 w-64 rounded-full bg-[#4299E1]/20 blur-3xl"
        animate={reducido ? undefined : { y: [0, -20, 0], x: [0, -10, 0] }}
        transition={reducido ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingFeatures />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}

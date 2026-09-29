import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import Card from '../../components/Card'
import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

export function AuthRecoveryLayout({
  subtitle,
  children,
}: Readonly<{ subtitle: string; children: ReactNode }>) {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100"
      style={{
        backgroundImage: `url(${fondoImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md relative z-10"
      >
        <Card className="bg-white shadow-xl p-4 sm:p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex justify-center mb-3"
            >
              <img
                src={logoUniversidadImg}
                alt="Logo Universidad de Medellín"
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
              />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">EntreAulas</h1>
            <p className="text-gray-600 mt-2 text-xs sm:text-sm">{subtitle}</p>
          </div>

          {children}

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors mx-auto"
            >
              <FaArrowLeft className="h-3 w-3" />
              Volver al inicio de sesión
            </button>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Universidad de Medellín - EntreAulas</p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

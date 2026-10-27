import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { fetchTeachersWithCourses } from '../../api/teachers'

import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

export default function EvaluationGoodbye() {
  const navigate = useNavigate()
  const { getDashboardPath } = useAuth()
  const [hayPendientes, setHayPendientes] = useState(false)

  useEffect(() => {
    let activo = true
    fetchTeachersWithCourses()
      .then((docentes) => {
        if (!activo) return
        const pendiente = docentes.some((docente) =>
          (docente.courses || []).some((curso) => curso.evaluada !== true)
        )
        setHayPendientes(pendiente)
      })
      .catch(() => {
        if (activo) setHayPendientes(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100 relative"
      style={{
        backgroundImage: `url(${fondoImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white shadow-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="flex justify-center mb-4"
          >
            <img
              src={logoUniversidadImg}
              alt="Logo EntreAulas"
              className="h-24 w-24 object-contain"
            />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Gracias por tu participación
          </h1>
          <p className="text-gray-600 mb-8">
            Tu encuesta fue enviada correctamente. Tus respuestas son anónimas y confidenciales.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => navigate(getDashboardPath(), { replace: true })}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Volver al panel principal
            </Button>
            {hayPendientes && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/evaluate/selection')}
                className="w-full"
              >
                Evaluar siguiente materia
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

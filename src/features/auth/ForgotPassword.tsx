import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { requestPasswordReset } from '../../api/passwordReset'
import { FaEnvelope, FaCheckCircle, FaArrowLeft, FaSpinner } from 'react-icons/fa'
import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

const fondo = fondoImg
const logoUniversidad = logoUniversidadImg

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const tokenFromLink = searchParams.get('token')
  const emailFromLink = searchParams.get('email')

  React.useEffect(() => {
    if (tokenFromLink) {
      const params = new URLSearchParams()
      params.set('token', tokenFromLink)
      if (emailFromLink) params.set('email', emailFromLink)
      navigate(`/reset-password?${params.toString()}`, { replace: true })
    }
  }, [tokenFromLink, emailFromLink, navigate])

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    if (!email) {
      setEmailError('El correo electrónico es requerido')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Por favor, ingresa un correo electrónico válido')
      return
    }

    setIsLoading(true)
    try {
      const response = await requestPasswordReset({ email: email.trim() })
      if (response.success) {
        setSuccessMessage(response.message)
        setSent(true)
      } else {
        setGeneralError(response.message)
      }
    } catch {
      setGeneralError('Error al enviar la solicitud')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100"
      style={{
        backgroundImage: `url(${fondo})`,
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
                src={logoUniversidad}
                alt="Logo Universidad de Medellín"
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
              />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">EntreAulas</h1>
            <p className="text-gray-600 mt-2 text-xs sm:text-sm">
              {sent ? 'Revisa tu correo' : 'Recuperar tu contraseña'}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Solicitud enviada</h3>
                <p className="text-gray-600 text-sm">{successMessage}</p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                Ir al inicio de sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu
                contraseña. El enlace caduca en 1 hora.
              </p>
              <Input
                label="Correo Institucional"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                placeholder="tu.correo@universidad.edu"
                required
                error={emailError}
                leftIcon={<FaEnvelope className="h-4 w-4 text-gray-500" />}
              />

              {generalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {generalError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>
            </form>
          )}

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

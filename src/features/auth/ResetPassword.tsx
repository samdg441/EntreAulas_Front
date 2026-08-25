import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { resetPassword, validateResetToken } from '../../api/passwordReset'
import {
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from 'react-icons/fa'
import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

const fondo = fondoImg
const logoUniversidad = logoUniversidadImg

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula'
  if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula'
  if (!/\d/.test(password)) return 'La contraseña debe contener al menos un número'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'La contraseña debe contener al menos un carácter especial'
  }
  return null
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const emailFromUrl = searchParams.get('email') || ''

  const [email] = useState(emailFromUrl)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkToken() {
      if (!token || !emailFromUrl) {
        setErrors({
          general: 'El enlace de recuperación es inválido o está incompleto.',
        })
        setIsValidating(false)
        setTokenValid(false)
        return
      }

      const response = await validateResetToken(token, emailFromUrl)
      if (cancelled) return

      if (response.success) {
        setTokenValid(true)
      } else {
        setTokenValid(false)
        setErrors({ general: response.message })
      }
      setIsValidating(false)
    }

    checkToken()
    return () => {
      cancelled = true
    }
  }, [token, emailFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}

    if (!newPassword) {
      nextErrors.newPassword = 'La nueva contraseña es requerida'
    } else {
      const strength = validatePassword(newPassword)
      if (strength) nextErrors.newPassword = strength
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    setErrors({})
    try {
      const response = await resetPassword({
        token,
        email,
        newPassword,
        confirmPassword,
      })
      if (response.success) {
        setSuccessMessage(response.message)
        setSuccess(true)
      } else {
        setErrors({ general: response.message })
      }
    } catch {
      setErrors({ general: 'Error al actualizar la contraseña' })
    } finally {
      setIsLoading(false)
    }
  }

  const title = success
    ? 'Proceso completado'
    : isValidating
      ? 'Validando enlace'
      : tokenValid
        ? 'Crear nueva contraseña'
        : 'Enlace no válido'

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
            <p className="text-gray-600 mt-2 text-xs sm:text-sm">{title}</p>
          </div>

          {isValidating && (
            <div className="flex flex-col items-center gap-3 py-6 text-gray-600">
              <FaSpinner className="h-6 w-6 animate-spin text-red-600" />
              <p className="text-sm">Validando el enlace de recuperación...</p>
            </div>
          )}

          {!isValidating && success && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Contraseña actualizada</h3>
                <p className="text-gray-600 text-sm">{successMessage}</p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                Ir al inicio de sesión
              </Button>
            </div>
          )}

          {!isValidating && !success && !tokenValid && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general || 'Token inválido o expirado'}
              </div>
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                Solicitar un nuevo enlace
              </Button>
            </div>
          )}

          {!isValidating && !success && tokenValid && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo Institucional"
                type="email"
                value={email}
                disabled
                leftIcon={<FaEnvelope className="h-4 w-4 text-gray-500" />}
              />

              <Input
                label="Nueva Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }))
                }}
                placeholder="••••••••"
                required
                error={errors.newPassword}
                showErrorIcon={false}
                leftIcon={<FaLock className="h-4 w-4 text-gray-500" />}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center">
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                }
              />

              <Input
                label="Confirmar Nueva Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                placeholder="••••••••"
                required
                error={errors.confirmPassword}
                showErrorIcon={false}
                leftIcon={<FaLock className="h-4 w-4 text-gray-500" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="flex items-center"
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                }
              />

              <p className="text-xs text-gray-500">
                Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
              </p>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
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
                    Actualizando...
                  </div>
                ) : (
                  'Actualizar contraseña'
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

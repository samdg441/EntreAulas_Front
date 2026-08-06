import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { requestPasswordReset, resetPassword, validateResetToken } from '../../api/passwordReset'
import { 
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaSpinner
} from 'react-icons/fa'

// Importación de assets
import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

const fondo = fondoImg
const logoUniversidad = logoUniversidadImg

interface FormData {
  email: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  // Verificar si viene con token de reset
  const resetToken = searchParams.get('token')
  const userEmail = searchParams.get('email')

  React.useEffect(() => {
    if (resetToken && userEmail) {
      // Validar el token antes de mostrar el formulario de reset
      validateResetToken(resetToken, userEmail).then(response => {
        if (response.success) {
          setStep('reset')
          setFormData(prev => ({ ...prev, email: userEmail }))
        } else {
          setErrors({ general: response.message })
        }
      }).catch(error => {
        setErrors({ general: 'Error al validar el token de recuperación' })
      })
    }
  }, [resetToken, userEmail])

  // Función para validar correo electrónico
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Función para validar contraseña
  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }
    if (!hasUpperCase) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }
    if (!hasLowerCase) {
      return 'La contraseña debe contener al menos una letra minúscula'
    }
    if (!hasNumbers) {
      return 'La contraseña debe contener al menos un número'
    }
    if (!hasSpecialChar) {
      return 'La contraseña debe contener al menos un carácter especial'
    }
    return null
  }

  // Función para manejar cambios en los campos
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar errores al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Función para validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (step === 'request') {
      if (!formData.email) {
        newErrors.email = 'El correo electrónico es requerido'
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Por favor, ingresa un correo electrónico válido'
      }
    } else if (step === 'reset') {
      if (!formData.newPassword) {
        newErrors.newPassword = 'La nueva contraseña es requerida'
      } else {
        const passwordError = validatePassword(formData.newPassword)
        if (passwordError) {
          newErrors.newPassword = passwordError
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña'
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Función para solicitar reset de contraseña
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await requestPasswordReset({ email: formData.email })
      
      if (response.success) {
        setSuccessMessage(response.message)
        setStep('success')
      } else {
        setErrors({ general: response.message })
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al enviar la solicitud' })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para resetear contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await resetPassword({
        token: resetToken || '',
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })
      
      if (response.success) {
        setSuccessMessage(response.message)
        setStep('success')
      } else {
        setErrors({ general: response.message })
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al actualizar la contraseña' })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para volver al login
  const handleBackToLogin = () => {
    navigate('/login')
  }

  // Función para ir al login después del éxito
  const handleGoToLogin = () => {
    navigate('/login')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay más oscuro para mejor contraste */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md relative z-10" 
      >
        <Card className="bg-white shadow-xl p-4 sm:p-8"> 
          {/* Header con logo de la universidad */}
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
              {step === 'request' && 'Recuperar tu contraseña'}
              {step === 'reset' && 'Crear nueva contraseña'}
              {step === 'success' && 'Proceso completado'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Paso 1: Solicitar reset */}
            {step === 'request' && (
              <motion.div
                key="request"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <Input
                    label="Correo Institucional"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu.correo@universidad.edu"
                    required
                    error={errors.email}
                    leftIcon={<FaEnvelope className="h-4 w-4 text-gray-500" />}
                  />

                  {/* Mostrar error general si existe */}
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    >
                      {errors.general}
                    </motion.div>
                  )}

                  {/* Botón de enviar */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* Paso 2: Resetear contraseña */}
            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    label="Correo Institucional"
                    type="email"
                    value={formData.email}
                    disabled
                    leftIcon={<FaEnvelope className="h-4 w-4 text-gray-500" />}
                  />

                  <Input
                    label="Nueva Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    error={errors.newPassword}
                    showErrorIcon={false}
                    leftIcon={<FaLock className="h-4 w-4 text-gray-500" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center"
                      >
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
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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

                  {/* Mostrar error general si existe */}
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    >
                      {errors.general}
                    </motion.div>
                  )}

                  {/* Botón de actualizar */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                        'Actualizar Contraseña'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* Paso 3: Éxito */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ¡Proceso Completado!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {successMessage}
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGoToLogin}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
                  >
                    Ir al Inicio de Sesión
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de volver */}
          <div className="text-center mt-6">
            <button
              onClick={handleBackToLogin}
              className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors mx-auto"
            >
              <FaArrowLeft className="h-3 w-3" />
              Volver al inicio de sesión
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Universidad de Medellín - EntreAulas</p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { resetPassword, validateResetToken } from '../../api/passwordReset'
import { validatePasswordStrength } from '../../lib/validation'
import { AuthRecoveryLayout } from './auth-recovery-layout'
import {
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from 'react-icons/fa'

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
      const strength = validatePasswordStrength(newPassword)
      if (!strength.valid && strength.message) nextErrors.newPassword = strength.message
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

  const tituloToken = tokenValid ? 'Crear nueva contraseña' : 'Enlace no válido'
  const tituloValidacion = isValidating ? 'Validando enlace' : tituloToken
  const title = success ? 'Proceso completado' : tituloValidacion

  return (
    <AuthRecoveryLayout subtitle={title}>
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

    </AuthRecoveryLayout>
  )
}

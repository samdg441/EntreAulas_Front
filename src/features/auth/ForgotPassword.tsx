import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { requestPasswordReset } from '../../api/passwordReset'
import { getApiErrorMessage } from '../../lib/apiError'
import { AuthRecoveryLayout } from './auth-recovery-layout'
import { validarFormularioRequest } from './password-reset-flow'
import { FaEnvelope, FaCheckCircle, FaSpinner } from 'react-icons/fa'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const { email: emailValidationError } = validarFormularioRequest(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      return
    }

    setIsLoading(true)
    try {
      const response = await requestPasswordReset({ email })

      if (response.success) {
        setSuccessMessage(response.message)
        setSent(true)
      } else {
        setGeneralError(response.message)
      }
    } catch (error: unknown) {
      setGeneralError(getApiErrorMessage(error, 'Error al enviar la solicitud'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthRecoveryLayout subtitle={sent ? 'Revisa tu correo' : 'Recuperar tu contraseña'}>
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

    </AuthRecoveryLayout>
  )
}

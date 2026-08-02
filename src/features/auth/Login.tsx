import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { UserType } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaCog, 
  FaChevronDown,
  FaEnvelope,
  FaLock,
  FaExclamationCircle,
  FaUserCheck,
  FaUserTie
} from 'react-icons/fa'

// Importación de assets
import fondoImg from '../../assets/fondo.webp'
import logoUniversidadImg from '../../assets/logo_conciencia.webp'

export default function Login() {
  const [userType, setUserType] = useState<UserType>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const navigate = useNavigate()
  const { login, loginWithRole, getDashboardPath, getDashboardPathForUser } = useAuth()

  // Función para validar correo electrónico
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Función para manejar cambios en el email con validación
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    // Limpiar error si el campo está vacío
    if (!value) {
      setEmailError('')
      return
    }
    
    // Validar formato de email
    if (!validateEmail(value)) {
      setEmailError('Por favor, ingresa un correo electrónico válido')
    } else {
      setEmailError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación del email antes de enviar
    if (!email || !validateEmail(email)) {
      setEmailError('Por favor, ingresa un correo electrónico válido')
      return
    }
    
    // Validación básica
    if (!email || !password) {
      setError('Por favor, completa todos los campos')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      // Si estamos en modo selección de rol, hacer login con el rol seleccionado
      if (showRoleSelection && selectedRole) {
        await loginWithRole(email, password, selectedRole)
        const redirectTo = localStorage.getItem('redirectTo')
        if (redirectTo) {
          localStorage.removeItem('redirectTo')
          navigate(redirectTo)
        } else {
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
          const dashboardPath = getDashboardPathForUser(savedUser)
          navigate(dashboardPath)
        }
        return
      }

      // Intentar login normal
      const response = await login(email, password, userType)
      
      // Si la respuesta indica que se requiere selección de rol
      if (response && 'requires_role_selection' in response && response.requires_role_selection) {
        const authResponse = response as any // Type assertion para acceder a las propiedades
        setUserInfo({ name: `${authResponse.user.nombre} ${authResponse.user.apellido}` })
        setAvailableRoles(authResponse.available_roles || [])
        setShowRoleSelection(true)
        setError('')
        setIsLoading(false)
        return
      }
      
      // Redireccionar al dashboard correcto usando el usuario de la respuesta (evita estado desactualizado)
      const redirectTo = localStorage.getItem('redirectTo')
      if (redirectTo) {
        localStorage.removeItem('redirectTo')
        navigate(redirectTo)
      } else {
        const dashboardPath = response && 'user' in response ? getDashboardPathForUser((response as any).user) : getDashboardPath()
        navigate(dashboardPath)
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      
      // Si el error indica que el usuario tiene múltiples roles, mostrar selección
      if (error.message && error.message.includes('múltiples roles')) {
        // Extraer información del usuario y roles disponibles del mensaje de error
        const userMatch = error.message.match(/usuario: (.+?), roles: \[(.+?)\]/)
        if (userMatch) {
          const userName = userMatch[1]
          const rolesString = userMatch[2]
          const roles = rolesString.split(',').map((role: string) => role.trim().replace(/['"]/g, ''))
          
          setUserInfo({ name: userName })
          setAvailableRoles(roles)
          setShowRoleSelection(true)
          setError('')
          setIsLoading(false)
          return
        }
      }
      
      setError(error.response?.data?.error || error.message || 'Error en la autenticación')
    } finally {
      setIsLoading(false)
    }
  }

  const getUserTypeLabel = (type: UserType) => {
    switch (type) {
      case 'student':
        return 'Estudiante'
      case 'teacher':
        return 'Docente'
      case 'coordinator':
        return 'Coordinador'
      case 'decano':
        return 'Decano'
      default:
        return 'Estudiante'
    }
  }

  const getUserTypeIcon = (type: UserType, size = "h-5 w-5") => {
    switch (type) {
      case 'student':
        return <FaGraduationCap className={size} />
      case 'teacher':
        return <FaChalkboardTeacher className={size} />
      case 'coordinator':
        return <FaCog className={size} />
      case 'decano':
        return <FaUserTie className={size} />
      default:
        return <FaGraduationCap className={size} />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'estudiante':
        return 'Estudiante'
      case 'profesor':
      case 'docente':
        return 'Docente'
      case 'coordinador':
        return 'Coordinador'
      case 'admin':
        return 'Administrador'
      default:
        return role
    }
  }

  const getRoleIcon = (role: string, size = "h-4 w-4") => {
    switch (role) {
      case 'estudiante':
        return <FaGraduationCap className={size} />
      case 'profesor':
      case 'docente':
        return <FaChalkboardTeacher className={size} />
      case 'coordinador':
        return <FaCog className={size} />
      case 'decano':
        return <FaUserTie className={size} />
      case 'admin':
        return <FaUserCheck className={size} />
      default:
        return <FaUserCheck className={size} />
    }
  }

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role)
  }

  const handleBackToLogin = () => {
    setShowRoleSelection(false)
    setAvailableRoles([])
    setSelectedRole('')
    setUserInfo(null)
    setError('')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100"
      style={{
        backgroundImage: `url(${fondoImg})`,
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
        className="w-full max-w-md sm:max-w-lg relative z-10" 
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
              {/* Reemplazado el círculo rojo con birrete por el logo */}
              <img 
                src={logoUniversidadImg} 
                alt="Logo Universidad de Medellín" 
                className="h-20 w-20 sm:h-[140px] sm:w-[150px] object-contain"
              />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">EntreAulas</h1>
            <p className="text-gray-600 mt-2 text-xs sm:text-sm">
              Accede con tus credenciales institucionales
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Usuario - Dropdown */}
            <div>
              <h2 className="text-base font-medium text-gray-700 mb-3">Tipo de Usuario</h2>
              <div className="relative z-10">
                <button
                  type="button"
                  className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg bg-white hover:border-red-500 transition-colors text-base"
                  onClick={() => {
                    console.log('🔽 Dropdown clicked, current state:', isDropdownOpen);
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-red-600">{getUserTypeIcon(userType, "h-4 w-4")}</span>
                    <span className="text-gray-800">{getUserTypeLabel(userType)}</span>
                  </div>
                  <FaChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
                    >
                      {(['student', 'teacher', 'coordinator', 'decano'] as UserType[]).map((type) => (
                        <div
                          key={type}
                          className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors text-base ${
                            userType === type ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => {
                            console.log('👤 User type selected:', type);
                            setUserType(type)
                            setIsDropdownOpen(false)
                          }}
                        >
                          <span className="mr-2 text-red-600">{getUserTypeIcon(type, "h-4 w-4")}</span>
                          <span className="text-gray-800">{getUserTypeLabel(type)}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Email con icono */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {userType === 'student' ? 'Correo Institucional' : 'Email Institucional'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder={userType === 'student' ? 'estudiante@universidad.edu' : 'profesor@universidad.edu'}
                  required
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm ${
                    emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {emailError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaExclamationCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center gap-1 mt-1"
                >
                  <FaExclamationCircle className="h-3 w-3" />
                  {emailError}
                </motion.p>
              )}
            </div>

            {/* Contraseña con icono */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            {/* Mostrar error si existe */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Botón de Ingresar con icono dinámico */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="loading-spinner border-white" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {getUserTypeIcon(userType, "h-4 w-4")}
                    Iniciar sesión como {getUserTypeLabel(userType)}
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Enlace de olvidé contraseña */}
          <div className="text-center mt-4">
            <button 
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Línea divisoria */}
          <div className="my-4 border-t border-gray-300"></div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-600">Universidad de Medellín - EntreAulas</p>
          </div>
        </Card>

        {/* Modal de Selección de Rol */}
        <AnimatePresence>
          {showRoleSelection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <FaUserCheck className="h-12 w-12 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Selecciona tu Rol</h2>
                  <p className="text-gray-600 mt-2">
                    Hola <span className="font-semibold">{userInfo?.name}</span>, 
                    tienes múltiples roles disponibles. Selecciona con cuál deseas iniciar sesión:
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelection(role)}
                      className={`w-full p-4 border rounded-lg text-left transition-colors ${
                        selectedRole === role
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-red-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-red-600">
                          {getRoleIcon(role, "h-5 w-5")}
                        </span>
                        <div>
                          <div className="font-medium">{getRoleLabel(role)}</div>
                          <div className="text-sm text-gray-500">
                            {role === 'profesor' || role === 'docente' 
                              ? 'Acceso al dashboard de docentes'
                              : role === 'coordinador'
                              ? 'Acceso al dashboard de coordinadores'
                              : role === 'estudiante'
                              ? 'Acceso al dashboard de estudiantes'
                              : 'Acceso administrativo'
                            }
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleBackToLogin}
                    className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedRole || isLoading}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? 'Iniciando...' : 'Continuar'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, AuthResponse } from '../api/auth'
import { getDashboardPathForUser as getDashboardPathForUserFromModule } from '../features/auth/dashboard-path'

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  tipo_usuario: string
  user_type?: string
  user_role?: string
  dashboard?: string
  permissions?: string[]
  role_description?: string
  roles?: string[] // Roles múltiples
  multiple_roles?: boolean
  selected_role?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, expectedUserType?: string) => Promise<AuthResponse | void>
  loginWithRole: (email: string, password: string, selectedRole: string) => Promise<void>
  register: (data: {
    email: string
    nombre: string
    apellido: string
    tipo_usuario: 'estudiante' | 'profesor' | 'coordinador' | 'admin'
    password: string
  }) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  getDashboardPath: () => string
  /** Calcula la ruta del dashboard para un usuario (p. ej. el de la respuesta de login). */
  getDashboardPathForUser: (user: User) => string
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  switchUserRole: (newRole: 'coordinador' | 'profesor') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado al cargar la app
    const savedUser = authApi.getCurrentUser()
    if (savedUser && authApi.isAuthenticated()) {
      setUser(savedUser)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, expectedUserType?: string): Promise<AuthResponse | void> => {
    try {
      const response: AuthResponse = await authApi.login({ email, password })
      
      // Verificar que el usuario tiene el rol apropiado (si se especifica)
      if (expectedUserType) {
        const actualUserType = response.user.tipo_usuario
        const userRoles = response.user.roles || []
        
        // Mapear tipos de frontend a backend
        const typeMapping: { [key: string]: string[] } = {
          'student': ['estudiante'],
          'teacher': ['profesor', 'docente'],
          'coordinator': ['coordinador'],
          'decano': ['decano'],
          'admin': ['admin']
        }
        
        const expectedRoles = typeMapping[expectedUserType] || []
        const hasExpectedRole = expectedRoles.some(role => 
          role === actualUserType || userRoles.includes(role)
        )
        
        if (!hasExpectedRole) {
          throw new Error(`El tipo de usuario seleccionado (${expectedUserType}) no coincide con los roles del usuario en el sistema (${actualUserType}, roles: ${userRoles.join(', ')})`)
        }
      }
      
      // Si la respuesta indica que se requiere selección de rol, devolver la respuesta
      if (response.requires_role_selection) {
        return response
      }
      
      // Guardar token y usuario (incluye coordinador.carrera_id si viene)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      return response
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const loginWithRole = async (email: string, password: string, selectedRole: string) => {
    try {
      const response: AuthResponse = await authApi.loginWithRole({ email, password, selectedRole })
      
      // Guardar token y usuario
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
    } catch (error) {
      console.error('Error en login con rol:', error)
      throw error
    }
  }

  const register = async (data: {
    email: string
    nombre: string
    apellido: string
    tipo_usuario: 'estudiante' | 'profesor' | 'coordinador' | 'admin'
    password: string
  }) => {
    try {
      const response: AuthResponse = await authApi.register(data)
      
      // Guardar token y usuario
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  }

  const logout = () => {
    try {
      // Limpiar storage primero para evitar estados inconsistentes del avatar
      authApi.logout()
    } finally {
      setUser(null)
      // Forzar navegación al login
      try {
        window.location.href = '/login'
      } catch {}
    }
  }

  const getDashboardPath = () => {
    if (!user) return '/login'
    return getDashboardPathForUser(user)
  }

  const getDashboardPathForUser = (u: User) => getDashboardPathForUserFromModule(u)

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    if (!user) return false
    const normalize = (r?: string) => (r || '').toLowerCase()
    const synonyms: Record<string, string[]> = {
      coordinador: ['coordinador', 'coordinator'],
      profesor: ['profesor', 'docente', 'teacher'],
      estudiante: ['estudiante', 'student'],
      decano: ['decano', 'dean'],
      admin: ['admin', 'administrator']
    }
    const matches = (target: string, candidate?: string) => {
      const t = normalize(target)
      const c = normalize(candidate)
      return t === c || (synonyms[t] && synonyms[t].includes(c))
    }
    // Preferir el rol activo/seleccionado si existe
    if (matches(role, user.selected_role)) return true
    if (matches(role, user.tipo_usuario)) return true
    // Solo considerar lista de roles si realmente el usuario tiene múltiples roles
    if (user.multiple_roles || (user.roles && user.roles.length > 1)) {
      return (user.roles || []).some(r => matches(role, r))
    }
    return false
  }

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return user.permissions?.includes('all') || user.permissions?.includes(permission) || false
  }

  // Función para cambiar temporalmente el rol del usuario
  const switchUserRole = (newRole: 'coordinador' | 'profesor'): void => {
    if (!user) return
    
    console.log('🔄 Cambiando rol del usuario de', user.tipo_usuario, 'a', newRole)
    
    // Crear una copia del usuario con el nuevo rol temporal
    const updatedUser = {
      ...user,
      tipo_usuario: newRole,
      // Mantener sincronizado con la UI que usa selected_role como preferencia
      selected_role: newRole,
      // Mantener los roles originales para poder volver
      original_tipo_usuario: user.tipo_usuario
    }
    
    setUser(updatedUser)
    
    // Guardar en localStorage para persistir el cambio
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    console.log('✅ Rol cambiado exitosamente a', newRole)
  }

  const value: AuthContextType = {
    user,
    login,
    loginWithRole,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    getDashboardPath,
    getDashboardPathForUser,
    hasRole,
    hasPermission,
    switchUserRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}



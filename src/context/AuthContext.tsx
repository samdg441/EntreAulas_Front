import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, AuthResponse } from '../api/auth'
import {
  getDashboardPathForUser as getDashboardPathForUserFromModule,
  usuarioTieneRol,
} from '../features/auth/dashboard-path'
import { RoleMismatchError } from '../features/auth/errors'
import { getRoleLabel, resolverRolDeIngreso, rolesDeLaRespuesta } from '../features/auth/login-flow'
import { authStorage } from '../lib/storage'

export interface User {
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

  const guardarSesion = (sesion: AuthResponse) => {
    authStorage.setToken(sesion.token)
    authStorage.setUser(sesion.user)
    setUser(sesion.user)
  }

  const login = async (email: string, password: string, expectedUserType?: string): Promise<AuthResponse | void> => {
    const response: AuthResponse = await authApi.login({ email, password })
    const rolesDisponibles = rolesDeLaRespuesta(response)

    if (expectedUserType) {
      const rolElegido = resolverRolDeIngreso(expectedUserType, rolesDisponibles)

      if (!rolElegido) {
        const etiquetas = rolesDisponibles.map(getRoleLabel)
        const lista = etiquetas.length ? etiquetas.join(' o ') : 'el tipo que corresponde a tu cuenta'
        throw new RoleMismatchError(
          `El tipo de usuario seleccionado no coincide con tu cuenta. Por favor, selecciona ${lista} e intenta de nuevo.`
        )
      }

      // La cuenta tiene varios roles, pero el tipo del formulario ya define la sesión.
      if (response.requires_role_selection) {
        const sesion = await authApi.loginWithRole({ email, password, selectedRole: rolElegido })
        guardarSesion(sesion)
        return sesion
      }
    } else if (response.requires_role_selection) {
      return response
    }

    guardarSesion(response)
    return response
  }

  const loginWithRole = async (email: string, password: string, selectedRole: string) => {
    const response: AuthResponse = await authApi.loginWithRole({ email, password, selectedRole })

    authStorage.setToken(response.token)
    authStorage.setUser(response.user)

    setUser(response.user)
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
  const hasRole = (role: string): boolean => usuarioTieneRol(user, role)

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return user.permissions?.includes('all') || user.permissions?.includes(permission) || false
  }

  // Función para cambiar temporalmente el rol del usuario
  const switchUserRole = (newRole: 'coordinador' | 'profesor'): void => {
    if (!user) return

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
    authStorage.setUser(updatedUser)
  }

  const value: AuthContextType = {
    user,
    login,
    loginWithRole,
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



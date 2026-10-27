import { apiClient } from './client'
import { authStorage } from '../lib/storage'

export interface LoginData {
  email: string
  password: string
}

export interface LoginWithRoleData {
  email: string
  password: string
  selectedRole: string
}

export interface AuthResponse {
  message?: string
  token: string
  /** Segundos Unix del claim `exp`. La sesión dura 3 horas. */
  exp?: number
  expiresAt?: string
  user: {
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
    roles?: string[]
    selected_role?: string
    multiple_roles?: boolean
  }
  available_roles?: string[]
  requires_role_selection?: boolean
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', data)
    return response.data
  },

  loginWithRole: async (data: LoginWithRoleData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login-with-role', data)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token_expires_at')
  },

  /** Nuevo access token de 3 horas. Requiere que el actual siga vigente. */
  refresh: async () => {
    const response = await apiClient.post('/api/auth/refresh')
    const data = response.data as { token: string; exp: number; expiresAt: string }
    authStorage.setToken(data.token)
    if (data.expiresAt) localStorage.setItem('token_expires_at', data.expiresAt)
    return data
  },

  getCurrentUser: () => authStorage.getUser<any>(),

  getToken: () => {
    return localStorage.getItem('token')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  /** Perfil vía middleware JWT (`GET /api/auth/profile`). */
  getProfile: async () => {
    const { data } = await apiClient.get('/api/auth/profile')
    return data
  }
}



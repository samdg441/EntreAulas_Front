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



import { apiClient } from './client'

export interface UserSummary {
  id: string
  email: string
  nombre: string
  apellido: string
  tipo_usuario: string
  activo: boolean
  created_at?: string
}

export const usersApi = {
  list: async (): Promise<{ users: UserSummary[] }> => {
    const { data } = await apiClient.get<{ users: UserSummary[] }>('/api/users')
    return data
  }
}

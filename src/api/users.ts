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

export interface CreateUserPayload {
  email: string
  password: string
  nombre: string
  apellido: string
  tipo_usuario: string
  codigo_profesor?: string
  departamento?: string
  codigo_estudiante?: string
  carrera_id?: number
  semestre?: number
}

export interface UpdateUserPayload {
  email?: string
  nombre?: string
  apellido?: string
  tipo_usuario?: string
  activo?: boolean
  password?: string
}

export interface FacultadConCarreras {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  carreras: Array<{
    id: number
    nombre: string
    codigo?: string
    facultad_id?: number
    activa?: boolean
  }>
}

export interface GrupoConProfesor {
  id: number
  cursoNombre: string
  cursoCodigo: string
  grupo: string
  profesorNombre: string
}

export const usersApi = {
  list: async (): Promise<{ users: UserSummary[] }> => {
    const { data } = await apiClient.get<{ users: UserSummary[] }>('/api/users')
    return data
  },

  create: async (payload: CreateUserPayload) => {
    const { data } = await apiClient.post('/api/auth/create-user', payload)
    return data
  },

  update: async (id: string, payload: UpdateUserPayload) => {
    const { data } = await apiClient.put(`/api/users/${id}`, payload)
    return data
  },

  deactivate: async (id: string) => {
    const { data } = await apiClient.delete(`/api/users/${id}`)
    return data
  },

  academicStructure: async (): Promise<{ facultades: FacultadConCarreras[] }> => {
    const { data } = await apiClient.get<{ facultades: FacultadConCarreras[] }>(
      '/api/users/academic-structure'
    )
    return data
  },

  gruposByCareer: async (careerId: number): Promise<GrupoConProfesor[]> => {
    const { data } = await apiClient.get<GrupoConProfesor[]>(
      `/api/users/grupos-by-career/${careerId}`
    )
    return data
  },
}

import { apiClient } from './client'

export interface SurveyCategory {
  id: number
  nombre: string
  descripcion?: string
  orden?: number
}

export interface SurveyQuestion {
  id: number
  categoria_id: number
  texto_pregunta: string
  descripcion?: string
  tipo_pregunta: string
  obligatoria: boolean
  orden: number
  activa: boolean
  id_carrera?: number | null
  categoria?: { id: number; nombre: string }
}

export interface CreateSurveyQuestionPayload {
  categoria_id: number
  texto_pregunta: string
  descripcion?: string
  tipo_pregunta: string
  obligatoria?: boolean
  orden: number
  id_carrera?: number | null
}

export const surveysApi = {
  listCategories: async (): Promise<SurveyCategory[]> => {
    const { data } = await apiClient.get<{ categories: SurveyCategory[] }>(
      '/api/evaluations/categories'
    )
    return data.categories || []
  },

  listQuestions: async (): Promise<SurveyQuestion[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: SurveyQuestion[] }>(
      '/api/evaluations/questions'
    )
    return data.data || []
  },

  createQuestion: async (payload: CreateSurveyQuestionPayload) => {
    const { data } = await apiClient.post('/api/evaluations/questions', payload)
    return data
  },

  deactivateQuestion: async (id: number) => {
    const { data } = await apiClient.delete(`/api/evaluations/questions/${id}`)
    return data
  },
}

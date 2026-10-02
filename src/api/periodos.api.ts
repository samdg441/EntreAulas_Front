import { apiClient } from './client'

export interface VentanaEvaluacion {
  periodoId: number
  ano: number
  semestre: number
  fechaInicio: string
  fechaFin: string
}

/** Guarda las fechas de evaluación de un período existente ("2026-1"). */
export async function guardarVentanaEvaluacion(datos: {
  periodo: string
  fechaInicio: string
  fechaFin: string
}): Promise<VentanaEvaluacion> {
  const response = await apiClient.put<VentanaEvaluacion>('/api/periodos/evaluacion', datos)
  return response.data
}

export async function getVentanasEvaluacion(): Promise<VentanaEvaluacion[]> {
  const response = await apiClient.get<VentanaEvaluacion[]>('/api/periodos/evaluacion')
  return Array.isArray(response.data) ? response.data : []
}

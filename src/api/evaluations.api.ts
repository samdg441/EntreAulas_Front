import { apiClient } from './client'

/** Datos del QR de evaluación (`GET /api/qr-evaluaciones/:token`). */
export async function getQrEvaluation(token: string) {
  const resp = await apiClient.get(`/api/qr-evaluaciones/${token}`)
  return resp.data
}

/** Auto-matrícula del estudiante en el grupo del QR. */
export async function autoEnrollQrEvaluation(token: string) {
  const resp = await apiClient.post(`/api/qr-evaluaciones/${token}/auto-enroll`)
  return resp.data
}

/** Genera tokens QR en lote para grupos. */
export async function createQrEvaluationsBatch(grupoIds: number[]) {
  const resp = await apiClient.post('/api/qr-evaluaciones/batch', { grupoIds })
  return resp.data as {
    created?: Array<{ grupoId: number; token: string }>
    skipped?: Array<{ grupoId: number; reason: string }>
  }
}

/** Comparte QRs por correo. */
export async function shareQrEvaluationsEmail(payload: {
  to: string
  subject: string
  message: string
  grupoIds: number[]
}) {
  const resp = await apiClient.post('/api/qr-evaluaciones/share-email', payload)
  return resp.data
}

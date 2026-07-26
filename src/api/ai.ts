import { apiClient } from './client'

export type AiSummaryResponse = {
  summary: string
  topics: string[]
}

export async function summarizeOpenResponses(texts: string[]): Promise<AiSummaryResponse> {
  const { data } = await apiClient.post('/api/ai/summarize', { texts })
  return data
}




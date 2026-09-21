interface ApiErrorLike {
  response?: {
    data?: {
      error?: string
      message?: string
    }
  }
}

function hasResponseData(error: unknown): error is ApiErrorLike {
  return typeof error === 'object' && error !== null && 'response' in error
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!hasResponseData(error)) return fallback
  const data = error.response?.data
  return data?.error || data?.message || fallback
}

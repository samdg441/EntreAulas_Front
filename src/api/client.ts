import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token JWT a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor: 401 = no autenticado → limpiar sesión y login. 403 = prohibido (rol), no limpiar token.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const path = window.location.pathname || ''
      const publicPaths = ['/login', '/forgot-password', '/qr-evaluacion']
      const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + '/'))
      if (!isPublic) {
        window.location.href = '/login'
      }
    }

    if (status === 403) {
      // Permisos insuficientes: la vista puede redirigir a /forbidden
      console.warn('403 — permisos insuficientes:', error.response?.data)
    }

    return Promise.reject(error)
  }
)

export default apiClient



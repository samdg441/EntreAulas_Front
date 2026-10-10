import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { apiClient } from '../../api/client'

export type PeticionRegistrada = {
  metodo: string
  url: string
  query: Record<string, string>
  body: unknown
  authorization: string | undefined
}

type Respuesta = { status: number; data?: unknown } | { error: 'timeout' | 'red' }
type Manejador = (peticion: PeticionRegistrada) => Respuesta

function separarUrl(config: InternalAxiosRequestConfig) {
  const url = new URL(config.url ?? '', 'http://api.falsa')
  return { ruta: url.pathname, query: Object.fromEntries(url.searchParams) }
}

function leerBody(data: unknown) {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

/**
 * Reemplaza el adaptador HTTP de `apiClient`: las peticiones pasan por los
 * interceptores reales (token, 401, 403) pero nunca salen a la red.
 */
export function montarApiFalsa(responder: Manejador) {
  const peticiones: PeticionRegistrada[] = []
  const adaptadorOriginal = apiClient.defaults.adapter

  const adaptador: AxiosAdapter = async (config) => {
    const { ruta, query } = separarUrl(config)
    const peticion: PeticionRegistrada = {
      metodo: (config.method ?? 'get').toUpperCase(),
      url: ruta,
      query,
      body: leerBody(config.data),
      authorization: config.headers?.Authorization as string | undefined,
    }
    peticiones.push(peticion)

    const respuesta = responder(peticion)
    if ('error' in respuesta) {
      const code = respuesta.error === 'timeout' ? AxiosError.ECONNABORTED : AxiosError.ERR_NETWORK
      throw new AxiosError(`fallo simulado: ${respuesta.error}`, code, config)
    }

    const response = { data: respuesta.data, status: respuesta.status, statusText: '', headers: {}, config }
    if (respuesta.status >= 400) {
      throw new AxiosError(`HTTP ${respuesta.status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    }
    return response
  }

  apiClient.defaults.adapter = adaptador
  return {
    peticiones,
    restaurar: () => {
      apiClient.defaults.adapter = adaptadorOriginal
    },
  }
}

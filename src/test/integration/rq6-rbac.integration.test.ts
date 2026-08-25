import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { apiClient } from '../../api/client'

function rejectStatus(status: number) {
  apiClient.defaults.adapter = async (config) => {
    throw {
      message: `HTTP ${status}`,
      isAxiosError: true,
      config,
      response: {
        status,
        data: { error: `status ${status}` },
        config,
        headers: {},
        statusText: '',
      },
    }
  }
}

/** RQ6 integración: interceptor 401 limpia sesión (403 → DEF-21). */
describe('RQ6 integration — interceptor apiClient', () => {
  const originalAdapter = apiClient.defaults.adapter
  let href = ''

  beforeEach(() => {
    localStorage.setItem('token', 'jwt-ok')
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }))
    href = ''
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/admin/qr',
        get href() {
          return href
        },
        set href(v: string) {
          href = v
        },
      },
    })
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('C1: 401 limpia sesión y redirige a /login', async () => {
    rejectStatus(401)
    await expect(apiClient.get('/api/protegido')).rejects.toBeTruthy()
    expect(localStorage.getItem('token')).toBeNull()
    expect(href).toContain('/login')
  })

  it('C3: 2xx no altera sesión', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config as InternalAxiosRequestConfig,
    })
    const res = await apiClient.get('/api/ok')
    expect(res.status).toBe(200)
    expect(localStorage.getItem('token')).toBe('jwt-ok')
    expect(href).toBe('')
  })
})

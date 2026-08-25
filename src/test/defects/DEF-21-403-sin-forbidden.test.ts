/**
 * DEF-21 — 403 no redirige a /forbidden (RQ6, integración Front)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * El diagrama de integración AUTH-06 indica 403 → /forbidden.
 * `client.ts` solo hace `console.warn` y no cambia `window.location`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../../api/client'

describe('DEF-21 — Un 403 debe llevar a /forbidden', () => {
  const originalAdapter = apiClient.defaults.adapter
  let href = ''

  beforeEach(() => {
    localStorage.setItem('token', 'jwt-ok')
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

  it('403 redirige a /forbidden y conserva el token', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw {
        message: 'HTTP 403',
        isAxiosError: true,
        config,
        response: {
          status: 403,
          data: { code: 'FORBIDDEN_ROLE' },
          config,
          headers: {},
          statusText: '',
        },
      }
    }

    await expect(apiClient.get('/api/protegido')).rejects.toBeTruthy()
    expect(href).toContain('/forbidden')
    expect(localStorage.getItem('token')).toBe('jwt-ok')
  })
})

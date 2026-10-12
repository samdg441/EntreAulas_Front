/**
 * DEF-FE-05 — El despliegue estático no envía cabeceras de seguridad ni compresión (RQ2/RQ3/RQ5)
 *
 * Severidad: Media | Estado: ABIERTO
 *
 * `nginx.conf` (imagen Docker/Jenkins) y `vercel.json` solo definen caché. Faltan:
 *   - Content-Security-Policy: sin ella un XSS puede leer el JWT de localStorage y enviarlo fuera.
 *   - X-Frame-Options / frame-ancestors: la pantalla de login puede incrustarse (clickjacking).
 *   - X-Content-Type-Options: nosniff.
 *   - Referrer-Policy: el enlace de recuperación lleva el token y el correo en la URL; sin la política
 *     el token puede filtrarse en la cabecera Referer hacia recursos externos.
 *   - Strict-Transport-Security (HSTS).
 *   - gzip: el bundle principal (~1,9 MB) viaja sin comprimir desde nginx.
 *   - server_tokens off: nginx anuncia su versión.
 *
 * Estas pruebas leen los archivos de despliegue y expresan lo CORRECTO; fallan a propósito.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const leer = (archivo: string) => readFileSync(path.resolve(process.cwd(), archivo), 'utf8')
const nginx = leer('nginx.conf')
const vercel = JSON.parse(leer('vercel.json')) as { headers?: { source: string; headers: { key: string; value: string }[] }[] }
const cabecerasVercel = (vercel.headers ?? []).flatMap((h) => h.headers.map((c) => c.key.toLowerCase()))
const index = leer('index.html')

const cabecerasRequeridas = [
  ['content-security-policy', /add_header\s+Content-Security-Policy/i],
  ['x-content-type-options', /add_header\s+X-Content-Type-Options/i],
  ['x-frame-options (o frame-ancestors)', /add_header\s+(X-Frame-Options|Content-Security-Policy[^;]*frame-ancestors)/i],
  ['referrer-policy', /add_header\s+Referrer-Policy/i],
  ['strict-transport-security', /add_header\s+Strict-Transport-Security/i],
] as const

describe('DEF-FE-05 — nginx.conf', () => {
  it.each(cabecerasRequeridas)('envía %s', (_nombre, patron) => {
    expect(nginx).toMatch(patron)
  })

  it('comprime las respuestas (gzip on)', () => {
    expect(nginx).toMatch(/gzip\s+on/)
  })

  it('oculta la versión de nginx (server_tokens off)', () => {
    expect(nginx).toMatch(/server_tokens\s+off/)
  })
})

describe('DEF-FE-05 — vercel.json', () => {
  it.each(['content-security-policy', 'x-content-type-options', 'referrer-policy', 'x-frame-options', 'strict-transport-security'])('envía %s', (cabecera) => {
    expect(cabecerasVercel).toContain(cabecera)
  })
})

describe('DEF-FE-05 — index.html', () => {
  it('declara una política de contenido (meta CSP) como defensa mínima si el servidor no la envía', () => {
    expect(index).toMatch(/http-equiv=["']Content-Security-Policy["']/i)
  })
})

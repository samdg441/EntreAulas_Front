export const apiUrl = () => String(Cypress.expose('apiUrl')).replace(/\/$/, '')

let token = ''

/**
 * Carga el JWT del coordinador (secreto CYPRESS_TOKEN_COORDINADOR) para usarlo en la suite.
 * Si no está definido, omite la suite en vez de fallar.
 */
export function cargarTokenCoordinadorOSaltar(contexto: Mocha.Context) {
  cy.env(['TOKEN_COORDINADOR'], { log: false }).then(({ TOKEN_COORDINADOR }) => {
    token = String(TOKEN_COORDINADOR ?? '')
    if (!token) contexto.skip()
  })
}

export function pedir(ruta: string, opciones: Partial<Cypress.RequestOptions> = {}) {
  return cy.request({ url: `${apiUrl()}${ruta}`, failOnStatusCode: false, timeout: 60_000, ...opciones })
}

export function pedirComoCoordinador(ruta: string, opciones: Partial<Cypress.RequestOptions> = {}) {
  return pedir(ruta, { ...opciones, headers: { Authorization: `Bearer ${token}`, ...opciones.headers }, log: false })
}

const base64url = (texto: string) => btoa(texto).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

/** JWT con alg "none": sin firma. Un back vulnerable lo aceptaría como válido. */
export function jwtSinFirma(payload: Record<string, unknown>) {
  return `${base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${base64url(JSON.stringify(payload))}.`
}

/** JWT HS256 firmado con una clave que no es la del back. */
export async function jwtConOtraClave(payload: Record<string, unknown>) {
  const cabecera = `${base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64url(JSON.stringify(payload))}`
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode('clave-del-atacante'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cabecera)))
  return `${cabecera}.${base64url(String.fromCharCode(...firma))}`
}

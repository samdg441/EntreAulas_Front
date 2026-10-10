import { readFileSync } from 'node:fs'

/** Front servido por Vite (lo levanta `npm test` con start-server-and-test). */
export const frontUrl = () => (process.env.FRONT_URL || 'http://localhost:3001').replace(/\/$/, '')

/** Back real para los escenarios @api: Render por defecto o el back local. */
export const apiUrl = () => (process.env.API_URL || 'https://entreaulas-back.onrender.com').replace(/\/$/, '')

/**
 * JWT de un coordinador para los escenarios @con-token. Se lee de un archivo (TOKEN_FILE)
 * para que no quede en el historial de la terminal ni en los logs.
 */
export function tokenCoordinador(): string {
  return process.env.TOKEN_FILE ? readFileSync(process.env.TOKEN_FILE, 'utf8').trim() : ''
}

/**
 * E2E (ISTQB: pruebas de sistema / aceptación).
 * Reservado para flujos completos de usuario (Playwright/Cypress).
 * No se ejecutan con `npm test` (Vitest unit/integration).
 *
 * Ejemplo futuro:
 *   npx playwright test src/test/e2e
 */
import { describe, it, expect } from 'vitest'

describe.skip('E2E — marcador (pendiente de runner E2E)', () => {
  it('flujo login → dashboard según rol', () => {
    expect(true).toBe(true)
  })
})

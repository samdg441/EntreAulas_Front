import { test, expect } from './fixtures/back-simulado'

/** Semilla de los agentes: deja el front abierto en /login con el back simulado instalado. */
test.describe('Semilla', () => {
  test('seed', async ({ page, back }) => {
    expect(back.cuentas.length).toBeGreaterThan(0)
    await page.goto('/login')
  })
})

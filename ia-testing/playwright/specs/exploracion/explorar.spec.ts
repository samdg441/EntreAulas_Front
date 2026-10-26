import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { test, CUENTAS } from '../../fixtures/back-simulado'

/**
 * Paso «planner» de los agentes de Playwright: recorre las pantallas de RQ1–RQ5 y guarda el snapshot
 * de accesibilidad (ARIA) que el agente usa para descubrir elementos y flujos. Se ejecuta con:
 *   npx playwright test specs/exploracion --config playwright.exploracion.config.ts
 */
const guardar = (nombre: string, snapshot: string) => writeFileSync(path.join(__dirname, `${nombre}.aria.yml`), snapshot)

test('explorar pantallas de RQ1–RQ5', async ({ page, back }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /Iniciar sesión como/ }).waitFor()
  guardar('rq2-login', await page.locator('body').ariaSnapshot())

  await page.getByRole('button', { name: 'Estudiante' }).first().click()
  guardar('rq2-login-selector-tipo', await page.locator('form').ariaSnapshot())

  await page.goto('/forgot-password')
  await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).waitFor()
  guardar('rq3-1-forgot-password', await page.locator('body').ariaSnapshot())

  const enlace = back.emitirToken(CUENTAS.estudiante.email)
  await page.goto(enlace)
  await page.getByRole('button', { name: 'Actualizar contraseña' }).waitFor()
  guardar('rq3-2-rq5-reset-password', await page.locator('body').ariaSnapshot())

  await page.goto('/reset-password')
  await page.getByText('inválido o está incompleto').waitFor()
  guardar('rq3-2-enlace-incompleto', await page.locator('body').ariaSnapshot())

  await back.sesionDe(page, CUENTAS.admin)
  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'Agregar usuario' }).click()
  await page.getByRole('heading', { name: 'Agregar usuario' }).waitFor()
  guardar('rq1-alta-usuario', await page.locator('form').ariaSnapshot())
})

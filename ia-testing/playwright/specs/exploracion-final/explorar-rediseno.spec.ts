import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from '../../fixtures/back-coordinador'

/**
 * Paso «planner» de los agentes de Playwright para el rediseño: recorre las pantallas nuevas del coordinador
 * y guarda el árbol de accesibilidad (ARIA) que el agente usa para descubrir elementos y flujos.
 *   npx playwright test specs/exploracion-final --config playwright.exploracion-final.config.ts
 */
const guardar = (nombre: string, snapshot: string) => writeFileSync(path.join(__dirname, `${nombre}.aria.yml`), snapshot)

test('explorar el panel rediseñado del coordinador', async ({ page, back }) => {
  void back
  await page.goto('/dashboard-coordinador')
  await page.getByRole('heading', { name: /Buen/ }).waitFor()
  await page.getByText('Periodo 2026-2').waitFor()
  guardar('dashboard-coordinador', await page.locator('body').ariaSnapshot())

  await page.getByRole('button', { name: 'Preferencias de visualización' }).click()
  guardar('preferencias', await page.getByRole('dialog').ariaSnapshot())
  await page.keyboard.press('Escape')

  await page.goto('/profesores/gestionar?profesor=2')
  await page.getByRole('heading', { name: 'Carlos Restrepo' }).waitFor()
  await page.getByText('Promedio por categoría').waitFor()
  guardar('gestion-profesores', await page.locator('main').ariaSnapshot())

  await page.goto('/auditoria')
  await page.getByRole('table').waitFor()
  guardar('auditoria', await page.locator('main').ariaSnapshot())
})

// Mantenido en la suite de Playwright que los agentes de IA generaron para el resto de requisitos.
// seed: el back simulado de fixtures/back-simulado.ts
import { test, expect, CUENTAS } from '../fixtures/back-simulado'

test.describe('RF-REP-25, RF-REP-26 y RF-IA-32', () => {
  test('el profesor ve su promedio y el aviso de la encuesta', async ({ page, back }) => {
    await back.sesionDe(page, CUENTAS.profesor)
    await page.goto('/dashboard-profesor')
    await expect(page.getByText('Calificación Promedio')).toBeVisible()
    await expect(page.getByText('4/5.0')).toBeVisible()
    await expect(page.getByText('99/5.0')).toHaveCount(0)

    await page.goto('/reports/survey-results')
    await expect(page.getByRole('alert')).toContainText('Faltan parámetros requeridos')
  })

  test('el profesor genera el resumen y un estudiante no entra', async ({ page, back }) => {
    await back.sesionDe(page, CUENTAS.profesor)
    await page.goto('/reports')
    await page.getByRole('button', { name: 'Generar resumen IA' }).click()
    await expect(page.getByText('Los estudiantes destacan la claridad.')).toBeVisible()

    await back.sesionDe(page, CUENTAS.estudiante)
    await page.goto('/reports')
    await expect(page).toHaveURL(/\/forbidden$/)
  })
})

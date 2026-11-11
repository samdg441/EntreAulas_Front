// spec: specs/plan-rediseno.md — 2. Gestión de profesores
import { test, expect } from '../fixtures/back-coordinador'

const lista = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Docentes' })

test.describe('Gestión de profesores', () => {
  test('2.1 lista a los docentes con promedio y los chips muestran los conteos', async ({ page }) => {
    await page.goto('/profesores/gestionar')

    await expect(lista(page).getByRole('button', { name: /Ana María Pérez/ })).toContainText('4.60')
    await expect(page.getByRole('radio', { name: /Todos \(6\)/ })).toBeChecked()
    await expect(page.getByRole('radio', { name: /En riesgo \(2\)/ })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Sin evaluaciones \(1\)/ })).toBeVisible()
  })

  test('2.2 elegir un docente carga sus estadísticas del periodo', async ({ page, back }) => {
    await page.goto('/profesores/gestionar')
    await lista(page).getByRole('button', { name: /Carlos Restrepo/ }).click()

    await expect(page.getByRole('heading', { name: 'Carlos Restrepo' })).toBeVisible()
    await expect(page.getByText('Promedio por categoría')).toBeVisible()
    await expect(page.getByText('SIS101 · Programación I')).toBeVisible()
    expect(back.llamadas.at(-1)?.query).toContain('period=2026-1')
    await expect(page.getByText('Promedio inferior a 4.0: conviene revisar los comentarios.')).toBeVisible()
  })

  test('2.3 el filtro "En riesgo" deja solo a quienes tienen promedio menor a 4.0', async ({ page }) => {
    await page.goto('/profesores/gestionar')
    await page.getByRole('radio', { name: /En riesgo/ }).click()

    await expect(lista(page).getByRole('button')).toHaveCount(2)
    await expect(lista(page).getByRole('button', { name: /Carlos Restrepo/ })).toBeVisible()
    await expect(lista(page).getByRole('button', { name: /Ana María Pérez/ })).toHaveCount(0)
  })

  test('2.3b ordenar por promedio (menor primero) pone al final a quien no tiene evaluaciones', async ({ page }) => {
    await page.goto('/profesores/gestionar')
    await page.getByLabel('Ordenar por').selectOption({ label: 'Promedio (menor primero)' })

    const botones = lista(page).getByRole('button')
    await expect(botones.first()).toContainText('Carlos Restrepo')
    await expect(botones.last()).toContainText('Jorge Ríos')
  })

  test('2.4 una búsqueda sin resultados muestra el estado vacío con ayuda', async ({ page }) => {
    await page.goto('/profesores/gestionar')
    await page.getByRole('searchbox', { name: 'Buscar por nombre o correo' }).fill('zzzz')

    await expect(page.getByText('Ningún docente coincide con tu búsqueda.')).toBeVisible()
    await expect(page.getByText('Prueba con otro nombre o quita los filtros.')).toBeVisible()
  })

  test('2.5 en móvil la lista y el detalle se alternan con "Volver a la lista"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/profesores/gestionar')
    await lista(page).getByRole('button', { name: /Ana María Pérez/ }).click()

    await expect(page.getByRole('heading', { name: 'Ana María Pérez' })).toBeVisible()
    await expect(lista(page)).toBeHidden()
    await page.getByRole('button', { name: 'Volver a la lista' }).click()
    await expect(lista(page)).toBeVisible()
  })

  test('2.6 el enlace desde el dashboard abre directamente el detalle (?profesor=)', async ({ page }) => {
    await page.goto('/dashboard-coordinador')
    await page.getByRole('link', { name: 'Ver detalle: Esteban Cárdenas' }).click()

    await expect(page).toHaveURL(/\/profesores\/gestionar\?profesor=6/)
    await expect(page.getByRole('heading', { name: 'Esteban Cárdenas' })).toBeVisible()
  })
})

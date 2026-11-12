// spec: specs/plan-rediseno.md — 3. Dashboard · 4. Preferencias de accesibilidad
import { test, expect } from '../fixtures/back-coordinador'

const luminancia = ([r, g, b]: number[]) => {
  const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contraste = (a: number[], b: number[]) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const rgb = (css: string) => (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number)

test.describe('Dashboard del coordinador', () => {
  test('3.1 muestra los indicadores y agrupa los accesos en la barra lateral por sección', async ({ page }) => {
    await page.goto('/dashboard-coordinador')
    const nav = page.getByRole('navigation', { name: 'Navegación principal' })

    await expect(page.getByLabel('Indicadores de la carrera')).toContainText('Docentes en riesgo')
    for (const seccion of ['Principal', 'Docentes', 'Encuestas', 'Reportes y resultados', 'Control', 'Mi cuenta']) {
      await expect(nav.getByText(seccion, { exact: true })).toBeVisible()
    }
    await expect(nav.getByRole('link', { name: 'Auditoría' })).toHaveAttribute('href', '/auditoria')
    await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  })

  test('3.2 el calendario marca apertura y cierre y cuenta los días que faltan', async ({ page }) => {
    await page.goto('/dashboard-coordinador')

    await expect(page.getByRole('gridcell', { name: /apertura de la evaluación/ })).toHaveCount(1)
    await expect(page.getByRole('gridcell', { name: /cierre de la evaluación/ })).toHaveCount(1)
    await expect(page.getByText(/Cierra en 11 días/)).toBeVisible()
    await expect(page.getByText(/Abre en 120 días/)).toBeVisible()
  })

  test('3.3 ya no existen las "Acciones rápidas"', async ({ page }) => {
    await page.goto('/dashboard-coordinador')
    await page.getByRole('heading', { name: 'Resumen de docentes' }).waitFor()

    await expect(page.getByText(/Acciones R[aá]pidas/i)).toHaveCount(0)
  })
})

test.describe('Preferencias de accesibilidad', () => {
  const abrir = async (page: import('@playwright/test').Page) => {
    await page.goto('/dashboard-coordinador')
    await page.getByRole('button', { name: 'Preferencias de visualización' }).click()
  }

  test('4.1 modo noche: clase dark, persiste al recargar y el texto principal cumple 4.5:1', async ({ page }) => {
    await abrir(page)
    await page.getByRole('radio', { name: 'Noche' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)

    const colores = await page.getByRole('heading', { level: 1 }).evaluate((h) => ({ texto: getComputedStyle(h).color, fondo: getComputedStyle(document.body).backgroundColor }))
    expect(contraste(rgb(colores.texto), rgb(colores.fondo))).toBeGreaterThanOrEqual(4.5)
  })

  test('4.2 idioma inglés: traduce la interfaz y actualiza lang', async ({ page }) => {
    await abrir(page)
    await page.getByRole('radio', { name: 'Inglés' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('link', { name: 'Teacher management' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Evaluation calendar' })).toBeVisible()
  })

  test('4.3 tamaño de texto: cada nivel cambia el tamaño base', async ({ page }) => {
    await abrir(page)
    const base = () => page.locator('html').evaluate((h) => parseFloat(getComputedStyle(h).fontSize))

    await page.getByRole('radio', { name: 'Muy grande' }).click()
    expect(await base()).toBe(20)
    await page.getByRole('radio', { name: 'Pequeño' }).click()
    expect(await base()).toBe(14)
    await page.getByRole('radio', { name: 'Estándar' }).click()
    expect(await base()).toBe(16)
  })

  test('4.4 teclado: el primer foco es "Saltar al contenido" y lleva a #contenido', async ({ page }) => {
    await page.goto('/dashboard-coordinador')
    await page.getByRole('heading', { name: 'Resumen de docentes' }).waitFor()
    await page.keyboard.press('Tab')

    const salto = page.getByRole('link', { name: 'Saltar al contenido' })
    await expect(salto).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#contenido$/)
  })

  test('4.5 a 320 px con letra muy grande no hay desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.addInitScript(() => localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: 'claro', idioma: 'es', tamano: 'xlarge' })))
    await page.goto('/auditoria')
    await page.getByRole('table').waitFor()

    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(sobra).toBeLessThanOrEqual(1)
  })

  test('4.6 las preferencias manipuladas en localStorage se ignoran sin romper la página', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: '<b>x</b>', idioma: 'fr', tamano: '9999' })))
    await page.goto('/dashboard-coordinador')

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { name: 'Resumen de docentes' })).toBeVisible()
  })
})

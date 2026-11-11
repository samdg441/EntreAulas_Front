// spec: specs/plan-rediseno.md — 1. Vista de auditoría
// seed: fixtures/back-coordinador.ts
import { readFileSync } from 'node:fs'
import { test, expect, COORDINADOR } from '../fixtures/back-coordinador'

test.describe('Auditoría del coordinador', () => {
  test('1.1 muestra 10 de 23 eventos y el resumen por acción', async ({ page, back }) => {
    await page.goto('/auditoria')

    await expect(page.getByRole('heading', { name: 'Auditoría de la carrera', level: 1 })).toBeVisible()
    await expect(page.getByRole('row')).toHaveCount(11) // encabezado + 10
    await expect(page.getByLabel('Eventos por acción')).toContainText('23')
    expect(back.llamadas.some((l) => l.ruta === '/api/coordinador/auditoria')).toBe(true)
  })

  test('1.2 filtrar por acción reduce la tabla y la consulta viaja con ?accion=', async ({ page, back }) => {
    await page.goto('/auditoria')
    await page.getByLabel('Acción', { exact: true }).selectOption('generar_qr')

    await expect(page.getByRole('cell', { name: 'Generó códigos QR' }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Programó una encuesta' })).toHaveCount(0)
    expect(back.llamadas.at(-1)?.query).toContain('accion=generar_qr')
  })

  test('1.3 la búsqueda por persona ignora tildes y mayúsculas', async ({ page }) => {
    await page.goto('/auditoria')
    await page.getByRole('searchbox', { name: 'Buscar por persona o detalle' }).fill('maria gomez')

    const filas = page.getByRole('row').filter({ hasText: 'María Gómez' })
    await expect(filas.first()).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'David Coordinador' })).toHaveCount(0)
  })

  test('1.4 un rango invertido muestra el error y marca el campo', async ({ page }) => {
    await page.goto('/auditoria')
    await page.getByLabel('Desde').fill('2026-11-20')
    await page.getByLabel('Hasta').fill('2026-11-01')

    await expect(page.getByRole('alert')).toHaveText('La fecha inicial no puede ser posterior a la final.')
    await expect(page.getByLabel('Desde')).toHaveAttribute('aria-invalid', 'true')
  })

  test('1.5 la paginación llega a la página 3 con los 3 eventos restantes', async ({ page }) => {
    await page.goto('/auditoria')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()

    await expect(page.getByText('Página 3 de 3')).toBeVisible()
    await expect(page.getByRole('row')).toHaveCount(4)
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  test('1.6 exportar CSV descarga el archivo con encabezado y fórmulas neutralizadas', async ({ page, back }) => {
    back.eventos[0].actorNombre = '=SUMA(1;1)'
    await page.goto('/auditoria')
    await page.getByRole('table').waitFor()

    const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
    const csv = readFileSync(await descarga.path(), 'utf8')

    expect(descarga.suggestedFilename()).toMatch(/^auditoria-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(csv).toContain('Fecha y hora,Persona,Rol,Acción,Detalle')
    expect(csv).toContain("'=SUMA(1;1)")
  })

  test('1.7 si la auditoría aún no está activa lo explica y no muestra la tabla', async ({ page, back }) => {
    back.auditoriaDisponible = false
    await page.goto('/auditoria')

    await expect(page.getByRole('heading', { name: 'La auditoría aún no está activa' })).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
  })

  test('1.8 un estudiante es enviado a /forbidden', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'jwt-estudiante')
      localStorage.setItem('user', JSON.stringify({ id: 'u-e', email: 'e@soyudemedellin.edu.co', nombre: 'E', apellido: 'E', tipo_usuario: 'estudiante', roles: ['estudiante'] }))
    })
    await page.goto('/auditoria')

    await expect(page).toHaveURL(/\/forbidden$/)
  })

  test('1.9 un detalle con HTML se muestra como texto y no se ejecuta (XSS)', async ({ page, back }) => {
    back.eventos[0].detalle = '<img src=x onerror="window.__xss=1">'
    await page.goto('/auditoria')

    await expect(page.getByRole('cell', { name: '<img src=x onerror="window.__xss=1">' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    void COORDINADOR
  })
})

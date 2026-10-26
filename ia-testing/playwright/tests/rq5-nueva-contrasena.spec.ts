// spec: specs/plan-rq1-rq5.md — 5. RQ5 — Nueva contraseña
// seed: seed.spec.ts
import { test, expect, CUENTAS, CLAVE } from '../fixtures/back-simulado'
import type { Page } from '@playwright/test'

const NUEVA = 'ClaveNueva#2027'

async function definirClave(page: Page, nueva: string, confirmacion = nueva) {
  await page.getByRole('textbox', { name: 'Nueva Contraseña', exact: true }).fill(nueva)
  await page.getByRole('textbox', { name: 'Confirmar Nueva Contraseña' }).fill(confirmacion)
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
}

async function login(page: Page, clave: string) {
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Correo Institucional' }).fill(CUENTAS.estudiante.email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(clave)
  await page.getByRole('button', { name: /Iniciar sesión como/ }).click()
}

test.describe('RQ5 — Nueva contraseña', () => {
  let enlace = ''

  test.beforeEach(async ({ page, back }) => {
    enlace = back.emitirToken(CUENTAS.estudiante.email)
    await page.goto(enlace)
    await expect(page.getByRole('button', { name: 'Actualizar contraseña' })).toBeVisible()
  })

  test('Cambio exitoso', async ({ page }) => {
    await definirClave(page, NUEVA)
    await expect(page.getByRole('heading', { name: 'Contraseña actualizada' })).toBeVisible()
    await login(page, CLAVE)
    await expect(page.getByText('Credenciales inválidas')).toBeVisible()
    await login(page, NUEVA)
    await expect(page).toHaveURL(/\/dashboard-estudiante$/)
  })

  test('Enlace de un solo uso', async ({ page }) => {
    await definirClave(page, NUEVA)
    await expect(page.getByRole('heading', { name: 'Contraseña actualizada' })).toBeVisible()
    await page.goto(enlace)
    await expect(page.getByText('Token inválido o ya utilizado')).toBeVisible()
  })

  test('Las contraseñas no coinciden', async ({ page, back }) => {
    await definirClave(page, NUEVA, 'OtraClave#2027')
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
    expect(back.llamadas.filter((l) => l.ruta === '/api/auth/reset-password')).toHaveLength(0)
  })

  for (const [clave, regla] of [
    ['Ab#1', 'al menos 8 caracteres'],
    ['claveminus#1', 'al menos una letra mayúscula'],
    ['CLAVEMAYUS#1', 'al menos una letra minúscula'],
    ['ClaveSinNum#', 'al menos un número'],
    ['ClaveSinEsp1', 'al menos un carácter especial'],
  ]) {
    test(`Política de clave: «${clave}» → ${regla}`, async ({ page }) => {
      await definirClave(page, clave)
      await expect(page.getByText(regla)).toBeVisible()
    })
  }

  test('Mostrar u ocultar contraseña con un botón con nombre accesible (DEF-FE-08)', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Nueva Contraseña', exact: true })
    await campo.fill(NUEVA)
    await expect(campo).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: /mostrar contraseña/i }).first().click()
    await expect(campo).toHaveAttribute('type', 'text')
  })
})

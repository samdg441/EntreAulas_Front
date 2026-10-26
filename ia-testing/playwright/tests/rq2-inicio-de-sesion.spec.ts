// spec: specs/plan-rq1-rq5.md — 1. RQ2 — Inicio de sesión
// seed: seed.spec.ts
import { test, expect, CUENTAS, CLAVE } from '../fixtures/back-simulado'
import type { Page } from '@playwright/test'

async function iniciarSesion(page: Page, correo: string, clave: string, tipo?: string) {
  await page.goto('/login')
  if (tipo) {
    await page.getByRole('button', { name: 'Estudiante' }).first().click()
    await page.getByRole('button', { name: tipo, exact: true }).click()
  }
  await page.getByRole('textbox', { name: /(Correo|Email) Institucional/ }).fill(correo)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(clave)
  await page.getByRole('button', { name: /Iniciar sesión como/ }).click()
}

const token = (page: Page) => page.evaluate(() => localStorage.getItem('token'))

test.describe('RQ2 — Inicio de sesión', () => {
  test('Estudiante inicia sesión y llega a su panel', async ({ page, back }) => {
    // 1-3. Abrir /login, escribir credenciales y enviar
    await iniciarSesion(page, CUENTAS.estudiante.email, CLAVE)
    // Resultado: panel del estudiante y token guardado
    await expect(page).toHaveURL(/\/dashboard-estudiante$/)
    expect(await token(page)).toBe(`jwt-${CUENTAS.estudiante.email}`)
    expect(back.llamadas).toContainEqual({ metodo: 'POST', ruta: '/api/auth/login' })
  })

  test('El profesor elige "Docente" y llega a su panel', async ({ page, back }) => {
    await iniciarSesion(page, CUENTAS.profesor.email, CLAVE, 'Docente')
    await expect(page).toHaveURL(/\/dashboard-profesor$/)
    expect(back.llamadas.length).toBeGreaterThan(0)
  })

  test('Clave incorrecta', async ({ page, back }) => {
    expect(back.cuentas.length).toBeGreaterThan(0)
    await iniciarSesion(page, CUENTAS.estudiante.email, 'Incorrecta#1')
    await expect(page.getByText('Credenciales inválidas')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    expect(await token(page)).toBeNull()
  })

  test('Cuenta inactiva', async ({ page, back }) => {
    expect(back.cuentas.some((c) => c.activo === false)).toBe(true)
    await iniciarSesion(page, CUENTAS.inactivo.email, CLAVE)
    await expect(page.getByText('Credenciales inválidas')).toBeVisible()
    expect(await token(page)).toBeNull()
  })

  test('Tipo de usuario incorrecto', async ({ page, back }) => {
    expect(back.cuentas.length).toBeGreaterThan(0)
    await iniciarSesion(page, CUENTAS.estudiante.email, CLAVE, 'Docente')
    await expect(page.getByText(/no coincide con tu cuenta/)).toBeVisible()
    expect(await token(page)).toBeNull()
  })

  test('Correo con formato inválido', async ({ page, back }) => {
    await iniciarSesion(page, 'correo-sin-arroba', CLAVE)
    await expect(page.getByText('Por favor, ingresa un correo electrónico válido').first()).toBeVisible()
    expect(back.llamadas.filter((l) => l.ruta === '/api/auth/login')).toHaveLength(0)
  })
})

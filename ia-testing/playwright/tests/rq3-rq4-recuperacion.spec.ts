// spec: specs/plan-rq1-rq5.md — 3. RQ3.1/RQ4 — Solicitud del enlace y 4. RQ3.2 — Validación del token
// seed: seed.spec.ts
import { test, expect, CUENTAS, MENSAJE_GENERICO } from '../fixtures/back-simulado'
import type { Page } from '@playwright/test'

async function solicitar(page: Page, correo: string) {
  await page.goto('/forgot-password')
  await page.getByRole('textbox', { name: 'Correo Institucional' }).fill(correo)
  await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
}

test.describe('RQ3.1 / RQ4 — Solicitud del enlace de recuperación', () => {
  test('Correo registrado', async ({ page, back }) => {
    await solicitar(page, CUENTAS.estudiante.email)
    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible()
    await expect(page.getByText(MENSAJE_GENERICO)).toBeVisible()
    expect(back.correos).toHaveLength(1)
    expect(back.correos[0].para).toBe(CUENTAS.estudiante.email)
    expect(back.correos[0].enlace).toMatch(/^\/reset-password\?token=[0-9a-z]{64}&email=/)
  })

  test('Correo no registrado', async ({ page, back }) => {
    await solicitar(page, 'nadie@soyudemedellin.edu.co')
    await expect(page.getByText(MENSAJE_GENERICO)).toBeVisible()
    expect(back.correos).toHaveLength(0)
  })

  test('Formato inválido', async ({ page, back }) => {
    await solicitar(page, 'usuario@dominio')
    await expect(page.getByText('Por favor, ingresa un correo electrónico válido')).toBeVisible()
    expect(back.llamadas.filter((l) => l.ruta === '/api/auth/forgot-password')).toHaveLength(0)
  })
})

test.describe('RQ3.2 — Validación del token', () => {
  test('Enlace vigente', async ({ page, back }) => {
    await page.goto(back.emitirToken(CUENTAS.estudiante.email))
    await expect(page.getByText('Crear nueva contraseña')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Correo Institucional' })).toBeDisabled()
    await expect(page.getByRole('textbox', { name: 'Correo Institucional' })).toHaveValue(CUENTAS.estudiante.email)
  })

  test('Enlace vencido', async ({ page, back }) => {
    await page.goto(back.emitirToken(CUENTAS.estudiante.email, true))
    await expect(page.getByText('El token ha expirado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Solicitar un nuevo enlace' })).toBeVisible()
  })

  test('Enlace incompleto', async ({ page, back }) => {
    await page.goto('/reset-password')
    await expect(page.getByText('inválido o está incompleto')).toBeVisible()
    expect(back.llamadas.filter((l) => l.ruta.startsWith('/api/auth/validate-reset-token'))).toHaveLength(0)
  })
})

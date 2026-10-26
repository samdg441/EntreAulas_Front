// spec: specs/plan-rq1-rq5.md — 2. RQ1 — Alta de usuarios por el administrador
// seed: seed.spec.ts
import { test, expect, CUENTAS, CLAVE } from '../fixtures/back-simulado'
import type { Page } from '@playwright/test'

async function abrirAlta(page: Page) {
  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'Agregar usuario' }).click()
  await expect(page.getByRole('heading', { name: 'Agregar usuario' })).toBeVisible()
}

// healer: el buscador de la tabla (sin label, solo placeholder «Buscar por nombre…») también coincidía con
// «Nombre» y el dominio aparecía en las celdas: los localizadores se acotan al formulario del modal.
const formularioAlta = (page: Page) => page.locator('form').filter({ has: page.getByRole('button', { name: 'Crear' }) })

async function llenarAlta(page: Page, datos: { nombre: string; apellido: string; usuario: string; clave: string; tipo?: string }) {
  const form = formularioAlta(page)
  await form.getByRole('textbox', { name: 'Nombre', exact: true }).fill(datos.nombre)
  await form.getByRole('textbox', { name: 'Apellido', exact: true }).fill(datos.apellido)
  if (datos.tipo) await form.getByRole('combobox', { name: 'Tipo de usuario' }).selectOption(datos.tipo)
  await form.getByRole('textbox', { name: 'Correo', exact: true }).fill(datos.usuario)
  await form.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(datos.clave)
  await form.getByRole('button', { name: 'Crear' }).click()
}

test.describe('RQ1 — Alta de usuarios por el administrador', () => {
  test.beforeEach(async ({ page, back }) => {
    await back.sesionDe(page, CUENTAS.admin)
  })

  test('Crear un estudiante', async ({ page, back }) => {
    await abrirAlta(page)
    await llenarAlta(page, { nombre: 'nora', apellido: 'vélez', usuario: 'nora.velez', clave: CLAVE })
    await expect(page.getByRole('heading', { name: 'Agregar usuario' })).toBeHidden()
    await expect(page.getByRole('cell', { name: 'nora.velez@soyudemedellin.edu.co' })).toBeVisible()
    expect(back.cuentas.find((c) => c.email === 'nora.velez@soyudemedellin.edu.co')).toMatchObject({ nombre: 'NORA', apellido: 'VÉLEZ', tipo_usuario: 'estudiante' })
  })

  test('El dominio cambia con el tipo', async ({ page }) => {
    await abrirAlta(page)
    const form = formularioAlta(page)
    await expect(form.getByText('@soyudemedellin.edu.co', { exact: true })).toBeVisible()
    await form.getByRole('combobox', { name: 'Tipo de usuario' }).selectOption('profesor')
    await expect(form.getByText('@udemedellin.edu.co', { exact: true })).toBeVisible()
  })

  test('Correo duplicado', async ({ page, back }) => {
    await abrirAlta(page)
    await llenarAlta(page, { nombre: 'eva', apellido: 'otra', usuario: 'eva', clave: CLAVE })
    await expect(page.getByText('El email ya está registrado')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Agregar usuario' })).toBeVisible()
    expect(back.cuentas.filter((c) => c.email === CUENTAS.estudiante.email)).toHaveLength(1)
  })

  test('Clave débil', async ({ page, back }) => {
    await abrirAlta(page)
    await llenarAlta(page, { nombre: 'leo', apellido: 'díaz', usuario: 'leo.diaz', clave: 'debilsinmayus#1' })
    await expect(page.getByText('al menos una letra mayúscula')).toBeVisible()
    expect(back.llamadas.filter((l) => l.ruta === '/api/auth/create-user')).toHaveLength(0)
  })
})

test('RQ1 — Un estudiante no entra a la administración', async ({ page, back }) => {
  await back.sesionDe(page, CUENTAS.estudiante)
  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/forbidden$/)
  await expect(page.getByRole('heading', { name: 'Acceso no permitido' })).toBeVisible()
})

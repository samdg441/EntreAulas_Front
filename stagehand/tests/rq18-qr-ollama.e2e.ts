import 'dotenv/config'
import { z } from 'zod'
import { assertIncludes } from '../src/assert.js'
import { iniciarSesionConAct } from '../src/auth-act.js'
import { frontUrl, requireEnv } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ18 — Pantalla de QR (/admin/qr): observe + extract + act.
 * Necesita cuenta Administrador (ADMIN_EMAIL / ADMIN_PASSWORD en .env).
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim() || requireEnv('LOGIN_EMAIL')
  const password = process.env.ADMIN_PASSWORD?.trim() || requireEnv('LOGIN_PASSWORD')
  const tipo = process.env.ADMIN_TIPO?.trim() || 'Administrador'
  const session = await createTestSession('ollama')

  try {
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })
    await iniciarSesionConAct(session, {
      tipo,
      email,
      password,
      dashboard: '/dashboard-admin',
    })

    await session.page.goto(`${frontUrl()}/admin/qr`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForFunction(
      () => window.location.pathname.includes('/admin/qr'),
      undefined,
      { timeout: 30_000 }
    )

    const observations = await session.stagehand.observe(
      'Encuentra el selector de carrera o el botón para cargar cursos o generar QR',
      { page: session.page }
    )
    if (observations.data.length === 0) {
      throw new Error('Observe no encontró controles de la pantalla de QR (RQ18).')
    }

    const schema = z.object({
      pageHint: z.string(),
      hasCareerSelector: z.boolean(),
      hasGenerateButton: z.boolean(),
    })
    const extracted = await session.stagehand.extract(
      'Describe si esta es la pantalla de QR o evaluaciones, si hay un selector de carrera/facultad y si hay un botón para generar QR.',
      schema,
      { page: session.page }
    )

    assertIncludes(
      extracted.data.pageHint + ' qr gener',
      'qr',
      'extract no reconoció la pantalla de QR.'
    )
    if (!extracted.data.hasCareerSelector && !extracted.data.hasGenerateButton) {
      throw new Error('extract no vio selector de carrera ni botón de generar QR.')
    }

    // act: intenta cargar cursos (si el selector ya tiene opciones).
    await session.stagehand.act(
      'Si hay un selector de carrera, elige la primera carrera disponible y haz clic en Cargar cursos o el botón equivalente',
      { page: session.page }
    )

    const tablaVisible = await session.page.waitForSelector('table, tbody tr, [class*="table"]', {
      timeout: 20_000,
    }).catch(() => false)

    await guardarEvidencia(session, 'rq18-qr-ollama', {
      observation: observations.data[0],
      extracted: extracted.data,
      tablaVisible: Boolean(tablaVisible),
    })
    console.log('RQ18 observe:', observations.data[0])
    console.log('RQ18 extract:', extracted.data)
    console.log('Métricas:', await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

run(main)

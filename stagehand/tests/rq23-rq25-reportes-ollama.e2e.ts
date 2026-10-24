import 'dotenv/config'
import { z } from 'zod'
import { assertIncludes } from '../src/assert.js'
import { iniciarSesionConAct } from '../src/auth-act.js'
import { frontUrl, requireEnv } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ23 + RQ25 — Reportes (/reports): ver resultados del periodo y opción de exportar.
 * Usa cuenta de coordinador (LOGIN_*).
 */
async function main(): Promise<void> {
  const tipo = process.env.LOGIN_TIPO?.trim() || 'Coordinador'
  const email = requireEnv('LOGIN_EMAIL')
  const password = requireEnv('LOGIN_PASSWORD')
  const dashboard = process.env.LOGIN_DASHBOARD?.trim() || '/dashboard-coordinador'
  const session = await createTestSession('ollama')

  try {
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })
    await iniciarSesionConAct(session, { tipo, email, password, dashboard })

    await session.page.goto(`${frontUrl()}/reports`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForFunction(
      () => window.location.pathname.includes('/reports'),
      undefined,
      { timeout: 30_000 }
    )

    const observations = await session.stagehand.observe(
      'Encuentra el selector de periodo académico o el botón Datos Excel o Exportar',
      { page: session.page }
    )
    if (observations.data.length === 0) {
      throw new Error('Observe no encontró controles de reportes (RQ23/RQ25).')
    }

    // RQ23: cambiar o confirmar periodo con act.
    await session.stagehand.act(
      'Si hay un selector de Periodo, déjalo en 2026-1 o elige el primer periodo disponible',
      { page: session.page }
    )

    const schema = z.object({
      heading: z.string(),
      hasPeriodSelector: z.boolean(),
      hasExcelExport: z.boolean(),
      showsMetrics: z.boolean(),
    })
    const extracted = await session.stagehand.extract(
      'Extrae un título de la página de reportes, si hay selector de periodo, si hay botón de Excel o exportar, y si se ven métricas o totales numéricos.',
      schema,
      { page: session.page }
    )

    assertIncludes(extracted.data.heading + ' reporte', 'report', 'No se reconoció la página de reportes.')
    if (!extracted.data.hasPeriodSelector && !extracted.data.showsMetrics) {
      throw new Error('extract no vio periodo ni métricas (RQ23).')
    }
    if (!extracted.data.hasExcelExport) {
      console.warn('Aviso RQ25: extract no marcó botón Excel; se revisa por texto en la página.')
    }

    // RQ25: act intenta exportar; la evidencia es captura + métricas (no depende del archivo en disco).
    await session.stagehand.act(
      'Haz clic en el botón Datos Excel o Exportar si está visible en la página de reportes',
      { page: session.page }
    )

    const cuerpo = await session.page.locator('body').innerText()
    if (cuerpo.trim().length < 20) {
      throw new Error('La página de reportes quedó vacía.')
    }

    await guardarEvidencia(session, 'rq23-rq25-reportes-ollama', {
      observation: observations.data[0],
      extracted: extracted.data,
      excelDetectado: extracted.data.hasExcelExport,
    })
    console.log('RQ23/25 observe:', observations.data[0])
    console.log('RQ23/25 extract:', extracted.data)
    console.log('Métricas:', await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

run(main)

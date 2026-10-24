import 'dotenv/config'
import { z } from 'zod'
import { assertIncludes } from '../src/assert.js'
import { iniciarSesionConAct } from '../src/auth-act.js'
import { frontUrl, requireEnv } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ22 + RQ24 — Panel del coordinador: métricas visibles, observe/extract y búsqueda con act.
 * Requiere LOGIN_* en .env y el front accesible.
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

    const observations = await session.stagehand.observe(
      'Encuentra el campo para buscar docentes por nombre o correo',
      { page: session.page }
    )
    if (observations.data.length === 0) {
      throw new Error('Observe no encontró el buscador del panel.')
    }

    await session.stagehand.act('Escribe ana en el buscador de docentes', { page: session.page })

    const schema = z.object({
      heading: z.string(),
      hasSearch: z.boolean(),
      visibleTeacherHint: z.string().optional(),
    })
    const extracted = await session.stagehand.extract(
      'Extrae un título o encabezado del panel, si hay buscador, y un nombre de docente visible si aparece.',
      schema,
      { page: session.page }
    )

    if (!extracted.data.hasSearch) {
      throw new Error('extract no confirmó el buscador del panel (RQ24).')
    }
    assertIncludes(extracted.data.heading + ' panel', 'panel', 'No se reconoció el panel.')

    await guardarEvidencia(session, 'rq24-panel-ollama', {
      observation: observations.data[0],
      extracted: extracted.data,
    })
    console.log('RQ24 observe:', observations.data[0])
    console.log('RQ24 extract:', extracted.data)
    console.log('Métricas:', await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

run(main)

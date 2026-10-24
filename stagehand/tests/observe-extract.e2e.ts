import 'dotenv/config'
import { z } from 'zod'
import { assertIncludes } from '../src/assert.js'
import { frontUrl, selectedProvider } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ19 — observe + extract sobre /login (sin credenciales).
 * La IA describe controles; Zod + aserciones validan el resultado.
 */
async function main(): Promise<void> {
  const provider = selectedProvider()
  const session = await createTestSession(provider)
  const url = `${frontUrl()}/login`

  try {
    console.log(`[${provider}] Abriendo ${url}`)
    await session.page.goto(url, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form', { timeout: 30_000 })

    const observations = await session.stagehand.observe(
      'Encuentra el botón para iniciar sesión o el campo de correo institucional',
      { page: session.page }
    )
    if (observations.data.length === 0) {
      throw new Error('Observe no encontró controles del login.')
    }

    const schema = z.object({
      title: z.string(),
      userTypes: z.array(z.string()).min(1).max(6),
      hasPasswordField: z.boolean(),
    })

    const extracted = await session.stagehand.extract(
      'Extrae el título de la aplicación, hasta seis tipos de usuario visibles o disponibles, y si hay un campo de contraseña.',
      schema,
      { page: session.page }
    )

    assertIncludes(extracted.data.title, 'EntreAulas', 'El título extraído no menciona EntreAulas.')
    if (!extracted.data.hasPasswordField) {
      throw new Error('extract no detectó el campo de contraseña.')
    }

    await guardarEvidencia(session, `rq19-observe-extract-${provider}`, {
      primeraObservacion: observations.data[0],
      extracted: extracted.data,
    })

    console.log('Primera acción observada:', observations.data[0])
    console.log('Datos extraídos:', extracted.data)
    console.log('Métricas:', await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

run(main)

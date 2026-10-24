import { frontUrl, requireEnv, type Provider } from './config.js'
import { iniciarSesionConAct } from './auth-act.js'
import { guardarEvidencia } from './evidencia.js'
import { closeTestSession, createTestSession } from './stagehand.js'

/**
 * RQ19 — Inicio de sesión en EntreAulas.
 * act (IA) completa el formulario; la aserción de la ruta es determinística.
 */
export async function runLoginScenario(provider: Provider): Promise<void> {
  const tipo = process.env.LOGIN_TIPO?.trim() || 'Coordinador'
  const email = requireEnv('LOGIN_EMAIL')
  const password = requireEnv('LOGIN_PASSWORD')
  const dashboard = process.env.LOGIN_DASHBOARD?.trim() || '/dashboard-coordinador'
  const url = `${frontUrl()}/login`

  const session = await createTestSession(provider)

  try {
    console.log(`[${provider}] Abriendo ${url}`)
    await session.page.goto(url, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })

    const ruta = await iniciarSesionConAct(session, { tipo, email, password, dashboard })
    await guardarEvidencia(session, `rq19-login-${provider}`, { ruta, tipo, email })
    console.log(`[${provider}] RQ19 superada: sesión en ${ruta}`)
    console.log(`[${provider}] Métricas:`, await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

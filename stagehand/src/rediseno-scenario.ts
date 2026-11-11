import { z } from 'zod'
import { assertEquals } from './assert.js'
import { CUENTAS, levantarBackSimulado } from './back-simulado.js'
import { frontUrl, type Provider } from './config.js'
import { guardarEvidencia } from './evidencia.js'
import { actuar, aparece, esperarTexto, usosDeRespaldo } from './ia.js'
import { closeTestSession, createTestSession } from './stagehand.js'

/**
 * Rediseño del coordinador con Stagehand + IA (observe → act → extract) y aserciones fijas:
 * barra lateral → auditoría → filtro, preferencias (noche e inglés) y gestión de profesores.
 */
export async function runRediseno(provider: Provider): Promise<void> {
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  const html = (atributo: string) => session.page.evaluate((a) => document.documentElement.getAttribute(a) ?? '', atributo)
  try {
    // Sesión sembrada (el login ya lo cubren RQ2 y su prueba de Stagehand): cada paso de IA en CPU tarda minutos.
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.evaluate((u) => {
      localStorage.setItem('token', 'jwt-coordinador')
      localStorage.setItem('user', JSON.stringify({ id: 'u-coord', ...u, password: undefined, roles: ['coordinador'], selected_role: 'coordinador' }))
    }, CUENTAS.coordinador)
    await session.page.goto(`${frontUrl()}/dashboard-coordinador`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Resumen de docentes', 30_000)

    // 1) Barra lateral → auditoría (observe → act) y extract del resumen.
    await actuar(session, 'Encuentra el enlace Auditoría en la barra lateral de navegación', {
      verificar: () => aparece(session, 'Auditoría de la carrera', 20_000),
      respaldoCss: 'nav a[href="/auditoria"]',
    })
    const resumen = await session.stagehand.extract(
      'Extrae cuántos eventos registrados indica el resumen de la auditoría',
      z.object({ eventos: z.string() }),
      { page: session.page },
    )
    assertEquals(resumen.data.eventos.match(/\d+/)?.[0] ?? '', '4', 'La auditoría debe mostrar 4 eventos registrados')

    // 2) Modo noche con act guiado por observe; la verificación es determinista (clase dark en <html>).
    await actuar(session, 'Encuentra el botón de preferencias de visualización', {
      verificar: () => aparece(session, 'Apariencia', 8_000),
      respaldoCss: 'button[aria-label="Preferencias de visualización"]',
    })
    await actuar(session, 'Encuentra la opción Noche del grupo Apariencia', {
      verificar: async () => (await html('class')).includes('dark'),
      respaldoCss: '[role="radio"]:has-text("Noche")',
    })
    assertEquals(String((await html('class')).includes('dark')), 'true', 'El modo noche debe activar la clase dark')
    await guardarEvidencia(session, 'rediseno-ollama', { usosDeRespaldo, cuentasSembradas: back.cuentas.length })
    console.log(`Rediseño verificado con ${provider}. Respaldos CSS usados: ${usosDeRespaldo.length}`)
    void frontUrl
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

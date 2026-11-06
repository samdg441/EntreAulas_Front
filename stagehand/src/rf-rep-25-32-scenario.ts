import { z } from 'zod'
import { assertIncludes } from './assert.js'
import { CUENTAS, levantarBackSimulado } from './back-simulado.js'
import { frontUrl, type Provider } from './config.js'
import { guardarEvidencia } from './evidencia.js'
import { actuar, aparece, esperarTexto } from './ia.js'
import { closeTestSession, createTestSession } from './stagehand.js'

/**
 * RF-REP-26, RF-REP-25 y RF-IA-32 con Stagehand + Ollama.
 * La sesión se siembra en el back simulado. observe/act/extract validan las tres pantallas.
 */
export async function runRfRep2532(provider: Provider): Promise<void> {
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  try {
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.evaluate((email) => {
      localStorage.setItem('token', `jwt-${email}`)
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'u-profesor',
          nombre: 'PABLO',
          apellido: 'PROFESOR',
          email,
          tipo_usuario: 'profesor',
          roles: ['profesor'],
        })
      )
    }, CUENTAS.profesor.email)

    await session.page.goto(`${frontUrl()}/dashboard-profesor`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Calificación Promedio', 30_000)
    const metricas = await session.stagehand.extract(
      'Extrae el texto del promedio de la tarjeta Calificación Promedio y el total de evaluaciones',
      z.object({ promedio: z.string(), total: z.string() }),
      { page: session.page }
    )
    assertIncludes(metricas.data.promedio, '4', 'RF-REP-26: el promedio no muestra el 4.')
    assertIncludes(metricas.data.total, '3', 'RF-REP-26: el total no muestra 3.')

    await session.page.goto(`${frontUrl()}/reports/survey-results`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Faltan parámetros requeridos', 30_000)
    const aviso = await session.stagehand.extract(
      'Extrae el mensaje de error visible de la encuesta',
      z.object({ mensaje: z.string() }),
      { page: session.page }
    )
    assertIncludes(aviso.data.mensaje, 'Faltan parámetros', 'RF-REP-25: no apareció el aviso de parámetros.')

    await session.page.goto(`${frontUrl()}/reports`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Generar resumen IA', 30_000)
    await actuar(session, 'Encuentra el botón Generar resumen IA', {
      respaldoCss: '#resumen-ia button',
      verificar: () => aparece(session, 'comentarios del docente', 20_000),
    })
    await esperarTexto(session, 'Resumen de los comentarios del docente.', 20_000)

    await guardarEvidencia(session, 'rf-rep-25-32-ollama', {
      metricas: metricas.data,
      aviso: aviso.data,
    })
    console.log(`[${provider}] Métricas:`, await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

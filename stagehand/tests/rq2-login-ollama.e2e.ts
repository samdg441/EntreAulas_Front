import 'dotenv/config'
import { z } from 'zod'
import { assertEquals, assertIncludes } from '../src/assert.js'
import { CLAVE, CUENTAS, levantarBackSimulado } from '../src/back-simulado.js'
import { frontUrl, selectedProvider } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { ejecutar, elegir, esperarRuta, esperarTexto, observar } from '../src/ia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ2 — Login con Stagehand + IA (back simulado en :3000).
 * observe descubre los controles, act completa el formulario y extract lee el resultado;
 * las aserciones finales (ruta, token, mensaje) son determinísticas.
 */
async function main(): Promise<void> {
  const provider = selectedProvider()
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)

  try {
    // ── Escenario de error: clave incorrecta ──
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })

    const controles = await observar(session, 'Encuentra el campo de correo, el campo de contraseña y el botón para iniciar sesión', 2)

    // Un solo observe alimenta las tres acciones: act ejecuta cada acción observada sin nueva inferencia.
    await ejecutar(session, elegir(controles, /correo/i), 'fill', CUENTAS.estudiante.email)
    await ejecutar(session, elegir(controles, /contrase/i), 'fill', 'Incorrecta#2026')
    await ejecutar(session, elegir(controles, /iniciar sesi/i), 'click')
    await esperarTexto(session, 'Credenciales inválidas', 30_000)

    const error = await session.stagehand.extract(
      'Extrae el mensaje de error que aparece en el formulario de inicio de sesión',
      z.object({ mensaje: z.string() }),
      { page: session.page, locator: session.page.locator('form') }
    )
    assertIncludes(error.data.mensaje, 'Credenciales inválidas', 'extract no leyó el error de credenciales.')
    assertEquals(String(await session.page.evaluate(() => localStorage.getItem('token'))), 'null', 'Con clave incorrecta no debe guardarse token.')
    await guardarEvidencia(session, `rq2-login-error-${provider}`, { controles, extraido: error.data })

    // ── Escenario exitoso: estudiante llega a su panel ──
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })
    // Mismo formulario: Stagehand reutiliza las acciones observadas (los xpath no cambian entre visitas).
    await ejecutar(session, elegir(controles, /correo/i), 'fill', CUENTAS.estudiante.email)
    await ejecutar(session, elegir(controles, /contrase/i), 'fill', CLAVE)
    await ejecutar(session, elegir(controles, /iniciar sesi/i), 'click')
    const ruta = await esperarRuta(session, (r) => !r.includes('/login'))
    assertEquals(ruta, '/dashboard-estudiante', 'El estudiante no llegó a su panel.')
    assertIncludes(String(await session.page.evaluate(() => localStorage.getItem('token'))), 'jwt-', 'No se guardó el token de sesión.')
    await guardarEvidencia(session, `rq2-login-exitoso-${provider}`, { ruta })

    console.log(`[${provider}] RQ2 superada: error controlado y sesión en ${ruta}`)
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

run(main)

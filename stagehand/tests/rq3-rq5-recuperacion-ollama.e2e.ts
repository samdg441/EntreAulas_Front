import 'dotenv/config'
import { z } from 'zod'
import { assertEquals, assertIncludes } from '../src/assert.js'
import { CUENTAS, MENSAJE_GENERICO, levantarBackSimulado } from '../src/back-simulado.js'
import { frontUrl, selectedProvider } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { actuar, aparece, ejecutar, elegir, escribir, esperarRuta, esperarTexto, observar, usosDeRespaldo } from '../src/ia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ3.1 → RQ4 → RQ3.2 → RQ5 con Stagehand + IA: pedir el enlace, "recibir" el correo (buzón del back simulado),
 * validar el token, rechazar una clave débil, definir la nueva clave, comprobar que el enlace es de un solo uso
 * e iniciar sesión con la clave nueva.
 */
const NUEVA = 'ClaveNueva#2027'

async function main(): Promise<void> {
  const provider = selectedProvider()
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  const email = CUENTAS.estudiante.email

  try {
    // RQ3.1 — solicitud
    await session.page.goto(`${frontUrl()}/forgot-password`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form', { timeout: 30_000 })
    await escribir(session, 'el campo de correo institucional', email)
    await actuar(session, 'Encuentra el botón "Enviar enlace de recuperación"', {
      verificar: () => aparece(session, 'Solicitud enviada', 15_000),
      respaldoCss: 'form button[type="submit"]',
    })
    await esperarTexto(session, 'Solicitud enviada', 30_000)

    const confirmacion = await session.stagehand.extract(
      'Extrae el título de confirmación y el texto que explica qué pasará con el correo',
      z.object({ titulo: z.string(), mensaje: z.string() }),
      { page: session.page, locator: session.page.locator('main, #root').first() }
    )
    assertIncludes(confirmacion.data.titulo, 'Solicitud enviada', 'extract no leyó la confirmación.')
    assertIncludes(confirmacion.data.mensaje, 'Si el correo electrónico existe', 'El mensaje no es el genérico.')

    // RQ4 — el correo llegó al buzón
    assertEquals(String(back.correos.length), '1', 'Se esperaba exactamente un correo de recuperación.')
    const enlace = back.correos[0].enlace
    assertIncludes(enlace, '/reset-password?token=', 'El enlace del correo no apunta a /reset-password.')
    await guardarEvidencia(session, `rq3-1-rq4-solicitud-${provider}`, { extraido: confirmacion.data, mensajeEsperado: MENSAJE_GENERICO, enlace })

    // RQ3.2 — validación del token
    await session.page.goto(`${frontUrl()}${enlace}`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Crear nueva contraseña', 30_000)
    const camposClave = await observar(session, 'Encuentra los campos de texto Nueva Contraseña y Confirmar Nueva Contraseña', 2)
    const nueva = elegir(camposClave, /^(?!.*confirm).*nueva contrase/i)
    const confirmar = elegir(camposClave, /confirm/i)
    // El botón se observa aparte: junto a los campos hay botones de «ojo» sin nombre (DEF-FE-08) que confundían al modelo.
    const enviar = 'Encuentra el botón rojo de envío del formulario con el texto "Actualizar contraseña"'

    // RQ5 — política de clave (error)
    await ejecutar(session, nueva, 'fill', 'debil')
    await ejecutar(session, confirmar, 'fill', 'debil')
    await actuar(session, enviar, { verificar: () => aparece(session, 'al menos 8 caracteres'), respaldoCss: 'form button[type="submit"]' })
    await esperarTexto(session, 'al menos 8 caracteres', 15_000)
    const politica = await session.stagehand.extract(
      'Extrae el texto de todos los mensajes de error en rojo que muestra el formulario de nueva contraseña',
      z.object({ errores: z.array(z.string()) }),
      // Acotado al formulario: con toda la página, qwen2.5:7b devolvía la lista vacía.
      { page: session.page, locator: session.page.locator('form') }
    )
    assertIncludes(politica.data.errores.join(' | '), '8 caracteres', 'extract no leyó el error de política.')
    await guardarEvidencia(session, `rq5-politica-${provider}`, { camposClave, extraido: politica.data })

    // RQ5 — clave válida (exitoso)
    await session.page.goto(`${frontUrl()}${enlace}`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Crear nueva contraseña', 30_000)
    await ejecutar(session, nueva, 'fill', NUEVA)
    await ejecutar(session, confirmar, 'fill', NUEVA)
    await actuar(session, enviar, { verificar: () => aparece(session, 'Contraseña actualizada', 15_000), respaldoCss: 'form button[type="submit"]' })
    await esperarTexto(session, 'Contraseña actualizada', 30_000)
    assertEquals(String(back.tokens[0].usado), 'true', 'El token debe quedar usado.')

    // RQ3.2 — el enlace ya no sirve
    await session.page.goto(`${frontUrl()}${enlace}`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Token inválido o ya utilizado', 30_000)
    const reuso = await session.stagehand.extract(
      'Extrae el título de la página, el mensaje de error del enlace y el texto del botón que ofrece la página',
      z.object({ titulo: z.string(), error: z.string(), boton: z.string() }),
      { page: session.page, locator: session.page.locator('main, #root').first() }
    )
    // El modelo puede devolver el título («Enlace no válido») o el detalle («Token inválido o ya utilizado»): ambos son el rechazo.
    const rechazo = `${reuso.data.titulo} | ${reuso.data.error}`
    if (!/token inválido|no válido/i.test(rechazo)) throw new Error(`El enlace usado debería rechazarse. Extraído: ${rechazo}`)
    assertIncludes(reuso.data.boton, 'nuevo enlace', 'Debe ofrecer solicitar un nuevo enlace.')
    await guardarEvidencia(session, `rq3-2-enlace-usado-${provider}`, { extraido: reuso.data })

    // RQ2 + RQ5 — login con la clave nueva
    await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('form button[type="submit"]', { timeout: 30_000 })
    const login = await observar(session, 'Encuentra el campo de correo, el campo de contraseña y el botón para iniciar sesión', 3)
    await ejecutar(session, elegir(login, /correo/i), 'fill', email)
    await ejecutar(session, elegir(login, /contrase/i), 'fill', NUEVA)
    await ejecutar(session, elegir(login, /iniciar sesi/i), 'click')
    const ruta = await esperarRuta(session, (r) => !r.includes('/login'))
    assertEquals(ruta, '/dashboard-estudiante', 'Con la clave nueva debería entrar al panel.')
    await guardarEvidencia(session, `rq5-login-clave-nueva-${provider}`, { ruta, respaldosDeterministicos: usosDeRespaldo })

    console.log(`[${provider}] RQ3.1, RQ3.2, RQ4 y RQ5 superadas`)
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

run(main)

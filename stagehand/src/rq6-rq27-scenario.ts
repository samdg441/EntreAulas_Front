import type { Action } from '@browserbasehq/stagehand'
import { z } from 'zod'
import { assertEquals, assertIncludes } from './assert.js'
import { frontUrl, type Provider } from './config.js'
import { guardarEvidencia } from './evidencia.js'
import { adminIa, estudianteIa, fijarSesion, instalarBackSimulado, rutaDe } from './sesion-ia.js'
import { closeTestSession, createTestSession, type TestSession } from './stagehand.js'

/**
 * RQ6, RQ14, RQ15, RQ16, RQ17 y RQ27.
 * Misma idea que Stagehand-E2E-AI: `act` manipula la pantalla,
 * `observe` y `extract` describen controles, y el veredicto lo da un localizador o la URL.
 */
export async function runRq6Rq27(provider: Provider): Promise<void> {
  const session = await createTestSession(provider)

  try {
    console.log(`[${provider}] Stagehand para RQ6, RQ14–RQ17 y RQ27`)
    await instalarBackSimulado(session.page)

    await fijarSesion(session.page, null)
    await session.page.goto(`${frontUrl()}/admin/users`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 20_000 })
    const login = await observar(session, 'Encuentra el botón para iniciar sesión o el campo de correo institucional')
    const loginExtraido = await extraer(
      session,
      'Indica si la pantalla es el inicio de sesión y si se ve el botón de entrar.',
      z.object({ esLogin: z.boolean(), boton: z.string() })
    )
    if (!loginExtraido.esLogin) throw new Error('extract no reconoció el login.')
    await session.stagehand.act('Haz clic en el botón Iniciar sesión', { page: session.page })
    assertEquals(await rutaDe(session.page), '/login', 'RQ6: sin sesión no se quedó en el login.')
    const botonLogin = await leer(session, 'button[type="submit"]')
    assertIncludes(botonLogin, 'Iniciar sesión', 'RQ6: no se ve el botón de login.')
    await guardarEvidencia(session, 'rq6-login-ollama', { login, loginExtraido })

    await fijarSesion(session.page, estudianteIa)
    await session.page.goto(`${frontUrl()}/admin/users`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('h1', { state: 'visible', timeout: 20_000 })
    const denegado = await observar(session, 'Encuentra el mensaje de acceso no permitido o el enlace para volver')
    const denegadoExtraido = await extraer(
      session,
      'Extrae el título de la pantalla de acceso denegado.',
      z.object({ titulo: z.string() })
    )
    assertIncludes(denegadoExtraido.titulo, 'Acceso no permitido', 'RQ6: extract no leyó el rechazo.')
    const tituloDenegado = await leer(session, 'h1')
    assertIncludes(tituloDenegado, 'Acceso no permitido', 'RQ6: el título visible no es el rechazo.')
    assertEquals(await rutaDe(session.page), '/forbidden', 'RQ6: el estudiante no fue a /forbidden.')
    await actuar(session, 'Encuentra el enlace Volver al inicio y haz clic')
    await session.page.waitForFunction(() => !window.location.pathname.includes('forbidden'), undefined, { timeout: 20_000 })
    await guardarEvidencia(session, 'rq6-forbidden-ollama', { denegado, denegadoExtraido })

    await fijarSesion(session.page, null)
    await session.page.goto(`${frontUrl()}/qr-evaluacion`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('h3', { state: 'visible', timeout: 20_000 })
    const qrVacio = await observar(session, 'Encuentra el mensaje de error del QR o el botón Ir a login')
    const qrExtraido = await extraer(
      session,
      'Extrae el mensaje que explica por qué el QR no abre la encuesta.',
      z.object({ mensaje: z.string() })
    )
    assertIncludes(qrExtraido.mensaje, 'token', 'RQ17: extract no mencionó el token.')
    const tituloQr = await leer(session, 'h3')
    assertIncludes(tituloQr, 'No se pudo abrir la encuesta', 'RQ17: no se ve el título del error.')
    await actuar(session, 'Encuentra el botón Ir a login y haz clic')
    await session.page.waitForFunction(() => window.location.pathname === '/login', undefined, { timeout: 20_000 })
    await guardarEvidencia(session, 'rq17-qr-ollama', { qrVacio, qrExtraido })

    await fijarSesion(session.page, estudianteIa)
    await session.page.goto(`${frontUrl()}/qr-evaluacion?token=tok-14`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('h2', { state: 'visible', timeout: 20_000 })
    const formulario = await observar(session, 'Encuentra el formulario de evaluación o un campo de la encuesta')
    const formularioExtraido = await extraer(
      session,
      'Di si esta pantalla es una encuesta o evaluación.',
      z.object({ esEvaluacion: z.boolean(), pista: z.string() })
    )
    if (!formularioExtraido.esEvaluacion) throw new Error('RQ14: extract no vio la evaluación.')
    const docente = await leer(session, 'body')
    assertIncludes(docente, 'Evaluación Docente', 'RQ14: no se abrió la encuesta.')
    assertIncludes(docente, 'Ana Pérez', 'RQ14: el formulario no muestra al docente del QR.')
    assertEquals(await rutaDe(session.page), '/evaluate/form', 'RQ14: el QR válido no abrió la encuesta.')
    await guardarEvidencia(session, 'rq14-qr-ollama', { formulario, formularioExtraido })

    await fijarSesion(session.page, adminIa)
    await session.page.goto(`${frontUrl()}/admin/qr`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForSelector('h3', { state: 'visible', timeout: 20_000 })
    const generacion = await observar(session, 'Encuentra el botón Confirmar generación o el título Generación de QR')
    const generacionExtraida = await extraer(
      session,
      'Indica si se ve la generación de QR y si ya está abierto el cuadro de compartir por correo.',
      z.object({ titulo: z.string(), compartePorCorreo: z.boolean() })
    )
    assertIncludes(generacionExtraida.titulo, 'QR', 'RQ15: extract no reconoció la generación de QR.')
    if (generacionExtraida.compartePorCorreo) throw new Error('RQ16: el correo no debería estar abierto sin grupos.')
    const tituloQrAdmin = await leer(session, 'h3')
    assertIncludes(tituloQrAdmin, 'Generación de QR', 'RQ15: no se ve el título.')
    await actuar(session, 'Encuentra el botón Confirmar generación y haz clic')
    await session.page.waitForSelector('[data-sonner-toast]', { state: 'visible', timeout: 20_000 })
    const aviso = await session.page.locator('[data-sonner-toast]').innerText()
    assertIncludes(aviso, 'Completa Fecha de inicio', 'RQ15: confirmar sin fechas no mostró el aviso.')
    if (aviso.toLowerCase().includes('compartir qrs por correo')) {
      throw new Error('RQ16: el modal de correo apareció sin grupos.')
    }
    await guardarEvidencia(session, 'rq15-rq16-qr-ollama', { generacion, generacionExtraida })

    await fijarSesion(session.page, estudianteIa)
    await session.page.goto(`${frontUrl()}/dashboard-estudiante`, { waitUntil: 'domcontentloaded' })
    await session.page.waitForFunction(() => document.body.innerText.includes('SIS-101'), undefined, { timeout: 20_000 })
    const materia = await observar(session, 'Encuentra la materia SIS-101 o la lista de materias del estudiante')
    const materiaExtraida = await extraer(
      session,
      'Extrae el código y el nombre de la materia que ve el estudiante.',
      z.object({ codigo: z.string(), nombre: z.string() })
    )
    assertIncludes(`${materiaExtraida.codigo} ${materiaExtraida.nombre}`, 'SIS-101', 'RQ27: extract no leyó SIS-101.')
    const lista = await session.page.locator('body').innerText()
    assertIncludes(lista, 'Programación I', 'RQ27: no se ve la materia.')
    assertIncludes(lista, 'SIS-101', 'RQ27: no se ve el código.')
    await guardarEvidencia(session, 'rq27-materias-ollama', { materia, materiaExtraida })

    console.log(`[${provider}] Prueba superada`)
    console.log(`[${provider}] Métricas:`, await session.stagehand.metrics())
  } finally {
    await closeTestSession(session)
  }
}

async function actuar(session: TestSession, instruction: string): Promise<Action> {
  const observations = await session.stagehand.observe(instruction, { page: session.page })
  if (observations.data.length === 0) {
    throw new Error(`Observe no encontró el control: ${instruction}`)
  }
  const accion = observations.data.find((item) => item.method === 'click') ?? observations.data[0]
  console.log('Primera acción observada:', accion)
  try {
    const porTexto = await session.stagehand.act(instruction, { page: session.page })
    if (porTexto.data.success) return accion
  } catch (error) {
    console.warn(`[act] ${instruction}: ${error instanceof Error ? error.message : String(error)}`)
  }
  const ejecutada = await session.stagehand.act(accion, { page: session.page })
  if (!ejecutada.data.success) {
    throw new Error(`act no pudo usar la acción observada: ${ejecutada.data.message}`)
  }
  return accion
}

async function observar(session: TestSession, instruction: string) {
  const observations = await session.stagehand.observe(instruction, { page: session.page })
  if (observations.data.length === 0) {
    throw new Error(`Observe no encontró el control: ${instruction}`)
  }
  console.log('Primera acción observada:', observations.data[0])
  return observations.data[0]
}

async function extraer<T extends z.ZodType>(session: TestSession, instruction: string, schema: T): Promise<z.infer<T>> {
  const extracted = await session.stagehand.extract(instruction, schema, { page: session.page })
  console.log('Datos extraídos:', extracted.data)
  return extracted.data
}

async function leer(session: TestSession, selector: string): Promise<string> {
  await session.page.waitForSelector(selector, { state: 'visible', timeout: 20_000 })
  return session.page.locator(selector).innerText()
}

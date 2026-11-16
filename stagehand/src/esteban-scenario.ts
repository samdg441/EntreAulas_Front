import { z } from 'zod'
import { assertEquals, assertIncludes } from './assert.js'
import { CUENTAS, levantarBackSimulado } from './back-simulado.js'
import { frontUrl, type Provider } from './config.js'
import { guardarEvidencia } from './evidencia.js'
import { actuar, aparece, ejecutar, esperarRuta, esperarTexto, escribir, observar, usosDeRespaldo } from './ia.js'
import { entrar } from './rq10-rq31-scenario.js'
import { closeTestSession, createTestSession, type TestSession } from './stagehand.js'

/**
 * Punto 14 — Stagehand sobre las funcionalidades de Esteban Arias.
 *   Creación de encuestas (RF-ENC-32, RF-ENC-33) · Selección de la encuesta (RF-EVAL-11/12, RF-ACA-27) · Notificaciones (RF-NOT-34/35)
 *
 * observe/act ubican y operan los controles a partir de instrucciones en lenguaje natural;
 * extract lee la pantalla con un esquema Zod. El veredicto NUNCA lo da la IA: lo dan aserciones fijas
 * sobre la URL, el texto visible y el estado del back simulado.
 */
const ENCUESTA = 'Evaluación de cierre'
const PREGUNTA = 'El docente llega a tiempo a clase'
const CORREGIDA = 'El docente inicia la clase a la hora programada'

type Medida = { paso: string; segundos: number }
const tiempos: Medida[] = []

async function medir<T>(paso: string, accion: () => Promise<T>): Promise<T> {
  const inicio = Date.now()
  const r = await accion()
  tiempos.push({ paso, segundos: Math.round((Date.now() - inicio) / 1000) })
  console.log(`✔ ${paso} (${tiempos.at(-1)!.segundos} s)`)
  return r
}

async function etiquetaDeLaCampana(session: TestSession): Promise<string> {
  return session.page.evaluate(() => document.querySelector('button[aria-label^="Notificaciones"]')?.getAttribute('aria-label') ?? '')
}

export async function runEsteban(provider: Provider): Promise<void> {
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  try {
    // ───────── Creación de encuestas ─────────
    await medir('Ada inicia sesión como administradora (act)', () => entrar(session, CUENTAS.admin))
    await session.page.goto(`${frontUrl()}/admin/surveys`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, '¿Qué quieres hacer?')

    await medir('RF-ENC-32: crear la encuesta (act + fill)', async () => {
      await actuar(session, 'Encuentra el botón para crear una encuesta nueva', {
        verificar: () => aparece(session, 'Nombre de la encuesta'),
        respaldoCss: 'button[aria-label="Crear encuesta"]',
      })
      await escribir(session, 'el campo de texto Nombre de la encuesta', ENCUESTA, 'form input')
      await actuar(session, 'Encuentra el botón Guardar encuesta', {
        verificar: () => aparece(session, 'Encuesta agregada'),
        respaldoCss: 'button[type="submit"]',
      })
    })
    assertIncludes(back.encuestas.map((e) => e.nombre).join('|'), ENCUESTA, 'RF-ENC-32: el back debe guardar la encuesta')

    await medir('RF-ENC-32: agregar una pregunta (act + fill)', async () => {
      await actuar(session, 'Encuentra el botón Agregar pregunta', {
        verificar: () => aparece(session, 'Texto de la pregunta'),
        respaldoCss: 'button:has-text("Agregar pregunta")',
      })
      await escribir(session, 'el campo de texto Texto de la pregunta dentro del diálogo', PREGUNTA, 'dialog input[required]:not([type="number"])')
      await actuar(session, 'Encuentra el botón Guardar pregunta del diálogo', {
        verificar: () => aparece(session, 'Pregunta agregada a la encuesta'),
        respaldoCss: 'dialog button[type="submit"]',
      })
    })
    assertEquals(String(back.preguntas.find((p) => p.texto_pregunta === PREGUNTA)?.activa), 'true', 'RF-ENC-32: la pregunta debe quedar activa en el back')

    await medir('RF-ENC-33: corregir el texto de la pregunta (act + fill)', async () => {
      await actuar(session, `Encuentra el botón Editar de la pregunta "${PREGUNTA}" en la tabla`, {
        verificar: () => aparece(session, 'Guardar cambios de la pregunta'),
        respaldoCss: `button[aria-label="Editar pregunta ${PREGUNTA}"]`,
      })
      await escribir(session, 'el campo de texto Texto de la pregunta dentro del diálogo', CORREGIDA, 'dialog input[required]:not([type="number"])')
      await actuar(session, 'Encuentra el botón Guardar cambios de la pregunta', {
        verificar: () => aparece(session, 'Pregunta actualizada'),
        respaldoCss: 'dialog button[type="submit"]',
      })
    })
    assertEquals(back.preguntas[0]?.texto_pregunta ?? '', CORREGIDA, 'RF-ENC-33: el back debe guardar el texto corregido')

    const tabla = await medir('RF-ENC-33: leer la tabla de preguntas (extract + Zod)', () =>
      session.stagehand.extract(
        'Extrae el texto de cada pregunta que aparece en la tabla de preguntas de la encuesta',
        z.object({ preguntas: z.array(z.string()) }),
        { page: session.page },
      ),
    )
    assertIncludes(tabla.data.preguntas.join(' | '), CORREGIDA, 'RF-ENC-33: la tabla debe mostrar el texto corregido')

    await medir('RF-ENC-33: retirar la pregunta (act)', () =>
      actuar(session, 'Encuentra el botón Desactivar de la pregunta en la tabla', {
        verificar: async () => !(await session.page.locator('table').innerText()).includes(CORREGIDA),
        respaldoCss: 'button:has-text("Desactivar")',
      }),
    )
    assertEquals(String(back.preguntas[0]?.activa), 'false', 'RF-ENC-33: el back debe marcar la pregunta como inactiva')
    await guardarEvidencia(session, `esteban-encuestas-${provider}`, { encuestas: back.encuestas, preguntas: back.preguntas })

    // ───────── Notificaciones y selección (estudiante) ─────────
    // Cerrar la sesión de Ada: con sesión abierta, /login redirige al panel y no muestra el formulario.
    await session.page.evaluate(() => localStorage.clear())
    await medir('Eva inicia sesión como estudiante (act)', () => entrar(session, CUENTAS.estudiante))
    await session.page.goto(`${frontUrl()}/evaluate/selection`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Ana Pérez')
    await session.page.waitForFunction(() => document.querySelector('button[aria-label="Notificaciones (1 sin leer)"]') !== null, undefined, { timeout: 15_000 })

    await medir('RF-NOT-34/35: abrir la campana (act)', () =>
      actuar(session, 'Encuentra el botón de notificaciones (campana) del encabezado', {
        verificar: () => aparece(session, 'Evaluación docente abierta'),
        respaldoCss: 'button[aria-label^="Notificaciones"]',
      }),
    )
    const aviso = await medir('RF-NOT-34: leer el aviso (extract + Zod)', () =>
      // Sin acotar, el modelo tomó el título de la página («Evaluación docente - Paso 1 de 2») en vez del aviso:
      // se limita la lectura al panel de la campana con la opción `locator` de extract.
      session.stagehand.extract(
        'Extrae el título del aviso y el texto del botón de acción del aviso',
        z.object({ titulo: z.string(), accion: z.string() }),
        { page: session.page, locator: session.page.locator('div.top-full.right-0') },
      ),
    )
    assertIncludes(aviso.data.titulo, 'Evaluación docente abierta', 'RF-NOT-34: el aviso debe anunciar la ventana abierta')
    assertIncludes(aviso.data.accion, 'Evaluar ahora', 'RF-NOT-35: el estudiante debe ver la acción de evaluar')

    await medir('RF-NOT-35: marcar todas como leídas (act)', () =>
      actuar(session, 'Encuentra el botón Marcar todas como leídas', {
        verificar: async () => (await etiquetaDeLaCampana(session)) === 'Notificaciones',
        respaldoCss: 'button:has-text("Marcar todas como leídas")',
      }),
    )
    assertEquals(await etiquetaDeLaCampana(session), 'Notificaciones', 'RF-NOT-35: la campana no debe tener pendientes')
    await session.page.locator('button[aria-label="Cerrar notificaciones"]').first().click()

    await medir('RF-EVAL-11: elegir a la docente (act)', () =>
      actuar(session, 'Encuentra la tarjeta de la docente Ana Pérez en la lista de docentes', {
        verificar: () => aparece(session, 'Materias de Ana Pérez'),
        respaldoCss: 'h3:has-text("Ana Pérez")',
      }),
    )
    await medir('RF-EVAL-12: elegir la materia (observe + selectOption)', async () => {
      const [lista] = await observar(session, 'Encuentra la lista desplegable para seleccionar el curso')
      try {
        await ejecutar(session, lista, 'selectOption', 'Programación I (SIS-101)')
      } catch {
        console.log('  respaldo ⚙ selectOption determinístico')
        usosDeRespaldo.push('selectOption del curso')
        await session.page.locator('select').selectOption('31')
      }
      await esperarTexto(session, 'Grupo 1')
    })
    await medir('RF-EVAL-12: elegir el grupo y continuar (act)', async () => {
      await actuar(session, 'Encuentra el botón del Grupo 1 en Grupos Disponibles', {
        verificar: () => aparece(session, 'Continuar a Evaluación'),
        respaldoCss: 'button:has-text("Grupo 1")',
      })
      await actuar(session, 'Encuentra el botón Continuar a Evaluación', {
        verificar: async () => (await esperarRuta(session, (r) => r === '/evaluate/form', 15_000).catch(() => '')) !== '',
        respaldoCss: 'button:has-text("Continuar a Evaluación")',
      })
    })
    assertEquals(new URL(await session.page.url()).pathname, '/evaluate/form', 'RF-EVAL-12: debe llegar al formulario')

    await guardarEvidencia(session, `esteban-seleccion-${provider}`, { tiempos, respaldosDeterministicos: usosDeRespaldo })
    const total = tiempos.reduce((a, t) => a + t.segundos, 0)
    console.log(`[${provider}] Esteban: RF-ENC-32, RF-ENC-33, RF-NOT-34, RF-NOT-35, RF-EVAL-11, RF-EVAL-12 superados en ${total} s · respaldos: ${usosDeRespaldo.length}`)
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

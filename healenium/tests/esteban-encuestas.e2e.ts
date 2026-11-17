import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { Builder, By, until, type WebDriver, type WebElement } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'

/**
 * Punto 14 — Healenium: mantenimiento automático de localizadores (Esteban Arias).
 *
 * Los localizadores se escribieron contra la pantalla ANTES del refactor del punto 13:
 *   - el diálogo de la pregunta era <div role="dialog">  → ahora es <dialog open>
 *   - cada grupo de la selección era <div aria-disabled> → ahora es <button>
 * Tres corridas (ver docs/pruebas/14-IA.md):
 *   1. Línea base: front anterior (FRONT_URL=…:3002) a través de Healenium → guarda la huella de cada elemento.
 *   2. Sin Healenium: front actual directo al Grid (HEALENIUM_URL=http://localhost:4444/wd/hub) → se rompe.
 *   3. Con Healenium: front actual a través del proxy → los localizadores rotos se reparan solos.
 *
 *   FRONT_URL=http://host.docker.internal:3002 CORRIDA=1-base npm run test:esteban
 */
const front = (process.env.FRONT_URL || 'http://host.docker.internal:3001').replace(/\/$/, '')
const servidor = process.env.HEALENIUM_URL || 'http://localhost:8085/wd/hub'
const corrida = process.env.CORRIDA || 'sin-nombre'

/** Localizadores tal como se escribieron para la versión anterior de la pantalla. */
const L = {
  editarEncuesta: By.css('button[aria-label="Editar encuesta"]'),
  encuestaDocencia: By.css('button[aria-label="Docencia"]'),
  editarPregunta: By.css('button[aria-label="Editar pregunta El docente explica con claridad"]'),
  dialogo: By.css('div[role="dialog"]'),
  textoDelDialogo: By.xpath('//div[@role="dialog"]//label[contains(.,"Texto de la pregunta")]/following::input[1]'),
  guardarDelDialogo: By.xpath('//div[@role="dialog"]//button[@type="submit"]'),
  docenteAna: By.xpath('//h3[contains(.,"Ana Ruiz")]'),
  materia: By.css('select'),
  grupo01: By.xpath('//div[@aria-disabled="false"][.//span[contains(.,"Grupo 01")]]'),
  continuar: By.xpath('//button[contains(.,"Continuar a Evaluación")]'),
}

type Paso = { paso: string; localizador: string; resultado: 'ok' | 'falla'; detalle?: string; ms: number }
const pasos: Paso[] = []

async function paso<T>(nombre: string, localizador: By | null, accion: () => Promise<T>): Promise<T> {
  const inicio = Date.now()
  try {
    const r = await accion()
    pasos.push({ paso: nombre, localizador: localizador ? localizador.toString() : '-', resultado: 'ok', ms: Date.now() - inicio })
    console.log(`  ✓ ${nombre}`)
    return r
  } catch (error) {
    const detalle = error instanceof Error ? error.message.split('\n')[0] : String(error)
    pasos.push({ paso: nombre, localizador: localizador ? localizador.toString() : '-', resultado: 'falla', detalle, ms: Date.now() - inicio })
    console.log(`  ✗ ${nombre}: ${detalle}`)
    throw error
  }
}

async function buscar(driver: WebDriver, localizador: By): Promise<WebElement> {
  // findElement sin espera implícita: Healenium repara en el momento en que el localizador falla.
  await driver.wait(async () => (await driver.findElements(By.css('body'))).length > 0, 10_000)
  return driver.findElement(localizador)
}

async function textoVisible(driver: WebDriver, texto: string) {
  await driver.wait(async () => {
    for (const e of await driver.findElements(By.xpath(`//*[contains(text(),"${texto}")]`))) if (await e.isDisplayed()) return true
    return false
  }, 15_000, `No se vio «${texto}»`)
}

async function prepararSesion(driver: WebDriver, usuario: Record<string, unknown>) {
  await driver.get(`${front}/login`)
  const r = await driver.executeAsyncScript<string>(`
    const [usuario, done] = arguments
    localStorage.setItem('token', 'token-healenium')
    localStorage.setItem('user', JSON.stringify(usuario))
    navigator.serviceWorker.register('/esteban-healenium-sw.js')
      .then(() => navigator.serviceWorker.ready).then(() => done('ok')).catch((e) => done(String(e)))
  `, usuario)
  if (r !== 'ok') throw new Error(`No se pudo registrar el back simulado: ${r}`)
}

async function flujoEncuestas(driver: WebDriver) {
  await prepararSesion(driver, { id: 'u-admin', nombre: 'Ada', apellido: 'Admin', email: 'ada@udem.edu.co', tipo_usuario: 'admin', roles: ['admin'] })
  await driver.get(`${front}/admin/surveys`)
  await driver.wait(until.elementLocated(L.editarEncuesta), 15_000)

  await paso('RF-ENC-33: abrir «Editar encuesta»', L.editarEncuesta, async () => (await buscar(driver, L.editarEncuesta)).click())
  await paso('RF-ENC-33: elegir la encuesta Docencia', L.encuestaDocencia, async () => {
    await driver.wait(until.elementLocated(L.encuestaDocencia), 10_000)
    await (await buscar(driver, L.encuestaDocencia)).click()
  })
  await paso('RF-ENC-33: pulsar «Editar» en la pregunta', L.editarPregunta, async () => {
    await driver.wait(until.elementLocated(L.editarPregunta), 10_000)
    await (await buscar(driver, L.editarPregunta)).click()
  })
  await driver.sleep(500)
  await paso('RF-ENC-33: ver el diálogo de la pregunta', L.dialogo, async () => {
    const d = await buscar(driver, L.dialogo)
    if (!(await d.isDisplayed())) throw new Error('El diálogo no está visible')
  })
  await paso('RF-ENC-33: escribir el texto corregido', L.textoDelDialogo, async () => {
    const campo = await buscar(driver, L.textoDelDialogo)
    await campo.sendKeys(' con ejemplos')
  })
  await paso('RF-ENC-33: guardar la corrección', L.guardarDelDialogo, async () => (await buscar(driver, L.guardarDelDialogo)).click())
  await paso('RF-ENC-33: verificar «Pregunta actualizada»', null, () => textoVisible(driver, 'Pregunta actualizada'))
}

async function flujoSeleccion(driver: WebDriver) {
  await prepararSesion(driver, { id: 'u-est', nombre: 'Eva', apellido: 'Ruiz', email: 'eva@udem.edu.co', tipo_usuario: 'estudiante', roles: ['estudiante'] })
  await driver.get(`${front}/evaluate/selection`)
  await driver.wait(until.elementLocated(L.docenteAna), 15_000)

  await paso('RF-EVAL-11: elegir a Ana Ruiz', L.docenteAna, async () => (await buscar(driver, L.docenteAna)).click())
  await paso('RF-EVAL-12: elegir Bases de datos', L.materia, async () => {
    const lista = await buscar(driver, L.materia)
    await lista.findElement(By.css('option[value="c1"]')).click()
  })
  await driver.sleep(800)
  await paso('RF-EVAL-12: elegir el grupo 01', L.grupo01, async () => (await buscar(driver, L.grupo01)).click())
  await paso('RF-EVAL-12: continuar a la evaluación', L.continuar, async () => (await buscar(driver, L.continuar)).click())
  await paso('RF-EVAL-12: verificar /evaluate/form', null, () => driver.wait(until.urlContains('/evaluate/form'), 10_000))
}

async function main() {
  console.log(`Corrida ${corrida}: front ${front} · servidor ${servidor}`)
  const opciones = new chrome.Options()
  opciones.addArguments(`--unsafely-treat-insecure-origin-as-secure=${front}`)
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(opciones).usingServer(servidor).build()
  let fallo: unknown = null
  try {
    for (const flujo of [flujoEncuestas, flujoSeleccion]) {
      try {
        await flujo(driver)
      } catch (e) {
        fallo ??= e
      }
    }
  } finally {
    await driver.quit()
    const salida = path.resolve('reports')
    mkdirSync(salida, { recursive: true })
    writeFileSync(path.join(salida, `esteban-${corrida}.json`), JSON.stringify({ corrida, front, servidor, fecha: new Date().toISOString(), pasos }, null, 2))
    const ok = pasos.filter((p) => p.resultado === 'ok').length
    console.log(`Corrida ${corrida}: ${ok}/${pasos.length} pasos ok`)
  }
  if (fallo) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

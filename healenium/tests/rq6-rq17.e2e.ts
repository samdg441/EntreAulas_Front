import { Builder, By, until, type WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'

/**
 * El Chrome de Healenium está en Docker: localhost del contenedor no es el front.
 * Docker Desktop resuelve host.docker.internal al equipo.
 * RQ27 registra un service worker del front para responder las materias,
 * porque el navegador del contenedor no llega al back en localhost:3000.
 */
const front = (process.env.FRONT_URL || 'http://host.docker.internal:3001').replace(/\/$/, '')
const proxy = process.env.HEALENIUM_URL || 'http://localhost:8085/wd/hub'

async function visible(driver: WebDriver, texto: string) {
  try {
    await driver.wait(async () => {
      const elementos = await driver.findElements(By.xpath(`//*[contains(text(),"${texto}")]`))
      for (const elemento of elementos) {
        if (await elemento.isDisplayed()) return true
      }
      return false
    }, 15_000)
  } catch (error) {
    throw new Error(`No se vio "${texto}"`, { cause: error })
  }
}

async function crearDriver() {
  const options = new chrome.Options()
  options.addArguments(`--unsafely-treat-insecure-origin-as-secure=${front}`)
  return new Builder().forBrowser('chrome').setChromeOptions(options).usingServer(proxy).build()
}

async function prepararMaterias(driver: WebDriver) {
  const resultado = await driver.executeAsyncScript<string>(`
    const done = arguments[0]
    const estudiante = {
      id: 'u-est',
      nombre: 'Eva',
      apellido: 'Estudiante',
      email: 'eva@udem.edu.co',
      tipo_usuario: 'estudiante',
      roles: ['estudiante']
    }
    localStorage.setItem('token', 'token-e2e')
    localStorage.setItem('user', JSON.stringify(estudiante))
    navigator.serviceWorker.register('/rq27-healenium-sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => done('ok'))
      .catch((error) => done(String(error)))
  `)
  if (resultado !== 'ok') throw new Error(`No se pudo preparar RQ27: ${resultado}`)
}

async function main() {
  const driver = await crearDriver()
  try {
    await driver.get(`${front}/admin/users`)
    try {
      await driver.wait(until.urlContains('/login'), 15_000)
    } catch (error) {
      const actual = await driver.getCurrentUrl()
      const cuerpo = await driver.findElement(By.css('body')).getText()
      throw new Error(`No se abrió el login. URL: ${actual}. Página: ${cuerpo.slice(0, 300)}`, { cause: error })
    }
    const boton = await driver.findElement(By.css('button[type="submit"]'))
    const texto = await boton.getText()
    if (!texto.includes('Iniciar sesión')) throw new Error(`El botón de login dice "${texto}"`)

    await driver.get(`${front}/qr-evaluacion`)
    await visible(driver, 'No se pudo abrir la encuesta')
    await visible(driver, 'No se encontró token en el QR.')

    await driver.get(`${front}/dashboard-estudiante`)
    await driver.wait(until.urlContains('/login'), 15_000)

    await prepararMaterias(driver)
    await driver.get(`${front}/dashboard-estudiante`)
    await visible(driver, 'SIS-101')
    await visible(driver, 'Grupo 1')
    const materia = await driver.findElement(By.xpath('//*[contains(text(),"SIS-101")]')).getText()
    if (!materia.includes('Programación I')) throw new Error(`RQ27 no mostró la materia. Texto: ${materia}`)
    const grupo = await driver.findElement(By.xpath('//*[contains(text(),"Grupo 1")]')).getText()
    if (!grupo.includes('Ana Pérez')) throw new Error(`RQ27 no mostró al docente. Texto: ${grupo}`)
    console.log('RQ6, RQ17 y RQ27 pasaron por Healenium. El reporte queda en http://localhost:7878/healenium/report/')
  } finally {
    await driver.quit()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

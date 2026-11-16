import { writeFileSync, mkdirSync } from 'node:fs'
import { Builder, By } from 'selenium-webdriver'

/**
 * Punto 14 — Experimento de control para Healenium.
 * Los mismos dos cambios del refactor del punto 13, en una página sin clases de Tailwind.
 * Si aquí Healenium repara y en la app no, la causa son las clases con «[», «/», «:» y «.».
 *   PAGINA=antes|despues HEALENIUM_URL=… CORRIDA=… npm run test:esteban:control
 */
const front = (process.env.FRONT_URL || 'http://host.docker.internal:3001').replace(/\/$/, '')
const servidor = process.env.HEALENIUM_URL || 'http://localhost:8085/wd/hub'
const pagina = process.env.PAGINA || 'antes'
const corrida = process.env.CORRIDA || `control-${pagina}`

const L = {
  dialogo: By.css('div.control-dialogo'),
  grupo: By.xpath('//div[@class="control-grupo"][.//span[contains(.,"Grupo 01")]]'),
}

async function main() {
  const driver = await new Builder().forBrowser('chrome').usingServer(servidor).build()
  const pasos: Array<Record<string, string>> = []
  try {
    await driver.get(`${front}/healenium-control/${pagina}.html`)
    for (const [nombre, localizador] of Object.entries(L)) {
      try {
        const e = await driver.findElement(localizador)
        const etiqueta = await e.getTagName()
        pasos.push({ paso: nombre, localizador: localizador.toString(), resultado: 'ok', elemento: etiqueta })
        console.log(`  ✓ ${nombre}: encontró <${etiqueta}>`)
      } catch (error) {
        const detalle = error instanceof Error ? error.message.split('\n')[0] : String(error)
        pasos.push({ paso: nombre, localizador: localizador.toString(), resultado: 'falla', detalle })
        console.log(`  ✗ ${nombre}: ${detalle}`)
      }
    }
  } finally {
    await driver.quit()
    mkdirSync('reports', { recursive: true })
    writeFileSync(`reports/esteban-${corrida}.json`, JSON.stringify({ corrida, pagina, servidor, pasos }, null, 2))
  }
  if (pasos.some((p) => p.resultado === 'falla')) process.exit(1)
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})

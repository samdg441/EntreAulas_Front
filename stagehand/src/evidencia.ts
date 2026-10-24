import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { TestSession } from './stagehand.js'

const DIR = path.resolve('reports')

export async function guardarEvidencia(
  session: TestSession,
  nombre: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  mkdirSync(DIR, { recursive: true })
  const png = path.join(DIR, `${nombre}.png`)
  const bytes = await session.page.screenshot({ path: png, fullPage: true })
  if (bytes?.length) writeFileSync(png, bytes)
  const metrics = await session.stagehand.metrics()
  const json = path.join(DIR, `${nombre}.json`)
  writeFileSync(
    json,
    JSON.stringify(
      {
        nombre,
        fecha: new Date().toISOString(),
        url: await session.page.url(),
        metrics,
        ...extra,
      },
      null,
      2
    )
  )
  console.log(`Evidencia: ${png}`)
  console.log(`Métricas: ${json}`)
}

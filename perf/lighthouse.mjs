#!/usr/bin/env node
/**
 * Lighthouse sobre las pantallas de login (RQ2), recuperación (RQ3) y restablecer (RQ5).
 * Usa `npx lighthouse` (se descarga la primera vez) con Chrome headless.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   CHROME_PATH=/ruta/a/chrome npm run perf:lighthouse
 *
 * Variables: FRONT_URL (por defecto http://localhost:4173), CHROME_PATH (por defecto Chromium de Playwright
 * si existe en ~/.cache/ms-playwright), PERFIL=movil|escritorio (por defecto escritorio).
 * Criterios: performance ≥ 80, LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms, FCP ≤ 1,8 s, best-practices ≥ 90.
 * Sale con 1 si alguna pantalla incumple. Informes en reports/rendimiento/lighthouse-*.json.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const url = (process.env.FRONT_URL || 'http://localhost:4173').replace(/\/$/, '')
const perfil = process.env.PERFIL || 'escritorio'

function buscarChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const raiz = path.join(os.homedir(), '.cache', 'ms-playwright')
  if (!existsSync(raiz)) return ''
  for (const carpeta of readdirSync(raiz).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) {
      const candidato = path.join(raiz, carpeta, rel)
      if (existsSync(candidato)) return candidato
    }
  }
  return ''
}

const chrome = buscarChrome()
if (!chrome) {
  console.error('No se encontró Chrome/Chromium. Define CHROME_PATH.')
  process.exit(2)
}

const pantallas = [
  { nombre: 'login', requisito: 'RQ2', ruta: '/login' },
  { nombre: 'forgot-password', requisito: 'RQ3', ruta: '/forgot-password' },
  { nombre: 'reset-password', requisito: 'RQ5', ruta: '/reset-password?token=abc&email=a%40b.co' },
]
const criterios = { performance: 80, bestPractices: 90, lcpMs: 2500, cls: 0.1, tbtMs: 200, fcpMs: 1800 }

mkdirSync(path.resolve('reports', 'rendimiento'), { recursive: true })
const resultados = []
for (const p of pantallas) {
  const salida = path.resolve('reports', 'rendimiento', `lighthouse-${p.nombre}.json`)
  const args = [
    '--yes', 'lighthouse@12', url + p.ruta, '--output=json', `--output-path=${salida}`, '--quiet',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ...(perfil === 'escritorio' ? ['--preset=desktop'] : []),
  ]
  console.log(`Lighthouse ${p.nombre} (${perfil})...`)
  const r = spawnSync('npx', args, { env: { ...process.env, CHROME_PATH: chrome }, encoding: 'utf8', timeout: 240_000 })
  if (r.status !== 0 || !existsSync(salida)) {
    console.error(`  falló: ${(r.stderr || r.stdout || '').split('\n').slice(-5).join('\n')}`)
    process.exitCode = 2
    continue
  }
  const lh = JSON.parse(readFileSync(salida, 'utf8'))
  const a = lh.audits
  const m = {
    pantalla: p.nombre, requisito: p.requisito, perfil,
    performance: Math.round(lh.categories.performance.score * 100),
    accesibilidad: Math.round(lh.categories.accessibility.score * 100),
    bestPractices: Math.round(lh.categories['best-practices'].score * 100),
    seo: Math.round(lh.categories.seo.score * 100),
    fcpMs: Math.round(a['first-contentful-paint'].numericValue),
    lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
    tbtMs: Math.round(a['total-blocking-time'].numericValue),
    cls: Math.round(a['cumulative-layout-shift'].numericValue * 1000) / 1000,
    pesoTotalKb: Math.round(a['total-byte-weight'].numericValue / 1024),
    problemas: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.title).slice(0, 8),
  }
  m.cumple = m.performance >= criterios.performance && m.bestPractices >= criterios.bestPractices && m.lcpMs <= criterios.lcpMs && m.cls <= criterios.cls && m.tbtMs <= criterios.tbtMs && m.fcpMs <= criterios.fcpMs
  resultados.push(m)
  console.log(`  ${m.cumple ? 'CUMPLE   ' : 'NO CUMPLE'} perf ${m.performance} | LCP ${m.lcpMs} ms | FCP ${m.fcpMs} ms | TBT ${m.tbtMs} ms | CLS ${m.cls} | best-practices ${m.bestPractices} | a11y ${m.accesibilidad} | ${m.pesoTotalKb} KB`)
}
writeFileSync(path.resolve('reports', 'rendimiento', 'lighthouse-resumen.json'), JSON.stringify({ fecha: new Date().toISOString(), url, criterios, resultados }, null, 2))
if (resultados.some((r) => !r.cumple)) process.exitCode = process.exitCode || 1

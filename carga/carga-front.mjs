#!/usr/bin/env node
/**
 * Prueba de carga del front estático (las pantallas de RQ2 login, RQ3 recuperar y RQ5 restablecer).
 * Sin dependencias: usuarios virtuales con fetch, por etapas. Mide tiempo de respuesta, tamaño transferido
 * y si el servidor comprime. Pensada para `vite preview`, la imagen nginx local o Vercel.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   FRONT_URL=http://localhost:4173 npm run perf:carga
 *
 * Variables: FRONT_URL (por defecto http://localhost:4173), ETAPAS (por defecto 1,10,50,100),
 *            DURACION_S (por defecto 10), TIMEOUT_MS (por defecto 10000), THINK_MS (por defecto 0).
 * Termina con código 1 si algún escenario incumple su criterio.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const config = {
  url: (process.env.FRONT_URL || 'http://localhost:4173').replace(/\/$/, ''),
  etapas: (process.env.ETAPAS || '1,10,50,100').split(',').map(Number).filter((n) => n > 0),
  duracionS: Number(process.env.DURACION_S || 10),
  timeoutMs: Number(process.env.TIMEOUT_MS || 10_000),
  thinkMs: Number(process.env.THINK_MS || 0),
}

// Criterio por escenario: p95 en ms y % máximo de errores. Local: la red no cuenta; en Vercel se suben.
const FACTOR = Number(process.env.FACTOR_P95 || 1)
const escenarios = [
  { nombre: 'login', requisito: 'RQ2', ruta: '/login', p95Ms: 300 * FACTOR },
  { nombre: 'forgot-password', requisito: 'RQ3', ruta: '/forgot-password', p95Ms: 300 * FACTOR },
  { nombre: 'reset-password', requisito: 'RQ5', ruta: '/reset-password?token=abc&email=a%40b.co', p95Ms: 300 * FACTOR },
  { nombre: 'inexistente-spa', requisito: 'RQ2', ruta: '/ruta/que/no/existe', p95Ms: 300 * FACTOR },
]
const maxErroresPct = 1
let bundle = null

const percentil = (ord, p) => (ord.length ? Math.round(ord[Math.min(ord.length - 1, Math.max(0, Math.ceil((p / 100) * ord.length) - 1))]) : 0)

async function pedir(ruta) {
  const inicio = performance.now()
  try {
    const r = await fetch(config.url + ruta, { headers: { 'Accept-Encoding': 'gzip, br' }, signal: AbortSignal.timeout(config.timeoutMs) })
    const bytes = (await r.arrayBuffer()).byteLength
    return { ms: performance.now() - inicio, estado: r.status, ok: r.status === 200, bytes, codificacion: r.headers.get('content-encoding') || 'ninguna', cabeceras: r.headers }
  } catch (e) {
    return { ms: performance.now() - inicio, estado: e?.name === 'TimeoutError' ? 'timeout' : 'red', ok: false, bytes: 0, codificacion: '-', cabeceras: new Headers() }
  }
}

async function descubrirBundle() {
  const html = await (await fetch(config.url + '/')).text()
  const js = /src=["']([^"']+\.js)["']/.exec(html)?.[1]
  if (js) bundle = { nombre: 'bundle-js-principal', requisito: 'RQ2', ruta: js.startsWith('/') ? js : `/${js}`, p95Ms: 600 * FACTOR }
}

async function usuarioVirtual(lista, hasta, muestras, desfase) {
  let i = desfase
  while (performance.now() < hasta) {
    const e = lista[i++ % lista.length]
    muestras[e.nombre].push(await pedir(e.ruta))
    if (config.thinkMs) await new Promise((r) => setTimeout(r, config.thinkMs))
  }
}

async function main() {
  await descubrirBundle()
  const lista = bundle ? [...escenarios, bundle] : escenarios
  console.log(`Front: ${config.url} | etapas: ${config.etapas.join(', ')} usuarios | ${config.duracionS} s por etapa`)
  const sonda = await pedir('/login')
  if (!sonda.ok) throw new Error(`El front no responde 200 en ${config.url}/login (estado ${sonda.estado})`)
  const cabecerasSeguridad = Object.fromEntries(
    ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'strict-transport-security', 'content-encoding', 'server'].map((h) => [h, sonda.cabeceras.get(h) ?? null])
  )

  const etapas = []
  for (const usuarios of config.etapas) {
    const muestras = Object.fromEntries(lista.map((e) => [e.nombre, []]))
    const inicio = performance.now()
    await Promise.all(Array.from({ length: usuarios }, (_, i) => usuarioVirtual(lista, inicio + config.duracionS * 1000, muestras, i)))
    const segundos = (performance.now() - inicio) / 1000
    const resultados = lista.map((e) => {
      const m = muestras[e.nombre]
      const ord = m.map((x) => x.ms).sort((a, b) => a - b)
      const errores = m.filter((x) => !x.ok).length
      const erroresPct = m.length ? Math.round((errores / m.length) * 10000) / 100 : 100
      const p95 = percentil(ord, 95)
      return {
        escenario: e.nombre, requisito: e.requisito, peticiones: m.length, rps: Math.round((m.length / segundos) * 10) / 10,
        p50: percentil(ord, 50), p95, p99: percentil(ord, 99), max: Math.round(ord.at(-1) ?? 0), erroresPct,
        bytesPorRespuesta: m[0]?.bytes ?? 0, compresion: m[0]?.codificacion ?? '-',
        criterio: { p95Ms: e.p95Ms, maxErroresPct }, cumple: m.length > 0 && p95 <= e.p95Ms && erroresPct <= maxErroresPct,
      }
    })
    etapas.push({ usuarios, resultados })
    console.log(`\nEtapa: ${usuarios} usuario(s)`)
    for (const r of resultados) {
      console.log(`  ${r.cumple ? 'OK ' : 'MAL'} ${r.escenario.padEnd(20)} p50 ${r.p50} ms | p95 ${r.p95} ms (≤ ${r.criterio.p95Ms}) | ${r.rps} rps | ${Math.round(r.bytesPorRespuesta / 1024)} KB descomprimido (${r.compresion}) | errores ${r.erroresPct} %`)
    }
  }

  const fecha = new Date().toISOString()
  const carpeta = path.resolve('reports', 'carga')
  mkdirSync(carpeta, { recursive: true })
  const base = path.join(carpeta, `carga-front-${fecha.replace(/[:.]/g, '-')}`)
  writeFileSync(`${base}.json`, JSON.stringify({ fecha, destino: new URL(config.url).host, config, cabecerasSeguridad, etapas }, null, 2))
  console.log(`\nCabeceras de respuesta: ${JSON.stringify(cabecerasSeguridad)}`)
  console.log(`Reporte: ${base}.json`)
  const fallos = etapas.flatMap((e) => e.resultados.filter((r) => !r.cumple).map((r) => `${r.escenario}@${e.usuarios}`))
  if (fallos.length) {
    console.log(`Incumplen el criterio: ${fallos.join(', ')}`)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

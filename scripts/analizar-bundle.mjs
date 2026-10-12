#!/usr/bin/env node
/**
 * Presupuesto de peso del bundle (rendimiento de carga de las pantallas de login y recuperación, RQ2/RQ3/RQ5).
 * Todo lo que referencia index.html se descarga ANTES de pintar el login: ese es el "peso inicial".
 *
 *   npm run build && npm run perf:bundle
 *   DIST=ruta/a/otro/dist npm run perf:bundle
 *
 * Presupuestos (ajustables por variable de entorno, en KB):
 *   PRESUPUESTO_JS_INICIAL_GZ_KB   300   JS inicial comprimido con gzip
 *   PRESUPUESTO_INICIAL_GZ_KB      350   JS + CSS iniciales comprimidos
 *   PRESUPUESTO_IMAGEN_KB          500   cualquier imagen individual
 *
 * Escribe reports/rendimiento/bundle.json. Sale con 1 si algún presupuesto se incumple.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = path.resolve(process.env.DIST || 'dist')
if (!existsSync(path.join(dist, 'index.html'))) {
  console.error(`No existe ${dist}/index.html: ejecuta "npm run build" antes.`)
  process.exit(2)
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10
const presupuesto = {
  jsInicialGz: Number(process.env.PRESUPUESTO_JS_INICIAL_GZ_KB || 300),
  inicialGz: Number(process.env.PRESUPUESTO_INICIAL_GZ_KB || 350),
  imagen: Number(process.env.PRESUPUESTO_IMAGEN_KB || 500),
}

function archivos(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(path.join(carpeta, e.name)) : [path.join(carpeta, e.name)]
  )
}
const medidas = (ruta) => {
  const buf = readFileSync(ruta)
  return { archivo: path.relative(dist, ruta), bytes: buf.length, gzBytes: gzipSync(buf).length }
}

const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
const iniciales = [...html.matchAll(/(?:src|href)=["']\/?([^"']+\.(?:js|css))["']/g)].map((m) => m[1])
const inicial = iniciales.filter((f) => existsSync(path.join(dist, f))).map((f) => medidas(path.join(dist, f)))
const todos = archivos(dist).map(medidas)
const imagenes = todos.filter((f) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f.archivo))

const sumar = (lista, campo) => lista.reduce((a, f) => a + f[campo], 0)
const jsInicial = inicial.filter((f) => f.archivo.endsWith('.js'))
const resultado = {
  fecha: new Date().toISOString(),
  dist,
  inicial: { archivos: inicial.map((f) => ({ ...f, kb: kb(f.bytes), gzKb: kb(f.gzBytes) })) },
  jsInicialKb: kb(sumar(jsInicial, 'bytes')),
  jsInicialGzKb: kb(sumar(jsInicial, 'gzBytes')),
  inicialGzKb: kb(sumar(inicial, 'gzBytes')),
  totalKb: kb(sumar(todos, 'bytes')),
  archivosJs: todos.filter((f) => f.archivo.endsWith('.js')).length,
  masPesados: [...todos].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((f) => ({ archivo: f.archivo, kb: kb(f.bytes), gzKb: kb(f.gzBytes) })),
  imagenesPesadas: imagenes.filter((f) => f.bytes > presupuesto.imagen * 1024).map((f) => ({ archivo: f.archivo, kb: kb(f.bytes) })),
  presupuesto,
}
resultado.cumple = {
  jsInicialGz: resultado.jsInicialGzKb <= presupuesto.jsInicialGz,
  inicialGz: resultado.inicialGzKb <= presupuesto.inicialGz,
  imagenes: resultado.imagenesPesadas.length === 0,
}

mkdirSync(path.resolve('reports', 'rendimiento'), { recursive: true })
writeFileSync(path.resolve('reports', 'rendimiento', 'bundle.json'), JSON.stringify(resultado, null, 2))

const marca = (ok) => (ok ? 'CUMPLE   ' : 'NO CUMPLE')
console.log(`Bundle (${dist})`)
console.log(`  ${marca(resultado.cumple.jsInicialGz)} JS inicial   ${resultado.jsInicialKb} KB → ${resultado.jsInicialGzKb} KB gzip (presupuesto ${presupuesto.jsInicialGz} KB gzip; ${resultado.archivosJs} archivos JS en total)`)
console.log(`  ${marca(resultado.cumple.inicialGz)} JS+CSS inicial ${resultado.inicialGzKb} KB gzip (presupuesto ${presupuesto.inicialGz} KB)`)
console.log(`  ${marca(resultado.cumple.imagenes)} Imágenes > ${presupuesto.imagen} KB: ${resultado.imagenesPesadas.map((i) => `${i.archivo} (${i.kb} KB)`).join(', ') || 'ninguna'}`)
console.log('  Más pesados:', resultado.masPesados.slice(0, 5).map((f) => `${f.archivo} ${f.kb} KB`).join(' | '))
if (!Object.values(resultado.cumple).every(Boolean)) process.exitCode = 1

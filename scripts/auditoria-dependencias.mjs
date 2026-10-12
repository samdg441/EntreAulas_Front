#!/usr/bin/env node
/**
 * Auditoría de dependencias del front (RQ1–RQ5: la superficie de ataque del login y la recuperación
 * incluye todo lo que entra en el bundle). Ejecuta `npm audit` y falla con vulnerabilidades altas o críticas.
 *
 *   npm run test:audit            # solo dependencias de producción (lo que llega al usuario)
 *   TODAS=true npm run test:audit # también devDependencies
 *
 * Escribe reports/seguridad/auditoria-dependencias.json. Requiere red (consulta el registro de npm).
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const todas = process.env.TODAS === 'true'
const args = ['audit', '--json', ...(todas ? [] : ['--omit=dev'])]
const r = spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

let informe
try {
  informe = JSON.parse(r.stdout)
} catch {
  console.error('No se pudo leer la respuesta de npm audit (¿sin red?):\n', r.stderr || r.stdout)
  process.exit(2)
}
if (informe.error) {
  console.error('npm audit falló:', informe.error.summary || informe.error.code)
  process.exit(2)
}

const meta = informe.metadata?.vulnerabilities ?? {}
const detalle = Object.values(informe.vulnerabilities ?? {}).map((v) => ({
  paquete: v.name,
  severidad: v.severity,
  directa: v.isDirect,
  rango: v.range,
  arreglo: v.fixAvailable === false ? 'sin arreglo' : typeof v.fixAvailable === 'object' ? `${v.fixAvailable.name}@${v.fixAvailable.version}` : 'sí',
  avisos: (v.via ?? []).filter((x) => typeof x === 'object').map((x) => x.title).slice(0, 3),
}))

const dependencias = JSON.parse(readFileSync('package.json', 'utf8')).dependencies ?? {}
const sospechosas = ['postgres', 'pg', 'mysql', 'mongodb', 'sequelize'].filter((n) => n in dependencias)

const carpeta = path.resolve('reports', 'seguridad')
mkdirSync(carpeta, { recursive: true })
const salida = { fecha: new Date().toISOString(), alcance: todas ? 'todas' : 'producción', resumen: meta, detalle, dependenciasDeBackEnElFront: sospechosas }
writeFileSync(path.join(carpeta, 'auditoria-dependencias.json'), JSON.stringify(salida, null, 2))

console.log(`Alcance: ${salida.alcance} | críticas ${meta.critical ?? 0} · altas ${meta.high ?? 0} · moderadas ${meta.moderate ?? 0} · bajas ${meta.low ?? 0}`)
for (const d of detalle.filter((x) => ['critical', 'high'].includes(x.severidad))) {
  console.log(`  ${d.severidad.toUpperCase().padEnd(8)} ${d.paquete}${d.directa ? ' (directa)' : ''} — ${d.avisos.join('; ') || d.rango} — arreglo: ${d.arreglo}`)
}
if (sospechosas.length) console.log(`Aviso: dependencias de servidor dentro del front: ${sospechosas.join(', ')}`)

if ((meta.critical ?? 0) + (meta.high ?? 0) > 0) {
  console.log('NO CUMPLE: hay vulnerabilidades altas o críticas.')
  process.exitCode = 1
} else {
  console.log('CUMPLE: 0 vulnerabilidades altas o críticas.')
}

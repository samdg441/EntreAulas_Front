import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

function unidadEnMayuscula(ruta) {
  return ruta.replace(/^([a-z]):/, (_, letra) => `${letra.toUpperCase()}:`)
}

const vitest = unidadEnMayuscula(
  path.resolve(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'),
)
const cwd = unidadEnMayuscula(process.cwd())

const child = spawn(process.execPath, [vitest, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})

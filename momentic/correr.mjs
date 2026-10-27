import { spawn } from 'node:child_process'
import { setTimeout as esperar } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const back = spawn(process.execPath, ['momentic/back-simulado.mjs'], { cwd: raiz, stdio: 'inherit' })

const listo = async () => {
  for (let intento = 0; intento < 30; intento += 1) {
    try {
      const respuesta = await fetch('http://localhost:3000/api/health')
      if (respuesta.ok) return
    } catch {
      /* el puerto todavía no escucha */
    }
    await esperar(200)
  }
  throw new Error('El back de Momentic no respondió en el puerto 3000')
}

let codigo = 1
try {
  await listo()
  const extra = process.argv.slice(2)
  codigo = await new Promise((resolve) => {
    const prueba = spawn('npx', ['momentic', 'run', '--yes', ...extra], { cwd: raiz, stdio: 'inherit', shell: true })
    prueba.on('exit', (salida) => resolve(salida ?? 1))
  })
} finally {
  back.kill()
}

process.exit(codigo)

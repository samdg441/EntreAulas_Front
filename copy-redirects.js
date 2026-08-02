import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url))
const source = join(root, 'public', '_redirects')
const fallback = join(root, '_redirects')
const dest = join(root, 'dist', '_redirects')

const from = existsSync(source) ? source : fallback
if (!existsSync(from)) {
  console.warn('copy-redirects: no se encontró _redirects; se omite.')
  process.exit(0)
}

mkdirSync(dirname(dest), { recursive: true })
copyFileSync(from, dest)
console.log('copy-redirects: _redirects copiado a dist/')

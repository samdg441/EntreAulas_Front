import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Jenkins consulta /version.json para confirmar qué commit está publicado en Vercel.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'dist', 'version.json')
const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null

mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, JSON.stringify({ commit }))
console.log(`write-version: commit ${commit ?? 'desconocido'}`)

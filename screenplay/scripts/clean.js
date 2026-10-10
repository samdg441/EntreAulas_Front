const fs = require('node:fs')
const path = require('node:path')

for (const carpeta of ['../reports/serenity-js', 'descargas']) {
  fs.rmSync(path.resolve(__dirname, '..', carpeta), { recursive: true, force: true })
}

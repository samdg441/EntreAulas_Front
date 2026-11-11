/**
 * Complejidad ciclomática V(G) = decisiones + 1 por función, con el compilador de TypeScript.
 * Decisiones: if, for/for-in/for-of, while, do, case (no default), catch, ?: , && , || , ??
 *
 *   node scripts/complejidad-ciclomatica.mjs <archivo.ts> [...]  [--json]
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const args = process.argv.slice(2)
const json = args.includes('--json')
const archivos = args.filter((a) => !a.startsWith('--'))

const SON_FUNCION = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
])

function decisiones(nodo) {
  let n = 0
  const visitar = (hijo) => {
    switch (hijo.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
        n += 1
        break
      case ts.SyntaxKind.BinaryExpression: {
        const k = hijo.operatorToken.kind
        if (k === ts.SyntaxKind.AmpersandAmpersandToken || k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken) n += 1
        break
      }
    }
    // Una función anidada se cuenta aparte.
    if (hijo !== nodo && SON_FUNCION.has(hijo.kind)) return
    ts.forEachChild(hijo, visitar)
  }
  ts.forEachChild(nodo, visitar)
  return n
}

const filas = []
for (const archivo of archivos) {
  const fuente = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true)
  const recorrer = (nodo) => {
    if (SON_FUNCION.has(nodo.kind)) {
      let nombre = nodo.name?.getText(fuente)
      if (!nombre && nodo.parent?.kind === ts.SyntaxKind.VariableDeclaration) nombre = nodo.parent.name.getText(fuente)
      if (!nombre && nodo.parent?.kind === ts.SyntaxKind.PropertyAssignment) nombre = nodo.parent.name.getText(fuente)
      if (nombre) {
        const { line } = fuente.getLineAndCharacterOfPosition(nodo.getStart(fuente))
        filas.push({ archivo: path.basename(archivo), funcion: nombre, linea: line + 1, vg: decisiones(nodo) + 1 })
      }
    }
    ts.forEachChild(nodo, recorrer)
  }
  recorrer(fuente)
}

if (json) console.log(JSON.stringify(filas, null, 2))
else {
  console.log('| Archivo | Función | Línea | V(G) | Caminos independientes | Riesgo |\n|---|---|---|---|---|---|')
  for (const f of filas) console.log(`| ${f.archivo} | ${f.funcion} | ${f.linea} | ${f.vg} | ${f.vg} | ${f.vg <= 5 ? 'Bajo' : f.vg <= 10 ? 'Moderado' : 'Alto'} |`)
}

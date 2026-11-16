# Comandos para correr las pruebas de Esteban Arias

Funcionalidades:

- Creación de encuestas (RF-ENC-32 y RF-ENC-33).
- Selección de la encuesta a usar (RF-EVAL-11, RF-EVAL-12 y RF-ACA-27).
- Notificaciones (RF-NOT-34 y RF-NOT-35).

Todos los comandos se escriben desde la carpeta `EntreAulas-RealG`, que contiene `EntreAulas_Front` y `EntreAulas_Back`. Están en sintaxis de **Git Bash**. Donde hay variables de entorno, se da también la forma de **PowerShell**.

## 0. Preparación (una sola vez)

| Necesita | Versión usada | Para qué |
|---|---|---|
| Node.js | 24.14 | Todo |
| Python + `deepeval` | 3.11 + 4.3.2 | Punto 14 (DeepEval) |
| Ollama con `qwen2.5:7b` | 0.40 | Punto 14 (Stagehand y DeepEval) |
| Docker Desktop | — | SonarQube, Jenkins y Healenium |
| Google Chrome | — | Cypress y Stagehand |

```bash
cd EntreAulas_Back  && npm ci && cd ..
cd EntreAulas_Front && npm ci && cd ..
cd EntreAulas_Front/e2e        && npm ci && cd ../..
cd EntreAulas_Front/stagehand  && npm ci && cd ../..
cd EntreAulas_Front/healenium  && npm ci && cd ../..
pip install deepeval==4.3.2
ollama pull qwen2.5:7b
```

### Servidores que piden algunas pruebas

| Servidor | Comando (en otra terminal) | Lo usan |
|---|---|---|
| Front en `localhost:3001` | `cd EntreAulas_Front && npm run dev` | Cypress, BDD, Stagehand, Healenium |
| Back en `localhost:3000` | `cd EntreAulas_Back && npm run dev` | Cypress API y DAST (punto 13). **No** debe estar arriba con Stagehand, que levanta su propio back simulado en el 3000 |
| SonarQube y Jenkins | `docker compose -f EntreAulas_Front/ci/docker-compose.ci.yml up -d` | Punto 13 y pipeline |
| Healenium | `cd EntreAulas_Front/healenium && npm run up` | Punto 14 |

> **Cypress desde la terminal de VS Code.** Si termina con `Illegal instruction` o con el código `3221225501`, la causa es la variable `ELECTRON_RUN_AS_NODE`, que VS Code hereda a la terminal. Anteponga `env -u ELECTRON_RUN_AS_NODE` (Git Bash). En PowerShell, ejecute primero `Remove-Item Env:ELECTRON_RUN_AS_NODE`.

---

## Resumen rápido

| Punto | Prueba | Comando | Resultado esperado |
|---|---|---|---|
| 6 | TDD + unitarias (front) con cobertura | `cd EntreAulas_Front && npm run test:esteban` | 50/50 |
| 6 | TDD + API (back) con cobertura | `cd EntreAulas_Back && npm run test:esteban` | 31/31 |
| 7 | Cypress de interfaz | `cd EntreAulas_Front/e2e && npm run cy:esteban` | 14/14 |
| 7 | Cypress de API contra el back | `cd EntreAulas_Front/e2e && API_URL=http://localhost:3000 npm run cy:esteban:api` | 10 pasan y 6 se omiten sin token |
| 8 | Gherkin + Screenplay | `cd EntreAulas_Front/e2e && npm run cy:bdd:esteban` | 17/17 |
| 10 | Regresión (front) | `cd EntreAulas_Front && npm run test:regresion:esteban` | 16/16 |
| 10 | Regresión (back) | `cd EntreAulas_Back && npm run test:regresion:esteban` | 15/15 |
| 13 | Seguridad OWASP (back) | `cd EntreAulas_Back && npx vitest run src/test/security/rf-enc-32-33.security.test.ts` | 32/32 |
| 13 | Seguridad OWASP (front) | `cd EntreAulas_Front && node scripts/vitest.mjs run src/test/security/esteban-encuestas.security.test.tsx` | 18/18 |
| 13 | DAST contra el servidor | `cd EntreAulas_Front/e2e && API_URL=http://localhost:3000 npx cypress run --e2e --config-file cypress.api.config.ts --spec cypress/e2e/security/esteban-seguridad-api.cy.ts` | 9/9 |
| 14 | Revisor de IA (pruebas deterministas) | `cd EntreAulas_Back && npx vitest run src/test/unit/evaluaciones/revisor-preguntas.test.ts` | 18/18 |
| 14 | DeepEval | `python EntreAulas_Front/ia-testing/deepeval/esteban/evaluar_revisor.py --version=v3 --sin-juez` | Exactitud 0,842 |
| 14 | Stagehand | `cd EntreAulas_Front/stagehand && npm run test:esteban` | 13 pasos, 6 respaldos |
| 14 | Cypress Cloud + `cy.prompt` | `cd EntreAulas_Front/e2e && npm run cy:prompt:esteban` | 6/6 (con sesión de Cypress Cloud) |
| 14 | Healenium (anexo, descartado) | `cd EntreAulas_Front/healenium && PAGINA=despues npm run test:esteban:control` | 2/2 reparados en el control |
| 15 | Defectos DEF-51 a DEF-53 | `cd EntreAulas_Back && npx vitest run --config vitest.defects.config.mts src/test/defects/DEF-51-53-errores-de-preguntas.test.ts` | 7/7 |
| — | Suites completas | `cd EntreAulas_Front && npm test` · `cd EntreAulas_Back && npx vitest run` | 860/860 · 1131/1131 |

El detalle de cada punto sigue abajo.

---

## Punto 6 — TDD y pruebas unitarias

```bash
# Front: unitarias, integración y cobertura de preguntas-encuesta.ts, seleccion-encuesta.ts,
# notificaciones.ts, surveys.api.ts y AdminSurveysPage.tsx → coverage-esteban/index.html
cd EntreAulas_Front
npm run test:esteban

# Solo el ciclo TDD de RF-ENC-33
node scripts/vitest.mjs run src/test/unit/evaluaciones/rf-enc-33-corregir-pregunta.test.ts src/test/unit/evaluaciones/rf-enc-33-surveys-api.test.ts

# FIRST: tres corridas en orden aleatorio
node scripts/vitest.mjs run src/test/unit/evaluaciones src/test/integration/rf-enc-32-33-encuesta.test.tsx --sequence.shuffle --sequence.seed=1000

# Back: API con Supertest y cobertura del controlador → coverage-esteban/index.html
cd ../EntreAulas_Back
npm run test:esteban
```

## Punto 7 — Cypress y pruebas de API

```bash
# Interfaz (front en 3001; el back se simula con cy.intercept)
cd EntreAulas_Front/e2e
npm run cy:esteban

# API contra el back local (back en 3000)
API_URL=http://localhost:3000 npm run cy:esteban:api
# PowerShell:  $env:API_URL="http://localhost:3000"; npm run cy:esteban:api

# Los 6 casos con sesión necesitan un token de coordinador; sin él se omiten
CYPRESS_TOKEN_COORDINADOR=<jwt> API_URL=http://localhost:3000 npm run cy:esteban:api

# Supertest (back)
cd ../../EntreAulas_Back
npx vitest run src/test/api/rf-enc-32-33-preguntas.api.test.ts
```

## Punto 8 — Gherkin, BDD y Screenplay

```bash
cd EntreAulas_Front/e2e
npm run cy:bdd:esteban

# Una sola característica
npx cypress run --e2e --config-file cypress.bdd.config.ts --spec cypress/features/esteban-notificaciones.feature
```

El informe HTML de Cucumber queda en `EntreAulas_Front/reports/cypress/bdd/cucumber-report.html`.

## Punto 10 — Regresión

```bash
cd EntreAulas_Front && npm run test:regresion:esteban
cd ../EntreAulas_Back && npm run test:regresion:esteban
```

Correr la misma suite contra la versión anterior (línea base) usa un worktree temporal. Ver `docs/pruebas/10-REGRESION.md`, sección 6.

## Punto 13 — Seguridad

```bash
# Pruebas OWASP
cd EntreAulas_Back  && npx vitest run src/test/security/rf-enc-32-33.security.test.ts
cd ../EntreAulas_Front && node scripts/vitest.mjs run src/test/security/esteban-encuestas.security.test.tsx

# DAST contra el servidor en ejecución (back en 3000)
cd e2e && API_URL=http://localhost:3000 npx cypress run --e2e --config-file cypress.api.config.ts --spec cypress/e2e/security/esteban-seguridad-api.cy.ts
cd ../..

# Revisión de dependencias
cd EntreAulas_Back  && npm audit --omit=dev
cd ../EntreAulas_Front && npm audit --omit=dev

# SonarQube (en http://localhost:9000, con un token de análisis de cada proyecto)
cd ../EntreAulas_Back  && SONAR_TOKEN=<token-back>  npm run sonar
cd ../EntreAulas_Front && SONAR_TOKEN=<token-front> npm run sonar
# PowerShell:  $env:SONAR_TOKEN="<token>"; npm run sonar
```

`npm run sonar` en el front modifica `coverage/index.html`, que está versionado. Después de correrlo, restáurelo con `git checkout -- coverage/index.html`.

## Punto 14 — IA aplicada a testing

### DeepEval (revisor de preguntas con IA)

```bash
cd EntreAulas_Front/ia-testing/deepeval/esteban

# Conjunto principal (19 casos), sin juez: unos 45 s con el modelo ya cargado
python evaluar_revisor.py --version=v3 --sin-juez

# Con el juez GEval (Ollama): unos 15 min en CPU
python evaluar_revisor.py --version=v3

# Conjunto de reserva (8 casos nuevos)
python evaluar_revisor.py --version=v3-holdout --casos=casos_holdout.json --sin-juez

# Con Gemini (usa GOOGLE_GEMINI_API_KEY del .env del back). OJO: el plan gratuito permite 20 solicitudes por día
python evaluar_revisor.py --version=v3-holdout-gemini --casos=casos_holdout.json --proveedor=gemini --sin-juez
```

En Windows, si la consola falla con `UnicodeEncodeError`, anteponga `PYTHONIOENCODING=utf-8`. En PowerShell: `$env:PYTHONIOENCODING="utf-8"`.

### Stagehand

El front debe estar en el 3001, y **no** debe haber nada en el 3000: el escenario levanta allí su back simulado.

```bash
cd EntreAulas_Front/stagehand
HEADLESS=true CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" OLLAMA_MODEL=qwen2.5:7b npm run test:esteban
# PowerShell:
#   $env:HEADLESS="true"; $env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"; $env:OLLAMA_MODEL="qwen2.5:7b"; npm run test:esteban
```

Las capturas y las métricas de tokens quedan en `stagehand/reports/esteban-*.png` y `stagehand/reports/esteban-*.json`.

### Cypress Cloud + `cy.prompt`

Requiere haber iniciado sesión en Cypress Cloud desde la app (`npx cypress open`, luego **Log in**) o grabar la corrida. El proyecto es `frajcp`.

```bash
cd EntreAulas_Front/e2e

# Local (usa la sesión de Cloud de la app)
npm run cy:prompt:esteban

# Grabado en Cypress Cloud, junto con el spec de interfaz del punto 7
CYPRESS_RECORD_KEY=<record-key> npx cypress run --e2e --browser chrome --record --tag esteban,punto-14   --config '{"specPattern":["cypress/e2e/studio/esteban-prompt.cy.ts","cypress/e2e/ui/rf-enc-not-eval.cy.ts"]}'
# PowerShell:  $env:CYPRESS_RECORD_KEY="<record-key>"; npx cypress run --e2e --browser chrome --record --tag esteban,punto-14 --config '{\"specPattern\":[\"cypress/e2e/studio/esteban-prompt.cy.ts\",\"cypress/e2e/ui/rf-enc-not-eval.cy.ts\"]}'
```

**Studio AI** (interactivo): ejecute `npx cypress open`, elija E2E y Chrome, abra `ui/rf-enc-not-eval.cy.ts`, pulse **Edit in Studio** en una prueba, recorra la pantalla y pulse **Save**.

### Healenium (anexo: probado y descartado)

```bash
cd EntreAulas_Front/healenium
npm run up        # Healenium + Selenium Grid; el informe queda en http://localhost:7878/healenium/report/

# Experimento de control (página sin Tailwind): aquí sí repara
PAGINA=antes   CORRIDA=c1-base           npm run test:esteban:control   # guarda las huellas
PAGINA=despues HEALENIUM_URL=http://localhost:4444/wd/hub CORRIDA=c2-sin-healenium npm run test:esteban:control  # se rompe
PAGINA=despues CORRIDA=c3-con-healenium  npm run test:esteban:control   # Healenium repara 2/2

# Pantallas reales de EntreAulas, en tres corridas
# 1) Línea base contra la versión ANTERIOR al refactor del punto 13 (commit 2e39b9e) en el puerto 3002:
git -C .. worktree add ../../front-antes13 2e39b9e
cp ../public/esteban-healenium-sw.js ../../front-antes13/public/
#    enlazar node_modules (PowerShell):  New-Item -ItemType Junction -Path ..\..\front-antes13\node_modules -Target ..\node_modules
#    servir en otra terminal:            cd ../../front-antes13 && node node_modules/vite/bin/vite.js --port 3002 --strictPort
FRONT_URL=http://host.docker.internal:3002 CORRIDA=1-base npm run test:esteban                                        # 12/12
# 2) Versión actual sin Healenium (directo al Grid):
HEALENIUM_URL=http://localhost:4444/wd/hub CORRIDA=2-sin-healenium npm run test:esteban                                # 5/7, se rompe
# 3) Versión actual con Healenium:
CORRIDA=3-con-healenium npm run test:esteban                                                                          # 5/7, ver nota
git -C .. worktree remove --force ../../front-antes13

# Reparaciones que guardó Healenium
docker exec postgres-db psql -U healenium_user -d healenium -c "select s.locator, r.locator, r.score from healenium.healing_result r join healenium.healing h on h.uid=r.healing_id join healenium.selector s on s.uid=h.selector_id order by r.create_date desc limit 5"

npm run down
```

**Nota sobre Healenium.** La corrida 3 sobre EntreAulas **termina 5/7, igual que sin Healenium**. Healenium intenta reparar («Trying to heal…» en `docker logs hlm-proxy`), pero genera un selector CSS inválido con las clases de Tailwind (`max-h-[90vh]`, `sm:p-4`…) y Chrome lo rechaza (`InvalidSelectorException`). El control sin Tailwind confirma que el mecanismo sí funciona. Ver `docs/pruebas/14-IA.md`, sección 4.

## Punto 15 — Defectos corregidos en la refactorización

```bash
cd EntreAulas_Back
npx vitest run --config vitest.defects.config.mts src/test/defects/DEF-51-53-errores-de-preguntas.test.ts   # 7/7

# Suite completa de defectos del equipo: 47 fallan a propósito (defectos abiertos de otros integrantes)
npm run test:defects
```

## Pipeline (punto 9)

El Jenkinsfile de cada repositorio ya corre `npm run test:coverage`, que incluye unitarias, integración, regresión, API y seguridad. Después corre SonarQube y el Quality Gate. Para lanzarlo, abra Jenkins en `http://localhost:8080` y ejecute el job del repositorio.

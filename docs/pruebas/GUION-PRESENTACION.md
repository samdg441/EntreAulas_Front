# Guion de la presentación: RQ1–RQ5 (Juliana Franco), unos 12 minutos

## 1. Contexto (1 min)
- EntreAulas: evaluación docente de la Universidad de Medellín. El equipo tiene cuatro integrantes y cada uno es dueño de sus funcionalidades.
- **Mis seis funcionalidades:**
  - RQ1: alta de usuarios desde admin
  - RQ2: login
  - RQ3.1: solicitud de recuperación
  - RQ3.2: validación del token
  - RQ4: envío del correo
  - RQ5: restablecer contraseña
- Mostrar la tabla del §1.1 de [`PLAN-DE-PRUEBAS-RQ1-RQ5.md`](PLAN-DE-PRUEBAS-RQ1-RQ5.md).

## 2. Plan y trazabilidad (1,5 min)
- Estrategia: línea base → detección → «defecto = prueba que falla» → corrección → Sonar → despliegue → regresión.
- Abrir [`MATRIZ-TRAZABILIDAD-RQ1-RQ5.csv`](MATRIZ-TRAZABILIDAD-RQ1-RQ5.csv) y filtrar por RQ5: requisito → caso → resultado antes/después → evidencia → defecto.

## 3. Demostración en vivo (5 min)
Antes de empezar, en otra terminal: `docker start entreaulas-back-container entreaulas-front-container sonarqube`.

| Qué mostrar | Comando | Qué señalar |
|---|---|---|
| App desplegada | Abrir `http://localhost:3001/login` | Login, «¿Olvidaste tu contraseña?», `/reset-password` |
| Cypress con interfaz | `cd e2e && env -u ELECTRON_RUN_AS_NODE npx cypress open --e2e --browser chromium` → `ui/rq1-registro-admin.cy.ts` | El caso `[DEF-FE-12]` que encontró el defecto |
| Gherkin + Screenplay | Abrir `cypress/features/rq5-restablecer-contrasena.feature` y `cypress/screenplay/tasks/index.ts`; ejecutar `npm run cy:bdd:rq1-rq5` | Actor → tarea → interacción → pregunta; reporte `reports/cypress/bdd/cucumber-report.html` |
| Seguridad contra el despliegue | `API_URL=http://localhost:3000 npm run cy:security` | Los casos `[DEF-34/35/38/43]` que fallaban en Render ahora pasan |
| Playwright con IA | `cd ia-testing/playwright && npm test && npm run report` | `specs/plan-rq1-rq5.md` (plan del agente), traza de una prueba |
| Stagehand | Abrir `docs/pruebas/evidencias/stagehand/rq3-1-rq4-solicitud-ollama.png` y el `.json` | observe → act → extract; métricas de tokens; 0 respaldos |
| Defectos antes/después | Back: `npm run test:defects -- DEF-39 DEF-34 DEF-42` | Antes en rojo (`docs/pruebas/antes/back-defects.txt`), ahora en verde |
| Sonar | `http://localhost:9000/dashboard?id=EntreAulas_Back` → *Activity* | antes OK → 1.er refactor ERROR (duplicación) → final OK con 0 % |

## 4. Resultados y métricas (2 min)
- Usar la tabla del §1 de [`ANTES-DESPUES-RQ1-RQ5.md`](ANTES-DESPUES-RQ1-RQ5.md).
- **Defectos:** 20 en total, 19 corregidos. El crítico, DEF-39, permitía crear administradores sin autenticarse.
- **Pruebas de defectos:** 0/47 → 48/49 en verde.
- **Suites funcionales:** 1024 (back) + 578 (front) en verde; Quality Gate OK en los dos proyectos.
- **Cobertura de ramas de RQ1–RQ5 en el back:** 90 % → 92 %.

## 5. Herramientas de IA (1,5 min)
- Leer [`ia-testing/ANALISIS-IA.md`](../../ia-testing/ANALISIS-IA.md).
- **Playwright:** el planner encontró DEF-FE-08; el healer reparó localizadores.
- **TestSprite:** mostrar `testsprite_tests/testsprite-mcp-test-report.md` y la grabación de un caso en su panel. Contar cómo se depuró el plan (falsos positivos de TC005 y TC009, y casos retirados) y el hallazgo TS-H7.
- **BugBug:** mostrar el PDF y explicar que solo 4 de 11 pruebas tenían una aserción.
- **Limitación clave:** la IA no conoce las reglas ocultas (un solo uso, mensaje genérico) y el healer puede ocultar defectos reales.

## 6. Conclusiones y recomendaciones (1 min)
- Mostrar el §7 y §8 de [`INFORME-FINAL-PRUEBAS-RQ1-RQ5.md`](INFORME-FINAL-PRUEBAS-RQ1-RQ5.md).
- **P0:** migración de DEF-42 en Supabase, y push con despliegue por Jenkins a Render y Vercel.
- **P1:** E2E dentro del pipeline; limitador en Redis si se escala.

## Aporte individual (para la diapositiva final)
- Pruebas unitarias, de regresión, API, componente, seguridad y Selenium de RQ1–RQ5 (entregas anteriores).
- En esta entrega:
  - Cypress (UI, API, seguridad, regresión y a11y)
  - BDD + Screenplay
  - Playwright con agentes, TestSprite y BugBug
  - Stagehand
  - 20 defectos con prueba, 19 corregidos
  - Refactor validado con Sonar
  - Despliegue en contenedores con verificación posterior
  - Plan, matriz e informe

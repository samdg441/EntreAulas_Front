# Línea base del front antes de la refactorización (RQ1–RQ5)

- **Fecha:** 2026-10-25
- **Rama:** `pruebas-Juliana`
- **Commit:** `b14a263` (tag `v-antes-refactor`)
- **Entorno:** Vitest con jsdom

## Resultados

| Suite | Comando | Archivos | Pruebas | Resultado | Log |
|---|---|---|---|---|---|
| Suite completa (unitarias, integración, regresión, API y seguridad) | `npm test` | 53 | 574 | 574 ✔ | `front-suite.txt` |
| Evidencias RQ1–RQ5 | `npm run test:evidencias` | 21 | 251 | 251 ✔ | `front-evidencias.txt` |
| Defectos (fallan a propósito mientras siguen abiertos) | `npm run test:defects` | 3 | 23 | 0 ✔ / 23 ✘ | `front-defects.txt` |

### Cobertura de RQ1–RQ5 (`coverage-rq1-rq5`)

| Métrica | Valor |
|---|---|
| Sentencias | 78,23 % |
| Ramas | 79,05 % |
| Funciones | 65,83 % |
| Líneas | 80,37 % |

## Defectos abiertos de RQ1–RQ5

| Defecto | RQ | Pruebas en rojo |
|---|---|---|
| DEF-FE-04: redirección abierta después del login (`?redirect=`) | RQ2 | 4/4 |
| DEF-FE-05: el despliegue (Vercel y nginx) no tiene cabeceras de seguridad | Transversal | 13/13 |
| DEF-FE-08: accesibilidad de los formularios de autenticación (labels, aria y anuncio de errores) | RQ1, RQ2, RQ3, RQ5 | 6/6 |

## Pruebas E2E que faltaban

En la línea base, RQ1–RQ5 solo tienen E2E en `screenplay-selenium`. No hay pruebas con Cypress, Playwright ni Stagehand para estos requisitos.

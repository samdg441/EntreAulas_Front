# 2. Ejecución, regresión y métricas

## 2.1 Entorno y datos
Equipo Linux (CachyOS, 16 GB), Node 26, Chromium 156. Front en Vite (:3001) y luego en nginx (contenedor); back simulado con `cy.intercept`/`page.route` (E2E) o Express real con Supabase simulado (Vitest). Datos sintéticos; ningún dato personal real.

## 2.2 Planeado vs. ejecutado

| Nivel | Ejecutado | Resultado | Observación (diferencia con lo diseñado) |
|---|---|---|---|
| Back Vitest (todo el repo) | 1115 (87 archivos), +88 de auditoría | 1115 ✔ | 1027 previas + 88 nuevas |
| Front Vitest | 773 (70 archivos), +176 nuevas | 773 ✔ | 597 previas + 176 nuevas |
| Cypress UI | 36 | 36 ✔ | +6 por defectos hallados |
| Cypress accesibilidad | 13 | 13 ✔ (tras corregir) | 1.ª pasada: 6/13 |
| Cypress seguridad / API | 8 / 7 | ✔ | +1 API (OpenAPI) |
| BDD Gherkin + Screenplay | 6 | 6 ✔ | — |
| Playwright (agentes) | 25 | 25 ✔ | 7 → 22 → 22 → 25 en 4 iteraciones |
| Stagehand | en ejecución local lenta | ver doc de IA | CPU limita |
| DeepEval | 30 + 3 | **No cumple** (DEF-IA-01/02) | hallazgo |
| Despliegue Docker | Cypress 64/64, Playwright 25/25 | ✔ | — |

Cobertura del código nuevo: Back 97.6 % líneas (auditoria.ts 100 %), Front 94.7 % líneas / 82.6 % ramas. Sonar (proyecto completo, alcance definido): Back 94.6 %, Front 95.3 %, **Quality Gate OK** en ambos, 0 bugs, 0 vulnerabilidades, code smells 12 / 15, duplicación 0 % / 5.3 %.

Defectos: 7 corregidos (DEF-AUD-01, DEF-REDI-00…05) y 3 abiertos (DEF-IA-01/02 y la deuda heredada). Densidad: 7 defectos propios / ~4 700 líneas nuevas.

## 2.3 Regresión (criterio 10)
Suite: 21 specs de Cypress de entregas previas (142 pruebas) + las suites Vitest.
1. **Línea base** (rama `testing`, sin mis cambios; worktree en otro puerto): 121 ✔, **11 ✘**, 10 omitidas.
2. **Rama final**: 121 ✔, **11 ✘** idénticas (`linea-base-testing-1/2.txt` vs `antes-nuevas-specs.txt`).
3. Conclusión: **0 regresiones nuevas**. Las 11 son pruebas obsoletas (p. ej. `ForbiddenPage` cambió a «Permisos insuficientes»).
4. El spec `rq22-rq24-dashboard-coordinador` se actualizó por el rediseño (selector de «Promedio general») y pasa 8/8.
5. Regresión automática propia: `auditoria-no-rompe-flujos` (5), `rediseno-paginacion-carrera` (3) y la suite completa tras cada corrección y tras `npm audit fix` (1115 y 773 verdes).

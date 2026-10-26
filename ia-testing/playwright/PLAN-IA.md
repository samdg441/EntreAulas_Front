# Playwright con agentes de IA para RQ1–RQ5

## Propósito

Usar los **agentes de prueba de Playwright** para que una IA genere pruebas E2E de RQ1–RQ5 a partir de la aplicación en ejecución, en lugar de escribirlas a mano:

| Agente | Qué hace |
|---|---|
| planner | Explora la aplicación y escribe un plan en Markdown |
| generator | Convierte ese plan en pruebas ejecutables |
| healer | Ejecuta las pruebas, diagnostica las fallas y repara los localizadores |

## Configuración

| Elemento | Detalle |
|---|---|
| Versión | `@playwright/test` 1.63.0 con Chromium |
| Inicialización | `npx playwright init-agents --loop=claude` |
| Agentes | `.claude/agents/playwright-test-{planner,generator,healer}.md` |
| Servidor MCP | `.mcp.json`: `npx playwright run-test-mcp-server` |
| Modelo del ciclo | Claude Code (Claude Opus) |
| Semilla | `seed.spec.ts` deja el front en `/login` con el back simulado |
| Back simulado | `fixtures/back-simulado.ts` (en memoria con `page.route`: cuentas, tokens de un solo uso y buzón de correos) |
| Configuración | `playwright.config.ts`: front en `:3001`, `trace: on`, capturas, video al fallar y reportes HTML y JUnit en `../../reports/playwright/` |

Para repetir el ciclo con los agentes interactivos, abre Claude Code en esta carpeta; el servidor MCP se carga desde `.mcp.json`. Luego pide:

1. "usa playwright-test-planner para planear RQ1–RQ5 con seed.spec.ts"
2. "usa playwright-test-generator para el plan specs/plan-rq1-rq5.md"
3. "usa playwright-test-healer para arreglar las pruebas que fallen"

## Ejecución del ciclo (2026-10-26)

1. **Planner.**
   - `specs/exploracion/explorar.spec.ts` recorre login, selector de tipo, forgot-password, reset-password (con enlace vigente e incompleto) y el modal de alta.
   - Guarda los snapshots ARIA en `specs/exploracion/*.aria.yml`. Es la misma representación que obtiene la herramienta `browser_snapshot` del agente.
   - Con eso el agente escribió `specs/plan-rq1-rq5.md`: 5 secciones, 24 escenarios y 3 hallazgos de exploración.
2. **Generator.**
   - Escribió `tests/rq*.spec.ts`, con un `describe` por sección del plan y un comentario `// spec:` y `// seed:` que los enlaza.
   - Usa localizadores por rol y nombre accesible (`getByRole`), como dicta la definición del agente. Esto convierte cada prueba también en una verificación de accesibilidad.
3. **Healer.**
   - En la primera ejecución pasaron 21 de 26 pruebas.
   - Las 4 fallas de RQ1 eran por modo estricto: el buscador de la tabla, que solo tiene placeholder y no tiene label, también coincidía con "Nombre", y el dominio aparecía en las celdas. El healer acotó los localizadores al formulario del modal.
   - La quinta falla (DEF-FE-08) **no se reparó en la prueba**: es un defecto real del producto y la prueba debe seguir en rojo hasta que se corrija.

## Resultados

| Momento | Pasan | Fallan | Comentario |
|---|---|---|---|
| Antes del healer | 21 | 5 | 4 por localizadores ambiguos y 1 por DEF-FE-08 |
| Después del healer (línea base) | 25 | 1 | La que falla es DEF-FE-08: el botón del ojo no tiene nombre accesible |
| Después de la refactorización | Ver `docs/pruebas/despues/` | | |

Las evidencias están en `docs/pruebas/evidencias/playwright/` (salida de consola y JUnit). El reporte HTML, con trazas, capturas y video, se abre con `npm run report`.

## Aportes de la IA

- **Hallazgos desde el árbol de accesibilidad:** el planner encontró DEF-FE-08 (H-1) sin buscarlo, solo porque el snapshot muestra `button` sin nombre.
- **Revela problemas de accesibilidad:** los localizadores por rol fallan cuando falta un label. Así apareció que el buscador de usuarios no tiene `<label>`.
- **Velocidad:** el plan y las 26 pruebas se produjeron en una sola iteración. El healer arregló las fallas de localizadores sin tocar las aserciones.
- **Trazabilidad:** cada prueba enlaza su sección del plan (`// spec:`).

## Limitaciones

- El agente no conoce las reglas de negocio que no están en pantalla. Por ejemplo, que el back responde igual a una cuenta inactiva, o que el token es de un solo uso. Estas reglas se le dieron en el back simulado y en el plan, y hubo que revisarlas.
- Un healer sin supervisión puede "arreglar" una prueba que falla por un defecto real, por ejemplo cambiando el localizador del ojo por `nth(0)`. Por eso la decisión sobre DEF-FE-08 se tomó a mano.
- Las pruebas usan el back simulado. El contrato con el back real queda cubierto en Cypress (`e2e/cypress/e2e/api`) y en Vitest.
- El reporte HTML con trazas ocupa unos 80 MB, así que no se versiona: se regenera con `npm test`.

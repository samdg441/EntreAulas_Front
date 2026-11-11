# 5. TDD, pruebas unitarias, Cypress y BDD

## 5.1 TDD sobre la auditoría (Back)
Ciclo real, un commit por fase:

| Fase | Commit | Evidencia |
|---|---|---|
| **Rojo** | `test(auditoria): pruebas que fallan…` | `evidencias/tdd-auditoria-1-rojo.txt`: 3 suites no cargan (el módulo no existe) |
| **Verde** | `feat(auditoria): vista de auditoría…` | `tdd-auditoria-2-verde.txt`: 54 pruebas ✔; suite completa 1081 ✔ |
| **Refactor** | `refactor(auditoria): simplificar los filtros…` | `tdd-auditoria-3-refactor.txt`: `cumpleFiltros` pasa de `if` en cadena a booleanos con funciones `inicioDelDia/finDelDia`; tildes con `\p{M}`; +2 pruebas |
| Defecto-TDD | `test…DEF-AUD-01` → `fix…DEF-AUD-01` | rojo `def-aud-01-rojo.txt`, verde `def-aud-01-verde.txt` |
| Defecto-TDD | `test(paginacion)…DEF-REDI-05` → `fix(paginacion)` | `def-redi-05-rojo.txt` / `-verde.txt` |

Buenas prácticas aplicadas:
- **AAA** (Arrange-Act-Assert) en cada caso y comentado en los de servicio.
- **FIRST**: rápidas (suite de auditoría < 10 s), independientes (`fakeDb.reset()` en `beforeEach`), repetibles (sin red ni reloj real; `Intl` con locale fijo), auto-verificables y escritas antes del código (rojo).
- **Aserciones fluidas** (`expect(x).toMatchObject`, `.toHaveLength`, `.rejects.toMatchObject`, jest-dom: `toHaveAttribute`, `toBeChecked`, `toHaveFocus`).
- **Test doubles**: *Fake* (`fake-supabase`, almacén en memoria de preferencias), *Stub* (`RoleService.obtenerCoordinadorPorUsuario`, `getVentanasEvaluacion`), *Spy* (`logger.error`, `HTMLAnchorElement.click`), *Mock* (`vi.mock` de `coordinador.api`, `periodos.api`, `auditoria.api`; `auditoriaService.listar` en el contrato HTTP).
- **Cobertura** del código seleccionado: Back 97.6 % líneas / 83.9 % ramas (auditoria.ts 100/100); Front 94.7 % líneas / 82.6 % ramas.

## 5.2 Pruebas unitarias y de componente (Front)
`src/test/unit/rediseno/*` (118 casos: preferencias, diccionario, navegación, gestión de profesores, CSV, calendario) e `integration/rediseno-*` (preferencias, agenda, shell, dashboard, gestión, auditoría, paginación) + `api/auditoria-cliente`. Total nuevo: 176.

## 5.3 Cypress (criterio 7)
Cada requisito con escenarios **exitosos, alternativos y de error**, con aserciones:

| Spec | Pruebas | Resultado |
|---|---|---|
| `ui/rediseno-auditoria` | 11 | ✔ |
| `ui/rediseno-gestion-profesores` | 9 | ✔ |
| `ui/rediseno-dashboard-coordinador` | 10 | ✔ |
| `ui/rediseno-preferencias` | 6 | ✔ |
| `accessibility/rediseno-accesibilidad` (axe) | 13 | ✔ (1.ª pasada 6/13) |
| `security/rediseno-seguridad-front` | 8 | ✔ |
| `api/rediseno-auditoria-api` | 7 | ✔ (back real local y desplegado) |

Reproducir: `npm run dev -- --port 3001` y, en `e2e/`: `env -u ELECTRON_RUN_AS_NODE npx cypress run --e2e --browser chromium --spec 'cypress/e2e/**/rediseno-*.cy.ts'`. Otras herramientas de la clase aplicables: Vitest + Supertest (API), Playwright (agentes), Stagehand, DeepEval. Evidencias: `evidencias/cypress/*.txt`.

## 5.4 Gherkin, BDD, E2E y Screenplay (criterio 8)
`e2e/cypress/features/rediseno-coordinador.feature` (español, Dado–Cuando–Entonces) con 6 escenarios: indicadores y sidebar por secciones, calendario, auditoría con filtro, docentes en riesgo, noche + inglés + letra grande, y un estudiante que no puede abrir la auditoría.
Screenplay sobre Cucumber/Cypress: **Actor** (`Carlos`), **habilidades** (navegar la web, back simulado, API), **tareas** (`AbrirLaAuditoria`, `FiltrarLaAuditoriaPor`, `FiltrarDocentesEnRiesgo`, `ElegirPreferencias`), **interacciones** (`Visitar`, `OlvidarLaSesion`) y **preguntas** (`SeccionDeLaBarra`, `EventosDeAuditoria`, `DiasDelCalendario`, `AtributoDeLaPagina`). Resultado: 6/6 ✔ (`evidencias/cypress/rediseno-bdd-4.txt`; el 1.er intento falló 3/6 por un dato de prueba y 1 por el orden idioma-etiquetas).
Ejecutar: `npx cypress run --e2e --browser chromium --config-file cypress.bdd.config.ts --spec cypress/features/rediseno-coordinador.feature`.

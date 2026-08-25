# Pruebas Frontend (ISTQB / V&V)

Estructura alineada a niveles de prueba y a la matriz de requisitos (Grafos / caminos).

## Para qué es cada carpeta

```
src/test/
├── unit/           → Qué va: un componente o función UI aislada (RTL).
│                     Mocks de API/contexto. Cubre caminos del grafo del Front.
│
├── integration/    → Qué va: flujo UI + API (varias piezas). Dos sabores:
│                     (a) API mockeada a nivel de módulo (`vi.mock('../../api/...')`) —
│                         Ej.: entrada QR → login/redirect → error o formulario.
│                     (b) API real interceptada con MSW (`*.integration.test.tsx` de
│                         RQ1/RQ2) — el `apiClient` (axios) real hace la petición,
│                         incluidos sus interceptores, y MSW responde en el borde de
│                         red como lo haría Express. Válida URL/headers/body enviados
│                         y la reacción del Front a la respuesta real del backend.
│                     No es navegador real ni base de datos real.
│
├── e2e/            → Qué va: flujos de sistema en navegador (Playwright/Cypress).
│                     Hoy: marcador. NO se ejecuta con `npm test`.
│
├── defects/        → Qué va: una prueba por defecto encontrado, escrita contra el
│                     comportamiento CORRECTO esperado. Falla mientras el defecto
│                     siga abierto; pasa a verde cuando se corrige el código.
│                     Se ejecuta aparte (`npm run test:defects`). Ver HALLAZGOS.md.
│
├── fixtures/       → Qué va: JSON / usuarios estáticos para armar escenarios.
│                     No va: asserts ni lógica de render.
│
├── helpers/        → Qué va: helpers de render (p. ej. renderWithRouter).
│                     No va: casos describe/it.
│
├── mocks/          → Qué va: stubs de librerías/assets (framer-motion, .webp) y
│                     `server.ts` (MSW `setupServer`, sin handlers por defecto —
│                     cada test de integración con MSW registra los suyos).
│
└── setup.ts        → Qué va: jest-dom + cleanup de RTL / localStorage.
```

## Niveles

| Nivel | Qué prueba | Cobertura de caminos |
|-------|------------|----------------------|
| **unit/** | Grafo completo del requisito (C1…Cn) en UI | Completa |
| **integration/** | Flujos UI+API mockeada / login; smoke | Complementaria |
| **defects/** | Defectos abiertos detectados durante la validación | Rojo esperado |

Asserts específicos (p. ej. `within(card)`), sin números sueltos ambiguos ni datos de más.

## Matriz requisito → archivo

| Requisito | Unit | Integration |
|-----------|------|-------------|
| RQ1 Crear usuario (admin) | — | `integration/rq1-crear-usuario-admin.integration.test.tsx` |
| RQ2 Login | — | `integration/rq2-login.integration.test.tsx` |
| RQ18 Validar QR | `unit/rq18-validar-qr.test.tsx` | `integration/rq18-validar-qr.integration.test.tsx` |
| RQ19 Dashboard por rol | `unit/rq19-redirigir-dashboard.test.tsx` | `integration/rq19-redirigir-dashboard.integration.test.tsx` |
| RQ22 Métricas evaluación | `unit/rq22-metricas-evaluacion.test.tsx` | `integration/rq22-metricas-evaluacion.integration.test.tsx` |
| RQ23 Stats históricas | `unit/rq23-estadisticas-historicas.test.tsx` | `integration/rq23-estadisticas-historicas.integration.test.tsx` |
| RQ24 Resumen coordinador | `unit/rq24-resumen-coordinador.test.tsx` | `integration/rq24-resumen-coordinador.integration.test.tsx` |

Framework: **Vitest** + **Testing Library**.  
Cobertura: `coverage/` (excluida de Git).

## Cómo correrlas

Desde la raíz de **EntreAulas_Front** (hace falta `npm install` una vez):

```bash
# Todas unit + integration (e2e excluido)
npm test

# Solo unitarias
npm run test:unit

# Solo integración
npm run test:integration

# Watch
npm run test:watch

# Cobertura → ./coverage
npm run test:coverage

# Registro de defectos abiertos (SE ESPERA QUE FALLE; ver HALLAZGOS.md)
npm run test:defects

# Un archivo
npx vitest run src/test/unit/rq18-validar-qr.test.tsx
```

E2E (cuando exista runner): no usar Vitest; documentar en `e2e/` (p. ej. Playwright).

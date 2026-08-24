# Pruebas Frontend (ISTQB / V&V)

Estructura alineada a niveles de prueba y a la matriz RQ1–RQ5 (Grafos / caminos).

## Para qué es cada carpeta

```
src/test/
├── unit/           → Qué va: un componente o función UI aislada (RTL).
│                     Mocks de API/contexto. Cubre caminos del grafo del Front.
│
├── integration/    → Qué va: flujo UI + llamadas API mockeadas (varias piezas).
│                     Ej.: entrada QR → login/redirect → error o formulario.
│                     No es navegador real ni backend real.
│
├── e2e/            → Qué va: flujos de sistema en navegador (Playwright/Cypress).
│                     Hoy: marcador. NO se ejecuta con `npm test`.
│
├── fixtures/       → Qué va: JSON / usuarios estáticos para armar escenarios.
│                     No va: asserts ni lógica de render.
│
├── helpers/        → Qué va: helpers de render (p. ej. renderWithRouter).
│                     No va: casos describe/it.
│
├── mocks/          → Qué va: stubs de librerías/assets (framer-motion, .webp).
│                     Solo para que Vitest pueda montar la UI sin ruido.
│
└── setup.ts        → Qué va: jest-dom + cleanup de RTL / localStorage.
```

## Niveles

| Nivel | Qué prueba | Cobertura de caminos |
|-------|------------|----------------------|
| **unit/** | Grafo completo del requisito (C1…Cn) en UI | Completa |
| **integration/** | Flujos UI+API mockeada / login; smoke | Complementaria |

Asserts específicos (p. ej. `within(card)`), sin números sueltos ambiguos ni datos de más.

## Matriz requisito → archivo

| Requisito | Unit | Integration |
|-----------|------|-------------|
| RQ1 Validar QR | `unit/rq1-validar-qr.test.tsx` | `integration/rq1-validar-qr.integration.test.tsx` |
| RQ2 Dashboard por rol | `unit/rq2-redirigir-dashboard.test.tsx` | `integration/rq2-redirigir-dashboard.integration.test.tsx` |
| RQ3 Métricas evaluación | `unit/rq3-metricas-evaluacion.test.tsx` | `integration/rq3-metricas-evaluacion.integration.test.tsx` |
| RQ4 Stats históricas | `unit/rq4-estadisticas-historicas.test.tsx` | `integration/rq4-estadisticas-historicas.integration.test.tsx` |
| RQ5 Resumen coordinador | `unit/rq5-resumen-coordinador.test.tsx` | `integration/rq5-resumen-coordinador.integration.test.tsx` |

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

# Un archivo
npx vitest run src/test/unit/rq1-validar-qr.test.tsx
```

E2E (cuando exista runner): no usar Vitest; documentar en `e2e/` (p. ej. Playwright).

# Cypress — RQ1–RQ5, RQ18, RQ19, RQ22–RQ25

Proyecto aparte (como [CYPRESS-ENTERPRISE](https://github.com/mauricioramirezv/CYPRESS-ENTERPRISE)):
`npm ci` del front **no** descarga Cypress.

## Carpetas (mismo criterio que el laboratorio del profesor)

| Carpeta | Qué prueba | Back |
|---|---|---|
| `cypress/e2e/ui/` | Validación del formulario de login (RQ19) | No se llama |
| `cypress/e2e/regression/` | Flujos de pantalla RQ18, RQ19, RQ22–RQ25 | Simulado con `cy.intercept` |
| `cypress/e2e/api/` | Contrato HTTP real (RQ18, RQ22–RQ25) | Render |
| `cypress/e2e/security/` | Tokens falsos, CORS, cabeceras (RQ19) | Render |
| `cypress/e2e/ui/rq[1-5]-*` | Formularios de alta (RQ1), login (RQ2), recuperación (RQ3.1, RQ4), validación del token (RQ3.2) y nueva clave (RQ5): casos exitosos, alternativos y de error | Simulado con `cy.intercept` |
| `cypress/e2e/regression/rq1-rq5-*` | Ciclo de vida completo de la cuenta: alta → login → recuperación → nueva clave → login | Back en memoria (`support/back-en-memoria.ts`) |
| `cypress/e2e/accessibility/` | WCAG 2.1 AA con axe-core y teclado (RQ1–RQ5) | Simulado |
| `cypress/e2e/api/rq1-rq5-*`, `security/rq1-rq5-*` | Contrato y seguridad de la API de autenticación (JWT falsos, inyección, rate limit, cabeceras) | Render |
| `cypress/features/` + `cypress/screenplay/` | BDD en Gherkin (español) con el patrón Screenplay | `@web` back en memoria, `@api` Render |

## Screenplay + Gherkin (RQ1–RQ5)

```
cypress/
├── features/            ← escenarios Dado/Cuando/Entonces (# language: es)
├── step-definitions/    ← traducen cada paso en lo que hace el actor
│   ├── elenco.ts        ← reparte habilidades a los actores en cada escenario
│   └── pasos.steps.ts
└── screenplay/
    ├── actor.ts         ← Actor (whoCan / attemptsTo / asksFor / remember) y Elenco
    ├── abilities/       ← NavegarLaWeb, UsarElBackSimulado, LlamarALaApi
    ├── interactions/    ← Visitar, Escribir, Pulsar, Seleccionar, OlvidarLaSesion, Pedir
    ├── tasks/           ← IniciarSesion, CrearUsuario, SolicitarRecuperacion, AbrirElEnlaceDelCorreo, RestablecerContrasena, PedirEnlaceDeRecuperacionPorApi
    ├── questions/       ← RutaActual, MensajeVisible, FilaDeUsuario, CorreosRecibidos, CuentasRegistradas, UltimaRespuesta
    └── ui.ts            ← localizadores
```

```bash
npm run cy:bdd          # 35 escenarios; reporte en ../reports/cypress/bdd/cucumber-report.html
npm run cy:rq1-rq5      # UI + regresión + accesibilidad + API + seguridad de RQ1–RQ5
```

> En Linux con VS Code, si Cypress responde `bad option: --no-sandbox`, la terminal heredó
> `ELECTRON_RUN_AS_NODE=1`: ejecuta con `env -u ELECTRON_RUN_AS_NODE npm run ...`.
> Los scripts usan Chromium (`CY_BROWSER` para cambiarlo) porque Electron no capturaba pantallas en esta máquina.

## Instalación (una vez)

```bash
cd e2e
npm install
npx cypress install
```

## Cómo correrlas

```bash
# Todo: levanta el front en :3001 y corre UI + regresión + API + seguridad
npm run test:e2e

# Solo API + seguridad (no necesita el front)
npm run cy:api

# Con sesión de coordinador (contrato RQ22–RQ25)
# En Windows Git Bash / PowerShell, exporta el token como CYPRESS_TOKEN_COORDINADOR
CYPRESS_TOKEN_COORDINADOR="$(cat /ruta/token.txt)" npm run cy:api

# Interfaz de Cypress (con el front ya en otra terminal: npm run front)
npm run cy:open
```

Desde la raíz del front:

```bash
npm run test:e2e
```

## Variables

| Variable | Uso |
|---|---|
| `API_URL` | Back (por defecto `https://entreaulas-back.onrender.com`) |
| `CYPRESS_TOKEN_COORDINADOR` | JWT de coordinador; sin él, la suite de contrato se omite |
| `CYPRESS_ADMIN_EMAIL` / `CYPRESS_ADMIN_PASSWORD` | Admin de pruebas para los casos positivos de RQ1–RQ5 contra el back real; sin ellos se omiten |

Cypress 16: valores públicos van en `expose` (`apiUrl`); el token se lee con `cy.env(['TOKEN_COORDINADOR'])`.

No subas el token al repo.

## Resultado verificado en esta máquina

- UI + regression: **26/26** con el front local.
- API (QR) + security: **14/14** contra Render.
- Contrato RQ22–RQ25: se omite sin `CYPRESS_TOKEN_COORDINADOR`.

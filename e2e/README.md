# Cypress — RQ6, RQ14–RQ17, RQ18, RQ19, RQ22–RQ25 y RQ27

Proyecto aparte (como [CYPRESS-ENTERPRISE](https://github.com/mauricioramirezv/CYPRESS-ENTERPRISE)):
`npm ci` del front **no** descarga Cypress.

## Carpetas (mismo criterio que el laboratorio del profesor)

| Carpeta | Qué prueba | Back |
|---|---|---|
| `cypress/e2e/ui/` | Validación de formularios (RQ15 y RQ19) | No se llama |
| `cypress/e2e/regression/` | RQ6, RQ14–RQ17 y RQ27, más RQ18, RQ19 y RQ22–RQ25 | Simulado con `cy.intercept` |
| `cypress/e2e/api/` | Contrato HTTP real (RQ6, RQ14–RQ17, RQ27, RQ18 y RQ22–RQ25) | Render |
| `cypress/e2e/security/` | Tokens falsos y rechazos (RQ6, RQ15–RQ17 y RQ19) | Render |

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

Cypress 16: valores públicos van en `expose` (`apiUrl`); el token se lee con `cy.env(['TOKEN_COORDINADOR'])`.

No subas el token al repo.

RQ6, RQ14–RQ17 y RQ27 siguen el mismo armado que RQ18, RQ19 y RQ22–RQ25: `beforeEach` con `cy.simularBackVacio()`, fixtures, el flujo de la pantalla y casos `Regresión` cuando el back rechaza la acción. La API real afirma el estado y el cuerpo exactos (`404` / `401 NO_TOKEN`).

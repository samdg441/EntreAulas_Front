# Stagehand + IA (Ollama) — EntreAulas

Basado en el proyecto de clase Stagehand-E2E-AI (`act` con instrucciones, `observe` + `extract` con Zod, y el veredicto en un localizador o en la URL).
El escenario de RQ6, RQ14–RQ17 y RQ27 está en `src/rq6-rq27-scenario.ts` y se lanza como `tests/login-ollama.e2e.ts`.

## Requisitos

- Node 22+
- Ollama con un modelo (en tu PC: `qwen2.5:7b`)
- Chrome, Chromium o Edge (ruta en `CHROME_PATH`)
- Front accesible (`FRONT_URL`, local o Vercel)
- Credenciales reales solo en `.env` (nunca en Git)

## Instalación

```bash
cd stagehand
npm install
cp .env.example .env
# Edita .env: LOGIN_EMAIL, LOGIN_PASSWORD, CHROME_PATH
```

Comprueba Ollama:

```bash
ollama list
curl http://localhost:11434/api/tags
```

## ¿Stagehand cubre QR y resultados?

Sí. Stagehand no se limita al login: abre cualquier pantalla del front y usa
`act` / `observe` / `extract`. En este proyecto:

| Comando | Capacidades | Requisito |
|---|---|---|
| `npm run test:rq6-rq27` | `act` + `observe` + `extract` | RQ6, RQ14–RQ17 y RQ27 |
| `npm run test:observe` | `observe` + `extract` | RQ19 (login, sin clave) |
| `npm run test:ollama` | `act` + URL | RQ19 (login completo) |
| `npm run test:rq18` | `act` + `observe` + `extract` | RQ18 (pantalla `/admin/qr`) |
| `npm run test:rq24` | `act` + `observe` + `extract` | RQ22/RQ24 (panel + búsqueda) |
| `npm run test:rq23-rq25` | `act` + `observe` + `extract` | RQ23/RQ25 (reportes + Excel) |
| `npm run test:e2e:all` | Todas | — |
| `npm test` | Solo TypeScript | CI sin consumir el modelo |

Lo que **no** sustituye: pruebas unitarias, API con Vitest ni la carga. Stagehand es la capa E2E con IA.

Evidencias en `reports/*.png` y `reports/*.json` (métricas de tokens).

## Diseño (igual que en clase)

| Paso | Técnica |
|---|---|
| Encontrar / rellenar controles | `act` / `observe` (IA) |
| Validar resultado | URL exacta o esquema Zod |
| Evidencia | captura + `stagehand.metrics()` |

La IA no decide si la prueba pasó: lo hace una aserción fija.

## RQ1–RQ5 (Juliana Franco)

No necesitan credenciales: cada prueba levanta un **back simulado en `:3000`** (`src/back-simulado.ts`, mismas reglas que el
back real: login 401 genérico, mensaje único en forgot-password, tokens de un solo uso y buzón de correos) y usa el front local en `:3001`.

```bash
cd ..; npm run dev -- --port 3001     # front (otra terminal)
ollama serve && ollama pull qwen2.5:7b
HEADLESS=true CHROME_PATH=/usr/bin/chromium npm run test:rq1-rq5
```

| Script | RQ | act | observe | extract |
|---|---|---|---|---|
| `test:rq2` | RQ2 | llenar y enviar el login con las acciones observadas | controles del formulario (correo, contraseña, botón) | mensaje de error con Zod; aserción determinística de ruta y token |
| `test:rq1` | RQ1 | abrir «Agregar usuario», llenar y crear | campos del formulario de alta | correos de la tabla (acotado a `table`); el back confirma el payload |
| `test:rq3-rq5` | RQ3.1, RQ4, RQ3.2, RQ5 | pedir enlace, definir clave débil y válida, login con la nueva | campos de nueva contraseña y botones | confirmación genérica, error de política (acotado a `form`), rechazo del enlace usado |

**Patrón usado (`src/ia.ts`).** Con `qwen2.5:7b` en CPU, `act("instrucción")` devolvía «No action found» tras ~140 s mientras `observe`
acertaba: se usa **observe → act(acción observada)** (recomendado por Stagehand para modelos locales), se **verifica el efecto** de cada
act y se prueba la siguiente candidata si no cambió la página. Los valores (correos, claves) nunca viajan al modelo: se pasan como
argumento del `fill`. Si el modelo no ubica un elemento, hay un respaldo CSS que queda registrado en `respaldosDeterministicos`
de la evidencia (en la ejecución final: **0 usos**).

Evidencias versionadas: `docs/pruebas/evidencias/stagehand/` (capturas, JSON con métricas de tokens/tiempos y logs).

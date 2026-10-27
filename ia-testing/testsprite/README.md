# TestSprite: pruebas de RQ1–RQ5 con un agente de IA

## Propósito

TestSprite es un agente de IA que se conecta a Claude Code por MCP. A partir de un PRD y de la aplicación en ejecución:

1. explora la aplicación;
2. normaliza el PRD;
3. escribe el plan de pruebas;
4. genera el código de las pruebas;
5. las ejecuta en su nube;
6. analiza las fallas;
7. redacta el reporte.

Reemplaza a Testsigma, cuya cuenta necesitaba una aprobación del proveedor que no llegó a tiempo (ver `../testsigma/README.md`).

## Archivos

| Archivo | Contenido |
|---|---|
| `PRD-RQ1-RQ5.md` | Requisitos que se suben a TestSprite. Limitan el alcance a RQ1–RQ5 y fijan los mensajes esperados |
| `resultados.md` | Resultados, comparación con los casos del equipo y conclusiones |
| `evidencias/` | Reporte HTML y Markdown de TestSprite, y capturas del panel |
| `../../testsprite_tests/` | Carpeta que crea TestSprite: plan, pruebas generadas (`TC0xx_*.py`) y reportes. `tmp/` se ignora en git porque guarda la configuración de la corrida |

## Configuración (una vez)

1. Crea la cuenta en <https://www.testsprite.com>. El plan gratuito da 150 créditos al mes, sin tarjeta.
2. En el panel, entra a **Workspace Settings → Connections → API Keys** y crea una clave.
3. En una terminal, dentro de `entre-aulas/` (la carpeta donde abres Claude Code), registra el servidor MCP:

   ```bash
   claude mcp add TestSprite --env API_KEY=<tu-clave> -- npx @testsprite/testsprite-mcp@latest
   ```

   La clave queda en tu configuración local de Claude Code (`~/.claude.json`), no en el repositorio.
4. Verifica la conexión con `claude mcp list`: TestSprite debe aparecer como *Connected*.
5. Reinicia Claude Code para que cargue las herramientas de TestSprite.

Requisitos: Node.js 22 o superior.

## Ejecución

1. Levanta la versión refactorizada:
   - front: `entreaulas-front-container`, en `http://localhost:3001`;
   - back: `entreaulas-back-container`, en `http://localhost:3000`.

   Comprueba que responde: `curl localhost:3000/health`.
2. En Claude Code pide:

   > Prueba EntreAulas_Front con TestSprite, solo RQ1–RQ5 según ia-testing/testsprite/PRD-RQ1-RQ5.md

3. En la página de configuración que abre TestSprite en el navegador, completa:

   | Campo | Valor |
   |---|---|
   | Mode | **Frontend** |
   | Scope | **Codebase** |
   | URL | `http://localhost:3001/login` |
   | Credenciales | Correo y clave del administrador de pruebas |
   | PRD | `ia-testing/testsprite/PRD-RQ1-RQ5.md` |

4. Cuando termine, se generan `testsprite_tests/TestSprite_MCP_Test_Report.md` y `.html`. Se copian a `evidencias/` y se completa `resultados.md`.

## Cuidado con los créditos

- No se publica cuánto gasta cada acción. Por eso el alcance se limita con el PRD y se corre primero solo el modo **Frontend**.
- El modo **Backend** (API) se corre después, solo si quedan créditos.
- Las pruebas crean usuarios `ts.*` en Supabase.
- El límite de intentos (429 después de 10 fallos) es un comportamiento esperado: el PRD se lo indica al agente para que no lo reporte como defecto.

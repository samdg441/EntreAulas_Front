# 7. Inteligencia artificial aplicada a las pruebas

Se usan tres herramientas: **Playwright con agentes** (herramienta adicional), **Stagehand** y **DeepEval**. (BugBug y TestSprite, de la entrega anterior, no se repiten por indicación.)

## 7.1 Playwright con agentes (planner → generator → healer)
- Configuración: `@playwright/test` 1.63, `.mcp.json` (`playwright run-test-mcp-server`), semilla `fixtures/back-coordinador.ts` (back simulado con `page.route`).
- **Planner:** `specs/exploracion-final/explorar-rediseno.spec.ts` guarda el árbol ARIA de 4 pantallas (`*.aria.yml`) y de ahí sale `specs/plan-rediseno.md` (4 secciones, 25 escenarios, 2 hallazgos: H-1 conteos sin `<dl>`, H-2 formato de fecha).
- **Generator:** 3 specs (`tests/rediseno-*.spec.ts`) con localizadores por rol y nombre accesible.
- **Healer / iteraciones:** 1.ª y 2.ª ejecución 7/25 (la prueba no solicitaba el fixture de sesión → se hizo `auto: true`); 3.ª 22/25 (la 1.5 reveló el **defecto real DEF-REDI-05** y 2 flaquezas de `reload` en Vite); 4.ª **25/25**; contra el despliegue en nginx **25/25** (`evidencias/playwright/`).
- Aporte: encontró un defecto real y un reflujo de 570 px; limitación: el «agente» fue Claude Code operando el ciclo, no un servicio autónomo.

## 7.2 Stagehand (automatizar y validar flujos web con IA)
- Configuración: Stagehand 4.3.0, modelo `google/gemini-3-flash-preview` (`AI_PROVIDER=gemini`, key en `stagehand/.env`, fuera del repo), Chromium 156 headless. Escenario `stagehand/src/rediseno-scenario.ts` (`npm run test:rediseno`) sobre el front en Vite y un back simulado en memoria (`back-simulado.ts`: dashboard, estadísticas, periodos y auditoría).
- Flujo: sesión de coordinador sembrada → **observe → act** sobre el enlace «Auditoría» de la barra lateral → **extract** del total de eventos (esperado 4) → observe → act sobre el botón de preferencias → observe → act sobre la opción «Noche»; verificación determinista de que `<html>` tiene la clase `dark`.
- **Resultado: pasa.** 3 acciones de IA ejecutadas, **0 respaldos CSS**, extract correcto (4), modo noche aplicado. Consumo: 13 919 tokens de entrada y 1 037 de salida (`evidencias/stagehand/rediseno-gemini.json`, captura `rediseno-gemini.png`).
- Configuración/limitaciones halladas: `gemini-2.5-flash` ya no está disponible para cuentas nuevas y `gemini-flash-latest` devolvió «alta demanda» (503) en dos intentos; con `gemini-3-flash-preview` funcionó. Con el modelo local `qwen2.5:7b` en CPU cada paso tardó más de 10 minutos y no terminó, por lo que Ollama se descartó para esta ejecución.
- Aporte: valida el flujo con lenguaje natural sin selectores y resiste cambios de clases CSS; limitación: costo/latencia por paso y dependencia de la disponibilidad del modelo.

## 7.3 DeepEval (evaluar un componente de IA existente)
- Componente: `AiService.summarizeOpenResponses` (alerta de acoso RQ31 y resumen RQ29), con Gemini desactivado para que sea determinista y no salga ningún dato.
- Datos: 30 comentarios sintéticos etiquetados (10 acoso, 20 normales) y 3 grupos para resumen (`ia-testing/deepeval/casos_comentarios.json`).
- Métrica propia `DeteccionDeAcoso` (`BaseMetric`) + GEval con juez local (opcional; no se ejecutó por la misma limitación de CPU).
- **Resultados** (`resultados-final.json`): TP 5 · TN 14 · FP 6 · FN 5 → **precisión 0.455, recall 0.5, F1 0.476, exactitud 0.633** (umbrales 0.80 / 0.90: **no cumple**).
  - Falsos negativos: «me acosaba», «tocar el hombro… incómoda», «insinuó», «humilla», lenguaje sexual sin palabra clave → el detector por subcadenas no reconoce conjugaciones ni sinónimos.
  - Falsos positivos: «miedo a reprobar», «tocar los temas», «abusan con los talleres», «temor al examen», «wifi insegura», «ningún disgusto».
- Defectos: DEF-IA-01 (Alta) y DEF-IA-02 (Media). Recomendación: raíces léxicas con límite de palabra, palabras emocionales solo junto a una referencia a la persona, y revisión humana obligatoria.
- Aporte/limitación: la métrica convierte el riesgo cualitativo en un número reproducible; el conjunto es pequeño y sintético, por lo que las cifras son orientativas.

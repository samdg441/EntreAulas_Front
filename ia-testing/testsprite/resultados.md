# Resultados de TestSprite para RQ1–RQ5

**Evidencias:**

- `../../testsprite_tests/testsprite-mcp-test-report.md`: el reporte de la ejecución final.
- `../../testsprite_tests/TC0xx_*.py`: las 12 pruebas generadas. Las credenciales se leen de variables de entorno.
- `evidencias/raw_report.md`: el reporte crudo de TestSprite.
- `evidencias/corridas-previas/`: los reportes de las corridas exploratorias y el plan original en inglés.
- Cada caso enlaza a su grabación en el panel de TestSprite (columna "Panel").

## Ejecución final

| Campo | Valor |
|---|---|
| Fecha | 2026-10-26 |
| Modo | Frontend, Codebase, build de producción |
| Entorno | Despliegue local refactorizado: nginx `:3001` y API `:3000`, por el túnel de TestSprite |
| Cuentas | Estudiante y administrador (la misma cuenta con dos roles) y docente. Se ingresan por configuración, no están en el repositorio |
| Casos | **12, ejecutados juntos en una sola corrida** |
| Resultado | **12 de 12 pasan (100 %)** |
| Créditos | 19 en total, contando las corridas exploratorias. Quedan 131 de 150 |

## Detalle por caso

| ID | RQ | Escenario | Resultado | Cómo se verifica | Panel |
|---|---|---|---|---|---|
| TC006 | RQ1 | Crear un usuario nuevo | ✅ Pasa | Código: el usuario `ts.<timestamp>` aparece en la tabla | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/ae56f875-07db-4e6c-804f-5a0d69b95889) |
| TC009 | RQ1 | El dominio del correo cambia según el tipo | ✅ Pasa | Juez de IA: el sufijo del modal cambia a `@udemedellin.edu.co` | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/c6db40b0-edcc-4fe7-9950-b7eb7f9db6e7) |
| TC011 | RQ1 | Rechazar una contraseña débil en el alta | ✅ Pasa | Código | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/783fd31f-4011-472a-84bc-13afe0c57b32) |
| TC013 | RQ1 | Rechazar un correo duplicado en el alta | ✅ Pasa | Juez de IA | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/ddb916a2-88d4-46fd-830e-d9e7dc7c75b3) |
| TC014 | RQ1 | Encontrar el usuario creado en la tabla | ✅ Pasa | Código | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/48870ed2-7945-43f9-848f-6646d2ef70dc) |
| TC001 | RQ2 | Iniciar sesión como estudiante y llegar a su panel | ✅ Pasa | Código: URL `/dashboard-estudiante` | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/bf83703a-3dcf-44a1-84a2-1c91709cda3f) |
| TC002 | RQ2 | Iniciar sesión como docente y llegar a su panel | ✅ Pasa | Código: URL `/dashboard-profesor` | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/f6bb09bc-7406-45fa-9d12-0a81ec6d1af6) |
| TC005 | RQ2 | Rechazar credenciales incorrectas | ✅ Pasa | Código: muestra «Credenciales inválidas» y sigue en `/login` | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/7e893774-c43e-47da-b2ed-e45b924c4a6d) |
| TC007 | RQ2 | Rechazar un correo con formato inválido en el login | ✅ Pasa | Código | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/1e397c7e-a627-4bd2-9057-c0b636047ca5) |
| TC004 | RQ3.1 / RQ4 | Solicitar un enlace de recuperación | ✅ Pasa | Juez de IA: confirmación genérica. La llegada del correo no se puede ver | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/81a4c137-f4af-44eb-a6bd-94893de53041) |
| TC008 | RQ3.1 | Rechazar un correo con formato inválido en la recuperación | ✅ Pasa | Código | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/0ac7d5d9-0069-4f38-bf79-16379f1ef5fb) |
| TC016 | RQ3.2 | Manejar un enlace de recuperación incompleto | ✅ Pasa | Juez de IA | [ver](https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/f438a146-46f5-4c48-b216-23d2e83395ad) |

## Cobertura por requisito

| RQ | Casos | Cobertura efectiva |
|---|---|---|
| RQ1 | 5 | Alta, dominio por tipo, política de clave, correo duplicado y búsqueda |
| RQ2 | 4 | Login de estudiante y de docente, credenciales incorrectas y formato del correo |
| RQ3.1 | 2 | Confirmación genérica y formato del correo |
| RQ3.2 | 1 | Enlace incompleto |
| RQ4 | 1 (parcial) | Solo la respuesta de la interfaz. El envío del correo lo cubren Vitest (SMTP local), Playwright y Stagehand |
| RQ5 | 0 | Necesita un enlace real que llega por correo. Lo cubren Cypress, Playwright y Stagehand con un back simulado |

## Depuración del plan

TestSprite propuso 16 casos. Hicieron falta varias corridas hasta dejar un plan de 12 que se ejecuta completo en una sola corrida:

| Caso | Qué pasó | Decisión |
|---|---|---|
| TC005 | En la primera corrida usó la clave **correcta** con el tipo «Estudiante» y, como la cuenta tiene ese rol, entró. Fue un falso positivo causado por la instrucción "la cuenta es de administrador" | Se corrigieron los pasos (clave incorrecta explícita). Pasa |
| TC001 | Quedó bloqueado por la misma instrucción | Se aclaró que la cuenta tiene los dos roles. Pasa |
| TC002 | Quedó bloqueado porque no había cuenta de docente | Se agregó una cuenta de docente. Pasa |
| TC009 | En una corrida buscó el sufijo del dominio en el login y no en el modal de alta (falso positivo de la IA) | Se especificó el modal. Pasa |
| TC010 | Botón para mostrar u ocultar la contraseña. El resumen del código que dio el equipo lo ubicaba en el login y luego en el alta, pero solo existe en `/reset-password`. TestSprite informó las dos veces que el control no estaba | Se retiró del plan |
| TC003 y TC012 | Necesitan un token real enviado por correo | Se retiraron del plan |
| TC015 | Restricción de `/admin/users` a administradores. Pasó con una cuenta que era solo de estudiante, y falló con una cuenta de estudiante y admin que inició sesión como «Estudiante» (ver TS-H7) | Se retiró del plan por decisión de la integrante. El hallazgo queda registrado |

## Comparación con los casos diseñados por el equipo

Se compara con los 18 casos diseñados para Testsigma (`../testsigma/casos-rq1-rq5.md`).

| RQ | Casos del equipo | Casos finales de TestSprite | Aportes nuevos | Escenarios del equipo que no propuso |
|---|---|---|---|---|
| RQ1 | 5 | 5 | Búsqueda en la tabla como verificación aparte (TC014) | Un estudiante no entra a la administración (lo propuso en TC015, pero se retiró) |
| RQ2 | 5 | 4 | Login de docente | Correo inexistente con el mismo mensaje que una clave incorrecta (contra la enumeración de cuentas) y tipo de usuario equivocado |
| RQ3.1 | 3 | 2 | — | Correo no registrado con la misma confirmación (contra la enumeración de cuentas) |
| RQ3.2 | 2 | 1 | — | Token inexistente |
| RQ4 | 1 | 1 (parcial) | — | La llegada del correo al buzón |
| RQ5 | 2 | 0 | — | Nueva clave, contraseñas que no coinciden y token de un solo uso |

## Hallazgos

| ID | Hallazgo | Tipo |
|---|---|---|
| TS-H1 | **El agente depende de lo que se le dice.** Una instrucción ambigua produjo un falso positivo (TC005) y bloqueó TC001. Un error en el resumen del código produjo un caso imposible (TC010) | Especificación |
| TS-H2 | **La IA no inventó un control que no existe:** dijo dos veces que el botón para mostrar la contraseña no estaba donde la especificación lo ubicaba | Calidad del agente |
| TS-H3 | **El agente también se equivoca solo.** En una corrida buscó el dominio en el login en vez del modal de alta (TC009). Sus resultados no son estables entre corridas si el paso es ambiguo | Estabilidad |
| TS-H4 | **El veredicto lo da un "juez" de IA.** En 4 de los 12 casos (TC004, TC009, TC013 y TC016), el `.py` exportado solo comprueba que la página cargó. La verificación real está en la grabación del panel. TC006 y TC014 dejan fijo el usuario creado en su corrida. Por eso el código no sirve tal cual como regresión | Mantenibilidad |
| TS-H5 | **Las credenciales quedan en texto plano** en el código generado. Antes de versionarlo se reemplazaron por `TESTSPRITE_USER`, `TESTSPRITE_PASSWORD`, `TESTSPRITE_DOCENTE_USER` y `TESTSPRITE_DOCENTE_PASSWORD`. `testsprite_tests/tmp/`, que guarda la configuración, está en `.gitignore` | Seguridad |
| TS-H6 | **Genera en inglés** el plan y los títulos, aunque el PRD esté en español. Se tradujeron en el plan y se le pidió escribir en español | Idioma |
| TS-H7 | **Hallazgo funcional (abierto, sin prueba en el plan final).** Una cuenta con los roles de estudiante y administrador que inicia sesión como «Estudiante» puede entrar a `/admin/users` y listar usuarios. Las causas: `decidirAccesoRuta` (front) revisa todos los roles de la cuenta y no el rol elegido, y el back guarda `selectedRole` en el JWT pero no lo usa para autorizar. Severidad baja, porque la persona sí es administradora, pero contradice que el rol se elija al iniciar sesión (RQ2) | Defecto (abierto) |

## Conclusión

TestSprite es la herramienta de IA más autónoma de las tres. A partir de un PRD propuso, programó, ejecutó y reportó los casos de RQ1–RQ5. El plan final de **12 casos pasa completo (12 de 12) en una sola corrida** contra la versión refactorizada.

Llegar a ese plan costó trabajo:
- hubo que depurar instrucciones ambiguas y corregir dos falsos positivos;
- se retiraron 4 casos que no se podían ejecutar sin un buzón o que dependían de una especificación errónea;
- encontró un hallazgo real de control de acceso (TS-H7).

Sus límites:
- no prueba flujos que dependen de un correo real (RQ4 y RQ5);
- su veredicto depende de un juez de IA, así que el código exportado no reemplaza una suite de regresión versionada como Cypress o Playwright.

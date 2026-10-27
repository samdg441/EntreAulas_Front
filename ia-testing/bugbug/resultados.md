# Resultados de BugBug para RQ1–RQ5

**Evidencia:** `evidencias/All_tests_2026-10-26_2.pdf`, el reporte detallado que exporta BugBug, con 99 páginas y una captura de la ventana y del elemento en cada paso.

## Ejecución de la suite

| Campo | Valor |
|---|---|
| Fecha | 2026-10-26, de 22:40:15 a 22:44:15 UTC |
| Suite | "All tests" (proyecto *My project*) |
| Run ID | `ffefcb2a-110a-466a-a0d1-d5451bfee109` |
| Método | Nube de BugBug (*Cloud*), perfil *Base* |
| Navegador | Chrome 150, Linux, escritorio 1366×786, extensión 14.18.1 |
| Entorno | Producción: `https://entre-aulas-front.vercel.app` con el back en Render |
| Duración | 239,86 s |
| Resultado | **11 de 11 pasan (100 %)**, 0 fallan y 0 se omiten |

La ejecución corresponde al estado **antes de la refactorización**, porque los cambios de `pruebas-Juliana` no se han publicado en Vercel ni en Render.

## Detalle por prueba

En la columna "¿Verifica?" se indica si la prueba termina con una aserción, es decir, si fallaría cuando la aplicación no se comporta como pide el requisito.

| ID | RQ | Pasos | Duración | Resultado | ¿Verifica? | Observación |
|---|---|---|---|---|---|---|
| BB-RQ2-01 Login exitoso | RQ2 | 8 | 11,00 s | Pasa | ❌ No | Regrabada como **Docente** porque los pasos importados no tomaban el tipo de inicio de sesión ni escribían el correo (BB-H1). El último clic cae en el texto «Iniciar sesión como» y no en el botón de enviar, así que no inicia sesión ni comprueba la llegada al dashboard |
| BB-RQ2-02 Clave incorrecta | RQ2 | 8 | 9,83 s | Pasa | ❌ No | Regrabada como Docente. Envía el formulario, pero no comprueba el mensaje de error |
| BB-RQ2-03 Tipo equivocado | RQ2 | 9 | 14,02 s | Pasa | ❌ No | Regrabada eligiendo Decano. No envía el formulario y no comprueba nada |
| BB-RQ2-04 Correo sin arroba | RQ2 | 3 | 6,63 s | Pasa | ✅ Sí | Importada desde YAML. Comprueba «Por favor, ingresa un correo electrónico válido» |
| BB-RQ1-01 Crear estudiante | RQ1 | 18 | 26,87 s | Pasa | ⚠️ Parcial | Importada y ampliada. Comprueba que el modal se abre; crea `bb.<timestamp>` y escribe "Bug" en el buscador, pero no comprueba que el usuario aparezca en la tabla |
| BB-RQ1-02 Clave sin carácter especial | RQ1 | 17 | 21,16 s | Pasa | ✅ Sí | Importada. Comprueba «al menos un carácter especial» y que el modal sigue abierto |
| BB-RQ1-03 Dominio según el tipo | RQ1 | 13 | 20,74 s | Pasa | ✅ Sí | Importada. Comprueba que el sufijo pasa de `@soyudemedellin.edu.co` a `@udemedellin.edu.co` al elegir *profesor* |
| BB-RQ1-04 Estudiante sin acceso | RQ1 | — | — | No ejecutada | — | No está en la suite exportada (usaba el login de estudiante) |
| BB-RQ3-01 Correo registrado | RQ3.1 | 7 | 9,51 s | Pasa | ❌ No | Regrabada. Envía la solicitud, pero no comprueba el mensaje genérico |
| BB-RQ3-02 Correo no registrado | RQ3.1 | 6 | 8,38 s | Pasa | ❌ No | Regrabada. Envía la solicitud, pero no comprueba que el mensaje sea el mismo que en BB-RQ3-01 |
| BB-RQ3-03 Formato inválido | RQ3.1 | 9 | 71,06 s | Pasa | ❌ No | La grabación quedó en el **login**, con `jfranco140@gmail.com` y Docente, en vez del formulario de recuperación. Un *scroll* final espera 60,03 s |
| BB-RQ32-01 Token inexistente | RQ3.2 | — | — | Eliminada | — | La integrante la quitó de la suite |
| BB-RQ32-02 Enlace incompleto | RQ3.2 | 2 | 6,18 s | Pasa | ✅ Sí | Importada. Comprueba «inválido o está incompleto» en `/reset-password` sin token |
| BB-RQ4-01 Correo en el buzón | RQ4 | — | — | No ejecutada | — | Necesita el *Inbox* de BugBug y un enlace real |
| BB-RQ5-01..03 Nueva clave | RQ5 | — | — | No ejecutadas | — | Dependen del enlace de BB-RQ4-01 |

## Resumen

| Indicador | Valor |
|---|---|
| Pruebas planeadas | 16 |
| Ejecutadas | 11 (69 %) |
| Pasan | 11 de 11 (100 %) |
| **Con aserción real** | **4 de 11 (36 %)**: BB-RQ1-02, BB-RQ1-03, BB-RQ2-04 y BB-RQ32-02 |
| Con aserción parcial | 1 (BB-RQ1-01) |
| Sin aserción | 6 |
| Importadas desde YAML sin regrabar | 5 (BB-RQ1-01, 02 y 03, BB-RQ2-04 y BB-RQ32-02) |
| Regrabadas a mano | 6 (las que usaban el login de estudiante y las de solicitud de recuperación) |

| RQ | Cobertura efectiva en BugBug |
|---|---|
| RQ1 | Validación de la política de clave y del dominio según el tipo. El alta se ejecuta, pero no se verifica |
| RQ2 | El login exitoso de **admin**, porque el componente «Login como admin» de BB-RQ1-01..03 comprueba que la URL contiene `/dashboard-admin`, y la validación del formato del correo. El login de docente o estudiante y los errores de credenciales no quedan verificados |
| RQ3.1 | Se ejecuta el envío, pero no se verifica el mensaje genérico |
| RQ3.2 | El enlace sin token |
| RQ4 y RQ5 | Sin cobertura en BugBug. Las cubren Vitest, Cypress, Playwright y Stagehand |

## Hallazgos

| ID | Hallazgo | Tipo |
|---|---|---|
| BB-H1 | **Los pasos importados del login de estudiante no funcionaron en la ejecución**: BugBug no aplicaba la elección del tipo de inicio de sesión en el selector y el paso de escribir el correo fallaba. Las pruebas que lo usaban se regrabaron con Docente, con los selectores que genera el grabador (`//SPAN[normalize-space(text())="Docente"]/../../BUTTON` y `//*[contains(@placeholder,"estudiante@universidad.edu")]`). No es un defecto de la aplicación: el mismo flujo pasa en Cypress, Playwright y Stagehand. Lo que muestra es que los XPath escritos a mano para el desplegable de tipo de usuario no eran compatibles con la forma en que BugBug reproduce los clics y la escritura | Selector importado (herramienta) |
| BB-H2 | **Una suite al 100 % no implica que se verificara el comportamiento.** Al grabar, BugBug guarda los clics y la escritura, pero no las aserciones: 6 de las 11 pruebas pasarían aunque la aplicación fallara | Calidad de las pruebas |
| BB-H3 | Al grabar el envío del login, el clic quedó sobre la etiqueta «Iniciar sesión como» y no sobre el botón (`//DIV[normalize-space(text())="Iniciar sesión como"]`). La prueba pasa, pero nunca envía el formulario | Selector grabado |
| BB-H4 | Un *scroll* sobre `/HTML` tardó 60 s en BB-RQ3-03 y en ese tiempo la espera automática no avanzó. Ese paso sobra y alarga la suite un 25 % | Rendimiento de la suite |

## Esfuerzo

| Métrica | Valor |
|---|---|
| Pruebas importadas desde YAML (sin grabar) | 13 archivos generados y validados contra el esquema oficial. 5 quedaron en la suite tal como se importaron. Los YAML se quitaron del repositorio y siguen en el historial (`c14ec89`) |
| Pruebas que hubo que regrabar | 6 |
| Pruebas eliminadas | BB-RQ32-01 |
| Pruebas inestables (pasan y fallan sin cambios) | No se observan en esta ejecución, porque hubo una sola |
| Tiempo de ejecución en la nube | 4 min (239,86 s) para 11 pruebas |

## Trabajo pendiente para que la suite sirva como regresión

1. Agregar aserciones:
   - BB-RQ2-01: hacer clic en el botón «Iniciar sesión» y comprobar «Page URL contains `/dashboard`».
   - BB-RQ2-02 y BB-RQ2-03: comprobar el texto del error.
   - BB-RQ3-01 y BB-RQ3-02: comprobar el mismo mensaje genérico en las dos.
   - BB-RQ1-01: comprobar que `BUGBUG` aparece en la tabla.
2. Regrabar BB-RQ3-03 en «¿Olvidaste tu contraseña?» con `correo-sin-arroba` y quitar el *scroll* de 60 s.
3. Regrabar con el grabador el login de estudiante (BB-H1) y restaurar BB-RQ1-04 y BB-RQ32-01.
4. Volver a ejecutar la suite cuando se publique la refactorización, para tener la columna "después".

## Conclusión

BugBug ejecutó la suite en la nube sin fallas y, con el reporte detallado, dejó evidencia visual de cada paso. **La importación desde YAML dio resultados mixtos.** Las 5 pruebas importadas que no dependían del desplegable de tipo de usuario conservaron sus aserciones y se ejecutaron sin cambios. Las que pasaban por el login de estudiante no se reprodujeron (BB-H1), así que se regrabaron, y las 6 regrabadas quedaron sin verificación.

La lección para la entrega es que la IA de BugBug (espera activa y selectores alternativos) **estabiliza la ejecución, pero no decide qué comprobar**: las aserciones siguen siendo trabajo del tester. Por eso el 100 % de esta corrida se reporta junto a la cifra que importa, **4 de 11 pruebas con verificación real**.

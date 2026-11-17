# 10. Pruebas de regresión

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Funcionalidades | Creación de encuestas · Selección de la encuesta a usar · Notificaciones |
| Fecha | 16 de noviembre de 2026 |
| Línea base (antes) | Front `73040fd` · Back `9baadcf` |
| Versión final (después) | Front `00c76fe` · Back `d5f7e2c` |
| Resultado | Front 16/16 antes y después · Back 12/15 antes (fallan los 3 defectos) y 15/15 después |

## 1. Qué cambios protege esta suite

| Cambio | Tipo | Dónde | Commit |
|---|---|---|---|
| Extraer las reglas de selección de `TeacherSelection.tsx` a `seleccion-encuesta.ts` | Refactor | Front | `6ca912a` |
| Corregir el texto de una pregunta (botón «Editar», `preguntas-encuesta.ts`, `updateQuestion`) | Mejora (TDD) | Front | `c1a9c7f` |
| DEF-48, DEF-49 y DEF-50 en `PUT /api/evaluations/questions/:id` | Corrección de defectos | Back | `3df91b8` |

La pregunta que responde la suite es: **¿lo que ya funcionaba sigue funcionando después de estos cambios?** Y en el back, además: **¿los defectos corregidos siguen corregidos?**

## 2. Cómo se diseñó

- **Solo interfaces públicas.** Los casos usan las pantallas (`AdminSurveysPage`, `TeacherSelection`, `NotificationDropdown`), la función `notificacionesDeEvaluacion` y la API HTTP. No importan los módulos nuevos (`seleccion-encuesta.ts`, `preguntas-encuesta.ts`). Por eso **la misma suite, sin cambios, corre contra la línea base y contra la versión final**.
- **Línea base.** Es el último commit antes de los cambios de la tabla anterior. Para correr la suite ahí se creó un `git worktree` temporal en ese commit, se copió el archivo de la suite y se ejecutó con las mismas dependencias.
- **Automatizada.** `npm run test:regresion:esteban` en cada repositorio. También queda incluida en `npm test` y en el `npm run test:coverage` que corre el pipeline de Jenkins en cada build (punto 9). En los dos repositorios ese script incluye `src/test/regression`.
- **AAA, independiente y sin red.** Las API se reemplazan con `vi.mock` y `vi.spyOn`, y cada caso arma sus propios datos.

## 3. Casos seleccionados

### 3.1 Front — `src/test/regression/esteban-encuestas-seleccion-notificaciones.regresion.test.tsx`

| ID | Caso | Requisito | Por qué se eligió |
|---|---|---|---|
| R-ENC-01 | Crear una encuesta la registra y confirma | RF-ENC-32 | La pantalla se reorganizó para editar preguntas |
| R-ENC-02 | Una encuesta sin nombre no se envía | RF-ENC-32 | Validación existente |
| R-ENC-03 | Agregar una pregunta envía sus datos y confirma | RF-ENC-32 | Comparte el diálogo con la edición nueva |
| R-ENC-04 | Una pregunta en blanco no se envía | RF-ENC-32 | Comparte la validación con la edición nueva |
| R-ENC-05 | Retirar una pregunta la quita de la tabla | RF-ENC-33 | La fila ganó el botón «Editar» junto a «Desactivar» |
| R-ENC-06 | Si el retiro falla, la pregunta sigue y se informa el error | RF-ENC-33 | Camino de error existente |
| R-SEL-01 | Elegir docente, materia y grupo lleva al formulario | RF-EVAL-11, RF-EVAL-12 | Flujo principal de la pantalla refactorizada |
| R-SEL-02 | Un docente con todo respondido se marca «Respondida» y no se selecciona | RF-EVAL-11 | Regla movida a `estadoDocente` |
| R-SEL-03 | Una materia ya evaluada queda deshabilitada | RF-EVAL-12 | Regla movida a `puedeElegirCurso` |
| R-SEL-04 | El buscador filtra por código de materia | RF-ACA-27 | Regla movida a `filtrarDocentes` |
| R-SEL-05 | Si falla la carga de docentes se ofrece reintentar | RF-EVAL-11 | Camino de error existente |
| R-NOT-01 | Ventana abierta: aviso y acción «Evaluar ahora» | RF-NOT-34, RF-NOT-35 | La campana está en el encabezado de las pantallas modificadas |
| R-NOT-02 | A un día del cierre el aviso es urgente y el docente ve «Ver reportes» | RF-NOT-34 | Regla de urgencia |
| R-NOT-03 | Antes de abrir anuncia la próxima evaluación sin acción | RF-NOT-34 | Regla de próxima apertura |
| R-NOT-04 | Sin ventanas no hay avisos | RF-NOT-34 | Camino vacío |
| R-NOT-05 | Marcar todas como leídas quita el pendiente | RF-NOT-35 | Estado guardado en el navegador |

### 3.2 Back — `src/test/regression/rf-enc-32-33-regresion.test.ts`

| ID | Caso | Bloque |
|---|---|---|
| R-API-01 | Un usuario autenticado lista las preguntas activas | No debe cambiar |
| R-API-02 | Sin token, GET, POST, PUT y DELETE de preguntas responden 401 | No debe cambiar |
| R-API-03 (×2) | Administrador y coordinador crean una pregunta activa (201) | No debe cambiar |
| R-API-04 | Crear sin campos obligatorios: 400 y no escribe | No debe cambiar |
| R-API-05 (×3) | Un estudiante no puede usar POST, PUT ni DELETE (403) | No debe cambiar |
| R-API-06 | Corregir una pregunta válida: 200 y se guarda en el id pedido | No debe cambiar |
| R-API-07 | Retirar una pregunta: 200 | No debe cambiar |
| R-API-08 | Si la base falla al retirar: 500 sin exponer el detalle | No debe cambiar |
| R-API-09 | Las encuestas se listan y una sin nombre no se crea | No debe cambiar |
| R-DEF-48 | Corregir con el texto en blanco: 400 y no guarda | Debe seguir corregido |
| R-DEF-49 | Un id «1.5» no corrige la pregunta 1 | Debe seguir corregido |
| R-DEF-50 | La corrección no puede reactivar una pregunta ni cambiar su id | Debe seguir corregido |

R-API-06 es el caso clave: comprueba que la corrección de DEF-48 a DEF-50 **no rompió la edición válida**. La suite completa del back también lo confirmó: 2 pruebas antiguas detectaron un cambio de mensaje que se revirtió (punto 6, sección 4).

## 4. Ejecuciones y resultados comparativos

### 4.1 Suite de regresión

| Suite | Antes (línea base) | Después (versión final) | Lectura |
|---|---|---|---|
| Front, 16 casos | **16/16** (`73040fd`) | **16/16** (`00c76fe`) | El refactor y la mejora no rompieron nada |
| Back, bloque 1 (12 casos) | **12/12** (`9baadcf`) | **12/12** (`d5f7e2c`) | La corrección no rompió el comportamiento existente |
| Back, bloque 2 (3 defectos) | **0/3** | **3/3** | Los defectos estaban en la base y quedaron corregidos |
| **Total** | **28/31** | **31/31** | |

Fallas de la línea base del back (las esperadas):

```text
× R-DEF-48: corregir con el texto en blanco responde 400 y no guarda      → expected 200 to be 400
× R-DEF-49: un id «1.5» no corrige la pregunta 1                          → expected 200 to be 400
× R-DEF-50: la corrección no puede reactivar una pregunta ni cambiar su id → expected {…} to not have property "id"
Tests  3 failed | 12 passed (15)
```

### 4.2 Suites completas después de los cambios

| Repositorio | Archivos | Pruebas | Resultado |
|---|---|---|---|
| Front (`npm test`) | 78 | 842 | 842 en verde |
| Back (`npx vitest run`) | 85 | 1081 | 1081 en verde |

### 4.3 Regresión de punta a punta (después)

| Suite | Resultado | Punto |
|---|---|---|
| Cypress UI `rf-enc-not-eval.cy.ts` | 14/14 | 7 |
| Cypress API `rf-enc-not-eval-api.cy.ts` | 10/10 (+6 omitidas sin token) | 7 |
| BDD Gherkin + Screenplay (`esteban-*.feature`) | 17/17 | 8 |

## 5. ¿La suite detecta una regresión? (fallas inyectadas)

Una suite que siempre pasa no demuestra nada. Se introdujeron a propósito 4 fallas en el código, una a la vez. Se corrió la suite, se anotó el resultado y se restauró el archivo con `git checkout`.

| Falla inyectada | Archivo | Resultado |
|---|---|---|
| M1: `puedeElegirCurso` deja de mirar si la materia ya fue evaluada | `seleccion-encuesta.ts` | **Sobrevive**: mutante equivalente (ver abajo) |
| M2: el aviso urgente pasa de «≤ 2 días» a «≤ 0 días» | `notificaciones.ts` | **Detectada** por R-NOT-02 |
| M3: el id vuelve a leerse con `Number.parseInt` | `evaluations.controller.ts` | **Detectada** por R-DEF-49 |
| M4: el buscador deja de buscar por código de materia | `seleccion-encuesta.ts` | **Detectada** por R-SEL-04 |

**Por qué sobrevive M1.** La materia evaluada se bloquea dos veces en `TeacherSelection.tsx`. La `<option>` está deshabilitada con `cursoEvaluado()` (línea 331), y además el manejador la vuelve a comprobar con `puedeElegirCurso()` (línea 101). La falla solo quita la segunda barrera, que el usuario no puede alcanzar desde la pantalla. El comportamiento visible no cambia, así que no es una regresión que la suite debiera detectar. Las pruebas unitarias del punto 6 sí cubren `puedeElegirCurso` por separado.

## 6. Cómo reproducirlo

```bash
# Después (versión actual)
cd EntreAulas_Front && npm run test:regresion:esteban
cd EntreAulas_Back  && npm run test:regresion:esteban

# Antes (línea base): misma suite en un worktree temporal
git -C EntreAulas_Back worktree add ../base-back 9baadcf
cp EntreAulas_Back/src/test/regression/rf-enc-32-33-regresion.test.ts ../base-back/src/test/regression/
# enlazar node_modules (Windows: mklink /J ..\base-back\node_modules EntreAulas_Back\node_modules)
cd ../base-back && npx vitest run src/test/regression/rf-enc-32-33-regresion.test.ts
git -C EntreAulas_Back worktree remove --force ../base-back
# igual para el front con 73040fd y esteban-encuestas-seleccion-notificaciones.regresion.test.tsx
```

## 7. Evidencias

| Archivo | Contenido |
|---|---|
| `evidencias/regresion/antes-73040fd.txt` | Suite del front contra la línea base |
| `evidencias/regresion/despues-00c76fe.txt` | Suite del front en la versión final |
| `evidencias/regresion/suite-completa-despues.txt` | `npm test` del front completo |
| `evidencias/regresion/mutaciones.txt` | Las 4 fallas inyectadas y su resultado |
| `EntreAulas_Back/docs/pruebas/evidencias/regresion/antes-9baadcf.txt` | Suite del back contra la línea base |
| `EntreAulas_Back/docs/pruebas/evidencias/regresion/despues-d5f7e2c.txt` | Suite del back en la versión final |
| `EntreAulas_Back/docs/pruebas/evidencias/regresion/suite-completa-despues.txt` | Suite completa del back |

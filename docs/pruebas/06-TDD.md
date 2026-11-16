# 6. TDD y pruebas unitarias automatizadas

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Mejora hecha con TDD | Corregir el texto de una pregunta de la encuesta (RF-ENC-33) |
| Corrección hecha con TDD | DEF-48, DEF-49 y DEF-50 en `PUT /api/evaluations/questions/:id` |
| Ciclo anterior | Extraer las reglas de selección de la encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27) |
| Fecha | 16 de noviembre de 2026 |
| Herramientas | Vitest 5.1 (front), Vitest 2.1 + Supertest (back), Testing Library |

## 1. Por qué esta mejora

RF-ENC-33 pide que el administrador **edite o desactive** una pregunta. El back ya tenía `PUT /api/evaluations/questions/:id`, pero el front solo permitía desactivar: si una pregunta tenía un error de redacción, había que retirarla y crearla otra vez, y perdía su orden. Al escribir las pruebas del back aparecieron tres defectos de esa ruta (DEF-48 a DEF-50).

## 2. Ciclo 1 — Reglas para corregir una pregunta (front)

### 2.1 Rojo

Se escribieron primero las pruebas, sin código de producción:

- `src/test/unit/evaluaciones/rf-enc-33-corregir-pregunta.test.ts` (16 casos)
- `src/test/unit/evaluaciones/rf-enc-33-surveys-api.test.ts` (2 casos de `updateQuestion`)

**Rojo 1, no compila.** El módulo `preguntas-encuesta.ts` y `surveysApi.updateQuestion` no existían.

```text
Failed to resolve import "../../../features/dashboard-admin/preguntas-encuesta"
TypeError: surveysApi.updateQuestion is not a function
Test Files  2 failed (2)
```

Evidencia: `evidencias/tdd-rf-enc-33-rojo-1-sin-modulo.txt`.

**Rojo 2, falla el comportamiento.** Se crearon solo las firmas, sin reglas, para que el rojo fuera por aserciones y no por compilación.

```text
Tests  16 failed | 2 passed (18)
```

Los 2 que pasan son los que esperan `null` (corrección válida), que el esqueleto ya devolvía. Evidencia: `evidencias/tdd-rf-enc-33-rojo-2-sin-reglas.txt`.

### 2.2 Verde

Implementación mínima en `src/features/dashboard-admin/preguntas-encuesta.ts` y `surveysApi.updateQuestion`:

| Regla | Mensaje |
|---|---|
| Texto vacío o solo espacios | «Completa categoría y texto de la pregunta» |
| Orden que no es entero mayor que 0 | «El orden debe ser un número entero mayor que cero» |
| Mismo texto que otra pregunta de la misma encuesta (sin distinguir mayúsculas ni espacios) | «Ya hay una pregunta con ese texto en esta encuesta» |
| Sin cambios | No se hace el PUT |
| El servidor falla | Se muestra su `message` o, si no hay, «No se pudo actualizar la pregunta» |

```text
Tests  18 passed (18)
```

Evidencia: `evidencias/tdd-rf-enc-33-verde.txt`.

### 2.3 Refactor

Con las pruebas en verde:

- La normalización del texto, que estaba repetida, quedó en `normalizar()`.
- La comparación «sin cambios» con `JSON.stringify` dependía del orden de las claves. Se cambió por `sinCambios()` sobre una lista `CAMPOS_EDITABLES`.
- El `catch (e: any)` se cambió por `mensajeDeError(error: unknown)`.
- El módulo no importa React ni Axios: recibe un `PuertoPreguntas`. Por eso se puede probar con dobles.

```text
Tests  18 passed (18)
```

Evidencia: `evidencias/tdd-rf-enc-33-refactor.txt`.

## 3. Ciclo 2 — El botón «Editar» en la pantalla (front)

**Rojo.** Se agregaron 3 casos a `src/test/integration/rf-enc-32-33-encuesta.test.tsx`: corregir con éxito, texto repetido y error 400 del back.

```text
TestingLibraryElementError: Unable to find an accessible element with the role "button"
and name "Editar pregunta ¿Explica con claridad?"
Tests  3 failed | 5 passed (8)
```

Evidencia: `evidencias/tdd-rf-enc-33-pantalla-rojo.txt`.

**Verde.** `AdminSurveysPage.tsx` tiene ahora un botón «Editar» por fila. El botón reutiliza el diálogo de «Agregar pregunta», que ahora precarga los datos con `datosDePregunta()`. Al guardar se llama a `corregirPregunta(surveysApi, …)`.

```text
Tests  8 passed (8)
```

Evidencia: `evidencias/tdd-rf-enc-33-pantalla-verde.txt`.

**Refactor.** Cerrar el diálogo se hacía en tres lugares con el mismo código. Ahora pasa por `cerrarDialogo()`, que además limpia `editandoId`.

## 4. Ciclo 3 — Corrección de DEF-48, DEF-49 y DEF-50 (back)

**Rojo.** `EntreAulas_Back/src/test/api/rf-enc-32-33-preguntas.api.test.ts` (Supertest sobre la app Express real):

```text
DEF-48: un texto en blanco responde 400 y no se guarda           → expected 200 to be 400
DEF-49: el id «abc» | «0» | «-4» | «1.5» responde 400            → expected 200 to be 400
DEF-49: el orden debe ser entero mayor que cero                  → expected 200 to be 400
DEF-49: DELETE con id no numérico responde 400                   → expected 200 to be 400
DEF-50: solo se guardan los campos editables (no id, activa…)    → recibía id, activa y created_at
Tests  8 failed | 13 passed (21)
```

Evidencia: `EntreAulas_Back/docs/pruebas/evidencias/tdd-def-48-50-rojo.txt`.

**Verde.** En `evaluations.controller.ts`:

- `idDePregunta()` exige un entero positivo.
- `cambiosDePregunta()` usa una lista blanca de campos y valida el texto y el orden.

```text
Tests  21 passed (21)
```

**Regresión.** Al correr la suite completa del back fallaron 2 pruebas antiguas: esperaban `error: 'ID requerido'` cuando falta el id. Se restauró ese mensaje para el id ausente y se dejó «ID inválido» para el id mal formado. Las pruebas antiguas no se tocaron.

```text
Back:  Test Files 84 passed (84) · Tests 1066 passed (1066)
Front: Test Files 77 passed (77) · Tests  823 passed (823)
```

Evidencias: `EntreAulas_Back/docs/pruebas/evidencias/regresion-back-completa.txt` y `evidencias/regresion-front-completa.txt`.

Al registrar los defectos se vio que DEF-46 y DEF-47 ya existían en `HALLAZGOS.md`. Los nuevos se renumeraron como DEF-48 a DEF-50 y las evidencias se re-etiquetaron con esos números.

## 5. Ciclo anterior — Selección de la encuesta

`seleccion-encuesta.ts` salió de extraer las reglas que vivían dentro de `TeacherSelection.tsx`. El orden fue:

1. **Rojo:** se escribió la prueba importando un módulo que aún no existía.
2. **Verde:** 6 pruebas pasan.
3. **Refactor:** la pantalla ahora llama a `puedeElegirDocente`, `puedeElegirCurso`, `puedeContinuar` y `filtrarDocentes`.

Evidencias: `evidencias/tdd-seleccion-rojo.txt` y `tdd-seleccion-verde.txt`.

## 6. Patrón AAA

Cada caso marca las tres fases con comentarios y les antepone el Dado / Cuando / Entonces del requisito:

```ts
it('rechaza un texto repetido en la misma encuesta, sin importar mayúsculas ni espacios', () => {
  // Dado que la pregunta 9 ya dice «El docente llega a tiempo»
  // Arrange
  const datos = cambios({ texto_pregunta: '  el DOCENTE   llega a tiempo ' })

  // Cuando se intenta poner ese texto en la pregunta 8
  // Act
  const error = validarPregunta(datos, banco.preguntas, 8)

  // Entonces avisa que está repetida
  // Assert
  expect(error).to.equal(MENSAJES_PREGUNTA.duplicada)
})
```

## 7. Principios FIRST

| Principio | Cómo se cumple | Evidencia |
|---|---|---|
| **Fast** (rápidas) | Sin red ni base. Los 18 casos unitarios tardan entre 0 y 4 ms cada uno; el archivo completo, unos 2 s con el arranque de jsdom. | `tdd-rf-enc-33-verde.txt` |
| **Independent** (independientes) | `beforeEach` crea un `BancoEnMemoria` nuevo. Vitest usa `clearMocks` y `restoreMocks`. Se corrió en orden aleatorio con `--sequence.shuffle`. | `first-repetible-aleatorio.txt` |
| **Repeatable** (repetibles) | Fechas fijas en las notificaciones y ningún reloj ni dato externo. 3 corridas con semillas 1000, 2000 y 3000: 40/40 en cada una. | `first-repetible-aleatorio.txt` |
| **Self-validating** (autovalidadas) | Cada caso termina en aserciones. No hay que leer logs para saber si pasó. | todas |
| **Timely** (oportunas) | Las pruebas se escribieron antes que el código: ver los rojos de las secciones 2, 3 y 4. | `tdd-*-rojo*.txt` |

## 8. Aserciones fluidas

Vitest incluye la interfaz encadenable de Chai. Se usó donde la frase completa se lee mejor que varias aserciones sueltas:

```ts
expect(errores).to.be.an('array').that.has.lengthOf(2).and.deep.equals([null, null])
expect(resultado).to.be.an('object').that.deep.includes({ ok: true, pregunta: guardada })
expect(banco.preguntas.find((p) => p.id === 8))
  .to.have.property('texto_pregunta')
  .that.equals('El docente explica con ejemplos')
expect(datos).to.deep.equal({ ... }).and.not.have.any.keys('id', 'activa', 'categoria')
```

En Cypress se usa la misma sintaxis: `cy.get(...).should('be.visible').find('[role="alert"]').should('contain.text', …)`.

## 9. Dobles de prueba (Test Doubles)

Se usaron los cinco tipos de la taxonomía de Meszaros. El módulo recibe un `PuertoPreguntas`, así que no hace falta parchear imports para la mayoría de los casos.

| Tipo | Dónde | Para qué |
|---|---|---|
| **Dummy** | `puertoDummy` en `rf-enc-33-corregir-pregunta.test.ts` | Se pasa porque la firma lo exige. Si se llama, lanza un error. Prueba que los datos inválidos no tocan el servidor. |
| **Stub** | `{ updateQuestion: async () => guardada }`, `stubConError`, `stubSinRed` | Respuestas fijas: éxito, 404 con mensaje y fallo de red sin cuerpo. |
| **Spy** | `vi.spyOn(banco, 'updateQuestion')` | Observa el fake sin cambiarlo: si no hubo cambios, no se hace el PUT. |
| **Mock** | `vi.fn().mockResolvedValue(...)` con `toHaveBeenCalledOnce` y `toHaveBeenCalledWith`; `vi.mock('../../../api/client')` | Verifica la interacción: un solo PUT, al id 8, con el texto recortado y a la ruta del contrato. |
| **Fake** | `class BancoEnMemoria implements PuertoPreguntas` | Implementación real en memoria. Verifica el estado: después de corregir, el banco tiene el texto nuevo y las demás preguntas no cambian. |

En el back, Supertest usa la app y el middleware de JWT reales. Solo el repositorio se reemplaza con `vi.spyOn(evaluationsRepository, …)`, que funciona como stub o mock según el caso.

## 10. Resultados y cobertura

Con `npm run test:esteban` desde `EntreAulas_Front` se corren 50 pruebas, todas en verde.

| Archivo | Sentencias | Ramas | Funciones | Líneas |
|---|---|---|---|---|
| `features/dashboard-admin/preguntas-encuesta.ts` | 100 % | 100 % | 100 % | 100 % |
| `api/surveys.api.ts` | 100 % | 100 % | 100 % | 100 % |
| `lib/notificaciones.ts` | 100 % | 100 % | 100 % | 100 % |
| `features/evaluations/seleccion-encuesta.ts` | 92 % | 93,9 % | 90,9 % | 100 % |
| `features/dashboard-admin/AdminSurveysPage.tsx` | 78,4 % | 71,3 % | 75,6 % | 79 % |
| **Total del código seleccionado** | **84,7 %** | **81,6 %** | **84,3 %** | **85,1 %** |

Con `npm run test:esteban` desde `EntreAulas_Back` se corren 31 pruebas, todas en verde.

| Archivo | Sentencias | Ramas | Funciones | Líneas |
|---|---|---|---|---|
| `modules/evaluations/evaluations.controller.ts` | 100 % | 94,5 % | 100 % | 100 % |

El informe HTML queda en `coverage-esteban/index.html` en cada repositorio. Evidencias: `evidencias/cobertura-esteban-front.txt` y `EntreAulas_Back/docs/pruebas/evidencias/cobertura-esteban-back.txt`.

Lo que no cubre `AdminSurveysPage.tsx` es el renombrado de la encuesta y los errores al crear la categoría. Esos caminos no son de RF-ENC-33.

# 7. Pruebas automatizadas con Cypress y otras herramientas

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Requisitos | RF-ENC-32, RF-ENC-33, RF-EVAL-11, RF-EVAL-12, RF-ACA-27, RF-NOT-34, RF-NOT-35 |
| Fecha | 16 de noviembre de 2026 |
| Resultado | Cypress UI 14/14 · Cypress API 10/10 (+6 omitidas sin token) · Supertest 21/21 · Vitest 50/50 |

## 1. Herramientas y nivel

| Herramienta | Nivel | Archivo | Contra qué corre |
|---|---|---|---|
| **Cypress 16.1.1** (Chrome) | E2E de interfaz | `e2e/cypress/e2e/ui/rf-enc-not-eval.cy.ts` | Front real en `localhost:3001`; el back se simula con `cy.intercept` |
| **Cypress `cy.request`** | API | `e2e/cypress/e2e/api/rf-enc-not-eval-api.cy.ts` | Back real (`API_URL`, por defecto el de Render) |
| **Supertest + Vitest 2.1** | API / contrato HTTP | `EntreAulas_Back/src/test/api/rf-enc-32-33-preguntas.api.test.ts` | App Express y JWT reales; repositorio simulado |
| **Vitest 5.1 + Testing Library** | Unidad y componente | ver punto 6 | jsdom |

Las herramientas siguen el lenguaje del proyecto, que es TypeScript de punta a punta: Cypress y Vitest en el front, Supertest en el back (Express).

## 2. Cómo correrlo

```bash
# 1) Front en 3001 (desde EntreAulas_Front)
npm run dev

# 2) Back local en 3000, solo para la API real con la corrección DEF-48..50 (desde EntreAulas_Back)
npm run dev

# 3) Cypress (desde EntreAulas_Front/e2e)
npm run cy:esteban                                 # interfaz
API_URL=http://localhost:3000 npm run cy:esteban:api   # API real

# 4) Supertest (desde EntreAulas_Back)
npm run test:esteban
```

Los casos con token de la API real necesitan `CYPRESS_TOKEN_COORDINADOR`. Sin esa variable se omiten y no fallan, igual que en los specs de RQ22–RQ25.

> Si Cypress se lanza desde la terminal integrada de VS Code y termina con `Illegal instruction` / código `3221225501`, la causa es la variable `ELECTRON_RUN_AS_NODE` que hereda de VS Code. Se corre con `env -u ELECTRON_RUN_AS_NODE npm run cy:esteban`.

## 3. Caminos por requisito (Cypress UI)

| Requisito | Exitoso | Alternativo | Error |
|---|---|---|---|
| RF-ENC-32 | Guardar «Evaluación de cierre» y ver «Encuesta agregada» | Agregar «El docente llega a tiempo» a Docencia; el cuerpo del POST lleva ese texto | Nombre en blanco: «Escribe el nombre de la encuesta» y `cy.spy` confirma que no hubo POST |
| RF-ENC-33 (retirar) | Desactivar la pregunta 8 y que desaparezca de la tabla | — | El DELETE responde 500: la pregunta sigue y se muestra el error |
| RF-ENC-33 (corregir) | Editar el texto: el PUT lleva `texto_pregunta` y `categoria_id`, **no** `id` ni `activa`; aparece «Pregunta actualizada» y el nuevo texto en la tabla | Texto repetido «  el DOCENTE llega a tiempo »: el diálogo avisa y `cy.spy` confirma que no hubo PUT | El PUT responde 400: el mensaje del back queda en el diálogo, que no se cierra, y la tabla conserva el texto original |
| RF-EVAL-11, RF-EVAL-12, RF-ACA-27 | Elegir a Ana Ruiz, Bases de datos y el grupo 01, y llegar a `/evaluate/form` | Buscar `MAT-2` y que solo quede Luis Gómez | Ana ya respondida no se selecciona; si `/api/teachers` cae, aparece «Reintentar» |
| RF-NOT-34, RF-NOT-35 | Ventana del 1 al 30 de noviembre de 2026: «Evaluación docente abierta» y «Evaluar ahora» | «Marcar todas como leídas» quita el pendiente de la campana | Sin ventanas: «No hay notificaciones» |

Aserciones usadas: `should('be.visible' | 'not.exist' | 'have.value' | 'have.text' | 'contain.text')`, `cy.wait('@alias').its('request.body…')`, `expect(request.body).to.include(…)` / `.to.not.have.any.keys(…)` y `cy.get('@spy').should('not.have.been.called')`.

### Resultado

```text
  RF-ENC-32 — Creación de la encuesta
    √ guarda una encuesta nueva y confirma
    √ agrega una pregunta a una encuesta ya creada
    √ no guarda la encuesta si el nombre está en blanco
  RF-ENC-33 — Corrección o retiro de una pregunta
    √ desactiva una pregunta y deja de ofrecerla
    √ si el retiro falla, la pregunta sigue en la tabla
  RF-ENC-33 — Corregir el texto de una pregunta
    √ corrige el texto, envía el PUT y la tabla muestra el nuevo texto
    √ alternativo: un texto repetido en la encuesta se rechaza sin llamar al servidor
    √ error: si el back responde 400, el mensaje aparece en el diálogo y no se cierra
  RF-EVAL-11, RF-EVAL-12 y RF-ACA-27 — Elegir la encuesta
    √ elige docente, materia y grupo y sigue a la evaluación
    √ el buscador deja solo la materia que coincide
    √ un docente ya respondido no se puede elegir y un fallo de carga se puede reintentar
  RF-NOT-34 y RF-NOT-35
    √ con la ventana abierta el estudiante ve el aviso y la acción de evaluar
    √ marcar todas como leídas quita el pendiente
    √ sin ventanas la campana dice que no hay notificaciones

  14 passing (25s)
```

Evidencia: `evidencias/cypress-rf-enc-not-eval.txt`. El video queda en `reports/cypress/videos/rf-enc-not-eval.cy.ts.mp4`.

## 4. Pruebas de API

### 4.1 Cypress contra el back real

Ninguna prueba escribe en la base. Los rechazos se cortan antes del repositorio, y con el token solo se leen datos o se envían cuerpos que el back debe rechazar.

| Grupo | Casos | Resultado |
|---|---|---|
| Sin token | GET/POST/PUT/DELETE de preguntas, GET/POST de encuestas, `/api/teachers` y `/api/periodos/evaluacion`: 401 `NO_TOKEN` | 8 √ |
| Token falsificado | JWT `alg: none` no corrige preguntas; JWT firmado con otra clave no retira preguntas | 2 √ |
| Con token del coordinador | Contrato `{ success, data[] }` de preguntas activas; listado de encuestas; 400 «Datos incompletos»; DEF-48 (texto en blanco); DEF-49 (id `abc`); ventanas con fechas ISO para RF-NOT-34 | 6 omitidas (sin `CYPRESS_TOKEN_COORDINADOR` en esta máquina) |

```text
  10 passing (895ms)
  6 pending
  ✔  All specs passed!
```

Evidencia: `evidencias/cypress-rf-enc-not-eval-api.txt` (corrido con `API_URL=http://localhost:3000`).

### 4.2 Supertest sobre la app Express

`EntreAulas_Back/src/test/api/rf-enc-32-33-preguntas.api.test.ts` cubre 21 casos:

| Ruta | Exitoso | Alternativo | Error |
|---|---|---|---|
| `POST /questions` | admin y coordinador crean (201) con `activa: true` | — | sin token 401; estudiante y profesor 403; faltan campos 400; la base falla 500 sin exponer el detalle |
| `PUT /questions/:id` | admin corrige (200) | campos no editables ignorados (DEF-50) | estudiante 403; texto en blanco 400 (DEF-48); id `abc`, `0`, `-4`, `1.5` 400 y orden 0 400 (DEF-49) |
| `DELETE /questions/:id` | admin desactiva (200) | — | profesor 403; id no numérico 400 (DEF-49); la base falla 500 |
| `GET /questions` | estudiante autenticado lista activas | — | — |

```text
Tests  21 passed (21)
```

Evidencia: `EntreAulas_Back/docs/pruebas/evidencias/tdd-def-48-50-verde.txt`.

## 5. Defectos encontrados

| ID | Defecto | Severidad | Estado |
|---|---|---|---|
| DEF-48 | `PUT /questions/:id` guardaba un texto en blanco | Media | Corregido |
| DEF-49 | Id y orden sin validar: `1.5` se convertía en `1` y corregía otra pregunta | Baja | Corregido |
| DEF-50 | El PUT permitía sobrescribir `id`, `activa` y `created_at` | Media | Corregido |

El detalle está en `EntreAulas_Back/src/test/HALLAZGOS.md`.

## 6. Diferencia entre lo planeado y lo ejecutado

- La versión anterior de este punto no tenía camino de edición para RF-ENC-33, porque la pantalla no permitía editar. La edición se construyó con TDD (punto 6) y ahora tiene sus tres caminos en Cypress.
- Las 6 pruebas de API con token no se ejecutaron en esta máquina. Corren en Jenkins, donde está definido `CYPRESS_TOKEN_COORDINADOR`. DEF-48 y DEF-49 solo pasan contra un back que ya tenga la corrección: hoy, el local, hasta que se despliegue en Render.

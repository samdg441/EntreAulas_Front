# 8. Lenguaje Gherkin, BDD, E2E y Screenplay

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Funcionalidades | Creación de encuestas · Selección de la encuesta a usar · Notificaciones |
| Requisitos | RF-ENC-32, RF-ENC-33, RF-EVAL-11, RF-EVAL-12, RF-ACA-27, RF-NOT-34, RF-NOT-35 |
| Herramientas | Cypress 16.1.1 + `@badeball/cypress-cucumber-preprocessor` 28 (Cucumber) + esbuild |
| Fecha | 16 de noviembre de 2026 |
| Resultado | 3 características, 17 escenarios, 17 en verde, 0 reintentos |

## 1. Cómo se conecta todo

```text
features/*.feature      Gherkin en español: Dado / Cuando / Entonces
        │  (Cucumber enlaza cada frase con un paso)
step-definitions/       Pasos: solo dicen QUÉ actor hace o pregunta algo
        │
screenplay/
  actor.ts              Actor: tiene habilidades, realiza actividades, responde preguntas
  abilities/            Habilidades: NavegarLaWeb, GestionarEncuestasSimuladas, LlamarALaApi
  tasks/                Tareas: lo que el actor quiere lograr (lenguaje del negocio)
  interactions/         Interacciones: un gesto sobre la interfaz (pulsar, escribir, elegir)
  questions/            Preguntas: lo que el actor comprueba en la pantalla o en el back
  ui-encuestas.ts       Localizadores, en un solo lugar
        │
Cypress + Chrome        Front real en localhost:3001; el back se simula con cy.intercept
```

Los escenarios se ejecutan de punta a punta en el navegador: el actor inicia sesión por el formulario real de `/login`, navega y pulsa como un usuario. El back es un **back en memoria con estado** (`support/encuestas-en-memoria.ts`) que sigue el contrato del back real, incluidas las validaciones de DEF-48 y DEF-49. Por eso los escenarios comprueban el efecto («el back guarda la pregunta»), no solo lo que se ve.

## 2. Escenarios Gherkin

### 2.1 Creación de encuestas — `esteban-creacion-de-encuestas.feature`

| Escenario | Tipo | Requisito |
|---|---|---|
| Ada crea una encuesta nueva | exitoso | RF-ENC-32 |
| Una encuesta sin nombre no se guarda | error | RF-ENC-32 |
| Ada agrega una pregunta a una encuesta existente | exitoso | RF-ENC-32 |
| Ada corrige el texto de una pregunta | exitoso | RF-ENC-33 |
| Una corrección inválida no llega al servidor (esquema, 2 ejemplos) | alternativo | RF-ENC-33 |
| El servidor rechaza la corrección y el texto anterior se conserva | error | RF-ENC-33 |
| Ada retira una pregunta y deja de ofrecerse | exitoso | RF-ENC-33 |

```gherkin
@RF-ENC-33 @alternativo
Esquema del escenario: Una corrección inválida no llega al servidor
  Dado que Ada abre la encuesta "Docencia"
  Cuando ella corrige la pregunta "El docente explica con claridad" para que diga "<texto nuevo>"
  Entonces el diálogo de la pregunta avisa "<aviso>"
  Y el diálogo de la pregunta sigue abierto
  Y el back recibió 0 correcciones

  Ejemplos:
    | texto nuevo                  | aviso                                              |
    | el DOCENTE llega a tiempo    | Ya hay una pregunta con ese texto en esta encuesta |
    | El docente   llega a tiempo  | Ya hay una pregunta con ese texto en esta encuesta |
```

### 2.2 Selección de la encuesta a usar — `esteban-seleccion-de-encuesta.feature`

| Escenario | Tipo | Requisito |
|---|---|---|
| Eva elige docente, materia y grupo y pasa a la evaluación | exitoso | RF-EVAL-11, RF-EVAL-12 |
| El buscador deja solo la materia que coincide | alternativo | RF-ACA-27 |
| Un docente ya evaluado no se puede volver a elegir | alternativo | RF-EVAL-11 |
| Si el servicio de docentes falla, Eva puede reintentar | error | RF-EVAL-11 |

Las materias de Eva se definen con una tabla de datos en los antecedentes (`docente | departamento | materia | código | respondida`).

### 2.3 Notificaciones — `esteban-notificaciones.feature`

La fecha se fija con `Dado que hoy es "2026-11-16"` (`cy.clock` solo sobre `Date`), así el escenario da el mismo resultado cualquier día.

| Escenario | Tipo | Requisito |
|---|---|---|
| La campana anuncia el estado de la ventana (esquema: abierta, cierra mañana, próxima) | exitoso | RF-NOT-34, RF-NOT-35 |
| Marcar todas como leídas quita el pendiente de la campana | alternativo | RF-NOT-35 |
| Sin ventanas programadas la campana no inventa avisos | error | RF-NOT-34 |

Cada escenario lleva etiquetas: `@ESTEBAN`, el requisito (`@RF-ENC-33`) y el tipo (`@exitoso`, `@alternativo`, `@error`). `@ESTEBAN` activa el back simulado de encuestas en el `Before` del elenco. Las demás sirven para la matriz de trazabilidad.

## 3. Screenplay

### 3.1 Actores

| Actor | Rol | Habilidades |
|---|---|---|
| Ada | administradora | `NavegarLaWeb`, `GestionarEncuestasSimuladas` |
| Eva | estudiante | `NavegarLaWeb`, `GestionarEncuestasSimuladas` |

El `Elenco` (`step-definitions/elenco.ts`) crea un actor nuevo en cada escenario. «ella» o «él» se refieren al último actor nombrado.

### 3.2 Tareas, interacciones y preguntas

| Tipo | Ejemplos | Archivo |
|---|---|---|
| **Tareas** | `CrearLaEncuesta.llamada(n)`, `AbrirLaEncuesta.llamada(n)`, `AgregarLaPregunta.conElTexto(t)`, `CorregirLaPregunta.que(a).paraQueDiga(b)`, `RetirarLaPregunta.que(t)`, `ElegirLaEncuesta.delDocente(d).enLaMateria(m).yElGrupo(g)`, `BuscarEnLaSeleccion.elTexto(t)`, `AbrirLaCampana`, `MarcarTodasComoLeidas` | `screenplay/tasks/encuestas.ts` |
| **Interacciones** | `EscribirEnElCampo.etiquetado(l).elTexto(t)`, `PulsarElBoton.llamado(t)`, `PulsarEnLaFila.de(f).elBoton(b)`, `ElegirEnLaLista.laOpcion(v).en(s)`, `FijarLaFechaDeHoy.en(f)`, `EsperarLaRespuesta.de(a)` | `screenplay/interactions/encuestas.ts` |
| **Preguntas** | `PreguntasEnPantalla.textos()`, `PreguntasGuardadas.activasDe(e)`, `EncuestasGuardadas.nombres()`, `CorreccionesEnviadas.cantidad()`, `AvisoDelDialogo.texto()`, `DialogoDeLaPregunta.abierto()`, `AvisosSinLeer.etiquetaDeLaCampana()` | `screenplay/questions/encuestas.ts` |
| **Habilidad** | `GestionarEncuestasSimuladas` (prepara datos y responde lo que quedó guardado) | `screenplay/abilities/encuestas.ts` |

Ejemplo del recorrido completo de una frase:

```gherkin
Cuando ella corrige la pregunta "El docente explica con claridad" para que diga "El docente explica con ejemplos"
```

```ts
// Paso: solo traduce la frase al actor
When(/^(…) corrige la pregunta "([^"]*)" para que diga "([^"]*)"$/, (nombre, actual, nuevo) => {
  actorLlamado(nombre).attemptsTo(CorregirLaPregunta.que(actual).paraQueDiga(nuevo))
})

// Tarea: qué quiere lograr, compuesta de interacciones
export const CorregirLaPregunta = {
  que: (actual) => ({
    paraQueDiga: (nuevo) =>
      tarea(`corrige «${actual}» para que diga «${nuevo}»`, () => [
        PulsarElBoton.con(E.editarLaPregunta(actual), `«Editar» en la pregunta «${actual}»`),
        EscribirEnElCampo.etiquetado(E.textoDeLaPregunta).elTexto(nuevo),
        PulsarElBoton.llamado(E.guardarCorreccion),
      ]),
  }),
}

// Pregunta: el actor comprueba el efecto en el back
Then('el back recibió {n} corrección', …
  actorLlamado('él').asksFor(CorreccionesEnviadas.cantidad()).should('eq', n))
```

Si cambia un botón de la pantalla, se cambia `ui-encuestas.ts` o una interacción. Los escenarios Gherkin no se tocan.

## 4. Cómo correrlo

```bash
# Front en 3001 (desde EntreAulas_Front)
npm run dev

# Desde EntreAulas_Front/e2e
npm run cy:bdd:esteban
# Solo una funcionalidad
npx cypress run --e2e --config-file cypress.bdd.config.ts --spec cypress/features/esteban-notificaciones.feature
```

Desde la terminal de VS Code se antepone `env -u ELECTRON_RUN_AS_NODE` (ver punto 7).

El filtro por etiquetas (`--env tags=…` o `TAGS=…`) no tiene efecto con Cypress 16 y esta versión del preprocesador: se probó y corrieron los 17 escenarios. Por eso se filtra por archivo. Las etiquetas se conservan para la trazabilidad con el requisito y el tipo de camino.

## 5. Resultado

```text
  Creación de encuestas
    √ Ada crea una encuesta nueva
    √ Una encuesta sin nombre no se guarda
    √ Ada agrega una pregunta a una encuesta existente
    √ Ada corrige el texto de una pregunta
    √ Una corrección inválida no llega al servidor (example #1)
    √ Una corrección inválida no llega al servidor (example #2)
    √ El servidor rechaza la corrección y el texto anterior se conserva
    √ Ada retira una pregunta y deja de ofrecerse
  Notificaciones de la ventana de evaluación
    √ La campana anuncia el estado de la ventana (example #1)
    √ La campana anuncia el estado de la ventana (example #2)
    √ La campana anuncia el estado de la ventana (example #3)
    √ Marcar todas como leídas quita el pendiente de la campana
    √ Sin ventanas programadas la campana no inventa avisos
  Selección de la encuesta a usar
    √ Eva elige docente, materia y grupo y pasa a la evaluación
    √ El buscador deja solo la materia que coincide
    √ Un docente ya evaluado no se puede volver a elegir
    √ Si el servicio de docentes falla, Eva puede reintentar

  ✔  All specs passed!   01:12   17   17
```

Evidencias:

- `evidencias/bdd-esteban.txt`: salida de la consola.
- `evidencias/bdd-esteban-cucumber.html`: informe HTML de Cucumber.
- `reports/cypress/bdd/videos/`: un video por característica.

## 6. Diferencias entre lo planeado y lo ejecutado

- **Primera corrida, 14/17.** Las 3 fallas estaban en el código de prueba, no en la aplicación:
  - La expresión `corrección(es)` de Cucumber genera «correcciónes». Se cambió por una expresión regular.
  - La pregunta del contador de la campana transformaba el valor con `.then()`, lo que impedía que Cypress reintentara mientras cargaban las ventanas. Ahora devuelve la etiqueta sin transformar y el paso compara con `should`.
- **Ejemplo eliminado del esquema.** Se quería un ejemplo con el texto en blanco, pero Gherkin recorta los espacios de las celdas y el campo tiene `required`: la validación del navegador lo detenía antes de la regla de la aplicación. Ese caso queda en la unidad (punto 6) y en el escenario «Una encuesta sin nombre no se guarda».
- **Regresión de la suite BDD del equipo.** Con el elenco modificado, `rediseno-coordinador` y `rq2-inicio-de-sesion` siguen en verde. `rq11-enviar-evaluacion` falla igual **sin** estos cambios: busca un botón «Nueva Evaluación» que el panel rediseñado del estudiante ya no tiene. Es un defecto del escenario de RQ11, no de este punto.

# 4. Ejecución de las pruebas

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Alcance | RF-ENC-32, RF-ENC-33, RF-NOT-34, RF-NOT-35 |
| Fecha de esta ejecución | 16 de noviembre de 2026 |
| Resultado | 34 pruebas, 34 en verde, 0 fallos |

La selección de encuesta (RF-EVAL-11, RF-EVAL-12, RF-ACA-27) no tiene suite propia en esta corrida. Este punto ejecuta las pruebas automatizadas de creación y retiro de preguntas y de las notificaciones de la ventana.

## 1. Cómo se corrió

Desde `EntreAulas_Front`:

```bash
node scripts/vitest.mjs run src/test/unit/evaluaciones/rf-not-34-35-notificaciones.test.ts src/test/integration/rf-not-35-lista-notificaciones.test.tsx src/test/integration/rf-enc-32-33-encuesta.test.tsx
```

Desde `EntreAulas_Back`:

```bash
npx vitest run src/test/unit/evaluaciones/rf-enc-32-33-encuesta.test.ts src/test/unit/evaluaciones/rf-enc-32-33-controlador.test.ts
```

El front usa Vitest 5.1.0. El back usa Vitest 2.1.9. No hubo red ni base real: el repositorio de preguntas está simulado y las ventanas de evaluación se pasan como datos de prueba.

## 2. Planeado y ejecutado

| Nivel | Archivo | Pruebas | Resultado |
|---|---|---|---|
| Unitario, front | `src/test/unit/evaluaciones/rf-not-34-35-notificaciones.test.ts` | 8 | 8 verdes |
| Componente, front | `src/test/integration/rf-not-35-lista-notificaciones.test.tsx` | 3 | 3 verdes |
| Componente, front | `src/test/integration/rf-enc-32-33-encuesta.test.tsx` | 5 | 5 verdes |
| Servicio, back | `src/test/unit/evaluaciones/rf-enc-32-33-encuesta.test.ts` | 8 | 8 verdes |
| Contrato HTTP, back | `src/test/unit/evaluaciones/rf-enc-32-33-controlador.test.ts` | 10 | 10 verdes |
| **Total** | | **34** | **34 verdes** |

Duración aproximada: 11,4 s el front y 1,9 s el back.

## 3. Qué cubre cada requisito

| Requisito | Casos que pasaron |
|---|---|
| RF-ENC-32 | Alta con confirmación en pantalla; texto en blanco no llama al API; pregunta activa y no obligatoria por defecto; se conserva obligatoria si se pide; 201 con cuerpo completo; 400 si faltan campos; el fallo del almacén no confirma el alta |
| RF-ENC-33 | Desactivar desde la tabla; si el retiro falla la fila sigue; corrección sobre el id indicado; sin id no actualiza ni desactiva; el servicio que responde `false` no confirma la desactivación |
| RF-NOT-34 | Sin ventanas no hay aviso; ventana abierta anuncia el cierre; a 2 días o menos el aviso es urgente; antes de abrir anuncia la próxima; una ventana ya cerrada no deja aviso |
| RF-NOT-35 | El estudiante ve «Evaluar ahora»; el docente ve «Ver reportes» y el admin no tiene acción; el id cambia si cambian las fechas; la campana muestra el aviso; marcar leídas guarda la clave en `localStorage`; sin ventanas dice que no hay notificaciones |

## 4. Diferencia entre lo diseñado y lo observado

No apareció ningún fallo. En el controlador, el caso que simula un error de base escribe `Error: db` en la consola y aun así la prueba queda en verde: ese mensaje es el camino de error que el caso provoca a propósito.

En esta corrida la pantalla `TeacherSelection` todavía no tenía suite. Esos casos (RF-EVAL-11, RF-EVAL-12 y RF-ACA-27) quedaron en el punto 6, con Vitest, y en el punto 7, con Cypress.

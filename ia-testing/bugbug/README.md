# BugBug: pruebas de RQ1–RQ5

## Propósito

BugBug es una herramienta de grabación y reproducción de pruebas E2E que funciona como extensión de Chrome y corre en la nube. Se apoya en IA para que las pruebas grabadas sean estables:

- **Selectores inteligentes:** al grabar, guarda varios selectores alternativos por elemento y, si uno cambia, prueba los demás (*self-healing*).
- **Espera activa automática:** espera a que el elemento esté listo, sin `sleep`. Esto importa en EntreAulas porque framer-motion anima los formularios al montar.
- **Edit & Rewind:** permite regrabar un paso desde la mitad de la prueba sin repetir todo.

Aquí se usa como **segunda herramienta *no-code*** sobre el despliegue real (Vercel + Render), para comparar el esfuerzo y la estabilidad frente a las pruebas escritas a mano (Cypress) y las generadas por IA (Playwright y Testsigma).

## Configuración (una vez)

1. Crea una cuenta en <https://bugbug.io> e instala la extensión **BugBug** en Chrome.
2. Abre **New project**:
   - Nombre: `EntreAulas RQ1–RQ5`.
   - Homepage URL: `https://entre-aulas-front.vercel.app`.
3. En **Project settings → Variables**, crea estas variables. En los pasos se usan como `{{nombre}}`.

   | Variable | Valor |
   |---|---|
   | `url` | `https://entre-aulas-front.vercel.app` |
   | `admin_email` / `admin_password` | admin de pruebas |
   | `estudiante_email` / `estudiante_password` | estudiante activo de pruebas |
   | `clave_valida` | `Clave#2026a` |

4. En **Project settings → Browser**, elige ventana de 1366×900 e idioma `es-CO`.
5. Graba primero el componente reutilizable **Login como admin** (en BugBug se llama *Component*). Se reutiliza en todas las pruebas de RQ1.

## Importación desde YAML

La primera versión de la suite se importó desde 13 archivos YAML en el formato de BugBug (**Tests → Actions → Import**). Esos archivos se generaron a partir de `guiones-rq1-rq5.md` y se validaron contra el esquema oficial.

La suite final quedó en el proyecto de BugBug, así que los YAML se quitaron del repositorio. Siguen disponibles en el historial, en el commit `c14ec89`.

En `resultados.md` se registra qué pruebas importadas se ejecutaron sin cambios y cuáles hubo que regrabar (BB-H1).

## Grabar las pruebas

Sigue `guiones-rq1-rq5.md`. Para cada prueba:

1. Pulsa **New test → Record**, ponle el nombre del guion (por ejemplo `BB-RQ2-01 Login estudiante`) y realiza los pasos en la ventana que abre BugBug.
2. Agrega cada verificación con **Add assertion**:
   - *Element is visible* / *Text contains*.
   - *Page URL contains*.
3. En los campos de texto, cambia el valor grabado por la variable, por ejemplo `{{estudiante_email}}`.
4. En los datos únicos, como el usuario nuevo de RQ1, usa un paso **Custom JavaScript**. El script está en el guion.
5. Detén la grabación y ejecuta la prueba una vez con **Run** (en local) para confirmar que pasa.

Agrupa las pruebas en la suite **Regresión RQ1–RQ5**.

## Ejecución y evidencias

1. Ejecuta la suite en la nube (**Run in cloud**) antes del despliegue final y después de él. Puedes programarla en **Schedules** para que corra después de cada despliegue.
2. Descarga o captura el reporte de **Runs history** (con capturas por paso) y guárdalo en `evidencias/` como `AAAA-MM-DD-antes.png` o `AAAA-MM-DD-despues.png`.
3. Completa `resultados.md`, sobre todo la columna de *self-healing*. Después de la refactorización varios elementos cambian (`aria-label`, `role="alert"`, el wrapper del botón de login), y esa columna registra si BugBug siguió encontrándolos.

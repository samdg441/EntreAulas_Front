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

## Importar las pruebas (sin grabar)

La carpeta `importar/` tiene **13 pruebas en el formato YAML de BugBug**, generadas a partir de `guiones-rq1-rq5.md`:

- Las 13 se validaron contra el JSON Schema oficial (`https://api.bugbug.io/v2/schema/yaml/v1/`).
- Sus selectores se comprobaron contra el front desplegado: cada XPath encuentra exactamente un elemento.

**Pasos:**

1. Crea en **Project settings → Variables** estas variables:
   - `url` (por ejemplo `https://entre-aulas-front.vercel.app`)
   - `admin_email`, `admin_password`
   - `estudiante_email`, `estudiante_password`
   - `clave_valida` (`Clave#2026a`)

   Marca las claves como secretas.
2. En **Tests → Actions → Import**, sube cada `*.bugbug.yaml`. Si BugBug encuentra el mismo *slug*, elige *Overwrite*.
3. Crea la suite **Regresión RQ1–RQ5** con las 13 pruebas y ejecútala (**Run** en local o **Run in cloud**).

| Archivo | Guion |
|---|---|
| `bb-rq2-01..04-*` | RQ2: login exitoso, clave incorrecta, tipo equivocado, correo sin arroba |
| `bb-rq1-01..04-*` | RQ1: crear estudiante (usuario único con una variable `evaluate`), clave débil, dominio según el tipo, estudiante sin acceso |
| `bb-rq3-01..03-*` | RQ3.1: correo registrado, no registrado y con formato inválido |
| `bb-rq32-01..02-*` | RQ3.2: token inexistente y enlace incompleto |

**Siguen siendo de grabación manual** BB-RQ4-01, BB-RQ5-01, BB-RQ5-02 y BB-RQ5-03. Necesitan un enlace de recuperación **real** recibido por correo (Inbox de BugBug o buzón propio), así que no se pueden describir con datos fijos.

**Contra local:** si `url` apunta a `http://localhost:3001`, usa **Run** (en local, con la extensión). La nube de BugBug no llega a tu máquina.

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

# Testsigma: pruebas de RQ1–RQ5

> **Estado: reemplazada por TestSprite (2026-10-26).** Testsigma no permite crear la cuenta en el momento: el registro queda a la espera de una aprobación del proveedor, que no llegó antes de la entrega. Los 18 casos y el CSV se conservan como diseño de pruebas. La ejecución con IA se hizo con TestSprite (`../testsprite/`).

## Propósito

Testsigma es una plataforma *low-code* con IA. En este proyecto se usa para tres cosas:

1. **Escribir pruebas en lenguaje natural** (NLP) sobre el despliegue real (Vercel + Render), sin código.
2. **Generar casos con su IA (Copilot / Atto)** a partir del texto de los requisitos y comparar lo que propone con los casos diseñados por el equipo.
3. **Aprovechar el *auto-healing***: si cambia un localizador (por ejemplo, cuando la refactorización agrega `aria-label` o `role="alert"`), la IA propone el nuevo elemento en vez de fallar.

## Configuración (una vez)

1. Crea una cuenta en <https://testsigma.com> (plan gratuito o *trial*).
2. Abre **Create Project**:
   - Nombre: `EntreAulas RQ1–RQ5`.
   - Tipo de aplicación: **Web Application**.
3. En **Test Development → Elements**, deja activado el registro de elementos con IA. La extensión **Testsigma Recorder** de Chrome debe estar instalada.
4. En **Test Data → Test Data Profiles**, crea el perfil `cuentas-entreaulas` con estos parámetros. Usa las cuentas de prueba del equipo; las claves no se suben al repositorio.

   | Parámetro | Ejemplo |
   |---|---|
   | `url` | `https://entre-aulas-front.vercel.app` |
   | `admin_email` | correo del admin de pruebas |
   | `admin_password` | clave del admin de pruebas |
   | `estudiante_email` | correo de un estudiante de prueba activo |
   | `estudiante_password` | su clave |
   | `clave_valida` | `Clave#2026a` |

5. En **Test Data → Environments**, crea el entorno `produccion` con `url = https://entre-aulas-front.vercel.app`.
6. En **Settings → AI**, activa **Auto Healing** y **Copilot**, si el plan lo incluye.

## Cargar los casos

Hay dos opciones:

- **Manual / NLP:** crea un *Test Case* por cada fila de `casos-rq1-rq5.md` y pega los pasos tal como están. La sintaxis `@|parametro|` es la de los parámetros del perfil de datos y `~|random|` genera datos aleatorios.
- **Importar:** en **Test Cases → Import** sube `casos-rq1-rq5.csv` y asigna las columnas `Test Case Name`, `Description`, `Priority`, `Requirement` y `Steps`. Si tu versión pide otro formato, usa la plantilla que ofrece el asistente de importación y copia las columnas de este CSV.

Agrupa los casos en **Test Suites**: `RQ1`, `RQ2`, `RQ3`, `RQ4` y `RQ5`. Crea también el **Test Plan** `Regresión RQ1–RQ5`, que contiene las cinco suites y corre en Chrome sobre el entorno `produccion`.

## Generación con IA (Copilot)

En un *Test Case* vacío, abre **Copilot / Generate with AI** y pega el texto de cada requisito (está en la sección "Prompts" de `casos-rq1-rq5.md`). Guarda los casos que genere con el sufijo `[IA]` para compararlos con los del equipo. En `resultados.md` anota:

- cuántos pasos propuso,
- cuántos hubo que corregir,
- qué escenarios agregó que el equipo no tenía y cuáles le faltaron.

## Ejecución y evidencias

1. Ejecuta el Test Plan antes del despliegue final (línea base) y después del despliegue refactorizado.
2. Descarga el reporte (PDF o captura de **Run Results**) y guárdalo en `evidencias/` con el nombre `AAAA-MM-DD-antes.png` o `AAAA-MM-DD-despues.png`.
3. Completa `resultados.md`.

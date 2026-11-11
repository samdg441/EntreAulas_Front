# 1. Presentación del proyecto y alcance individual

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Repositorios | `EntreAulas_Front` (rama `esteban-testing`, commit `4b4d957`) y `EntreAulas_Back` (commit `6fa5762`) |
| Fecha | 11 de noviembre de 2026 |
| Punto de la rúbrica | Presentación del proyecto y alcance individual (5 puntos) |

Inicio de sesión y el CRUD de usuarios quedan fuera de este alcance. No se cuentan como funcionalidades de ningún integrante.

## 1. El proyecto

EntreAulas es la plataforma web con la que la Facultad de Ingenierías de la Universidad de Medellín hace la evaluación temprana de docentes. Reemplaza el formulario estático por un flujo digital: el administrador arma la encuesta, el estudiante elige a quién evaluar y el sistema avisa cuándo la ventana está abierta o por abrir. Docentes, coordinadores y el decano consultan resultados; esa consulta pertenece a otros integrantes.

## 2. Tipo de software

Aplicación web cliente-servidor, de uso interno de la universidad. El cliente es una aplicación de una sola página. El servidor expone una API REST. Los datos viven en PostgreSQL, accedido a través de Supabase. Hay cuatro roles: estudiante, profesor, coordinador y administrador.

## 3. Arquitectura

```text
Navegador
  React + Vite  (EntreAulas_Front)
        |  HTTPS, JSON, JWT
        v
  Express       (EntreAulas_Back)
        |
        v
  Supabase / PostgreSQL
```

El front no habla con la base. Llama a la API con Axios (`VITE_API_URL`, por defecto `http://localhost:3000`). El back valida el JWT, aplica el rol y lee o escribe en Supabase. Las notificaciones de la ventana de evaluación se calculan en el front a partir de las fechas que devuelve el back: no hay una tabla de notificaciones en la base.

## 4. Tecnologías y versión instalada

Medido en esta máquina el 11 de noviembre de 2026.

| Pieza | Versión instalada o declarada |
|---|---|
| Node.js | 24.14.0 |
| npm | 11.9.0 |
| Front | 0.0.1 |
| React / React DOM | 18.3.1 / 18.2.0 |
| TypeScript (front) | 5.2.2 |
| Vite | 7.1.12 |
| React Router | 7.18.4 |
| Tailwind CSS | 3.3.5 |
| Vitest (front) | 5.0.2 |
| Back | 0.1.0 |
| Express | 4.22.2 |
| TypeScript (back) | 5.5.4 |
| Supabase JS | 2.39.0 |
| Zod | 3.22.4 |
| Vitest (back) | 2.1.9 |

Otras librerías del producto: Axios, Recharts, Framer Motion, Helmet, JWT, bcrypt y Nodemailer. Las de prueba (Cypress, Cucumber, Screenplay, Stagehand, DeepEval, Jenkins, Docker y SonarQube) se detallan en los puntos siguientes de la rúbrica, no en este.

## 5. Módulos seleccionados

Los módulos de este alcance son los de la encuesta y los de su aviso. El de autenticación y el de administración de usuarios no entran.

| Módulo | Dónde está | Qué hace en este alcance |
|---|---|---|
| Encuestas (front) | `src/features/dashboard-admin/AdminSurveysPage.tsx`, `src/api/surveys.api.ts` | Crear, listar y desactivar preguntas |
| Encuestas (back) | `src/modules/evaluations/evaluations.routes.ts` | `GET/POST /questions`, `PUT/DELETE /questions/:id`, `GET /categories` |
| Selección | `src/features/evaluations/TeacherSelection.tsx`, ruta `/evaluate/selection` | Elegir docente, materia y grupo de la encuesta vigente |
| Notificaciones | `src/lib/notificaciones.ts`, `src/components/NotificationDropdown.tsx` | Armar la lista y mostrarla en el encabezado |

## 6. Requisitos de Esteban Arias

La selección de la encuesta ya existe en el catálogo: **RF-EVAL-11**, **RF-EVAL-12** y **RF-ACA-27**. La creación de la encuesta y las notificaciones no tenían fila. Se crean con el prefijo del módulo y el número siguiente al último del catálogo (`RF-IA-31`).

| ID | Título | Descripción | Prioridad | Clasificación | Estado |
|---|---|---|---|---|---|
| RF-ENC-32 | Creación de una pregunta de la encuesta | Dado que un administrador o coordinador arma el instrumento, cuando registra una pregunta con categoría, texto, tipo, obligatoriedad, orden y carrera, entonces el sistema la guarda y la incluye en la encuesta. | 8 | Obligatorio | Pendiente |
| RF-ENC-33 | Corrección o retiro de una pregunta | Dado que una pregunta ya forma parte de la encuesta, cuando el administrador o coordinador la edita o la desactiva, entonces el sistema aplica el cambio y la pregunta desactivada deja de ofrecerse. | 6 | Obligatorio | Pendiente |
| RF-NOT-34 | Generación de la notificación de la ventana | Dado que existen ventanas de evaluación, cuando llega la fecha de consulta, entonces el sistema produce un aviso de evaluación abierta, uno de próxima apertura, o ninguno. | 5 | Importante | Pendiente |
| RF-NOT-35 | Lista de notificaciones | Dado que el usuario está autenticado y hay avisos de la ventana, cuando abre la campana, entonces ve cada aviso, puede marcarlo leído y seguir la acción de su rol. | 5 | Importante | Pendiente |

Las cinco funcionalidades del alcance quedan así:

| # | Funcionalidad | Requisito | Módulo |
|---|---|---|---|
| 1 | Crear una pregunta de la encuesta | RF-ENC-32 | `AdminSurveysPage`, `POST /api/evaluations/questions` |
| 2 | Corregir o retirar una pregunta | RF-ENC-33 | `PUT` y `DELETE /api/evaluations/questions/:id` |
| 3 | Elegir la encuesta a responder | RF-EVAL-11, RF-EVAL-12, RF-ACA-27 | `TeacherSelection`, `/evaluate/selection` |
| 4 | Generar la notificación de la ventana | RF-NOT-34 | `notificacionesDeEvaluacion` |
| 5 | Ver la lista de notificaciones | RF-NOT-35 | `NotificationDropdown` |

## 7. Cinco funcionalidades de cada integrante

El reparto es el que ya está en el plan de pruebas del semestre. Se omiten el inicio de sesión y el alta, la edición y la baja de usuarios.

### Esteban Arias

RF-ENC-32, RF-ENC-33, la selección ya catalogada (RF-EVAL-11, RF-EVAL-12, RF-ACA-27), RF-NOT-34 y RF-NOT-35. Sección 6.

### Samuel Gallego

| # | Funcionalidad |
|---|---|
| S1 | Generar y validar el código QR de la evaluación |
| S2 | Llevar a cada rol a su panel después de autenticarse |
| S3 | Calcular las métricas de una evaluación |
| S4 | Consultar las estadísticas históricas |
| S5 | Exportar el reporte del coordinador |

### Andre Rivas

| # | Funcionalidad |
|---|---|
| A1 | Ver las estadísticas de las evaluaciones del estudiante |
| A2 | Enviar la evaluación docente |
| A3 | Resumir en automático los comentarios de un curso |
| A4 | Resumir los comentarios de una carrera o una facultad |
| A5 | Alertar indicios de acoso junto con el resumen |

Gestionar usuarios (alta, edición y desactivación) es CRUD de usuarios y no entra en esta lista.

### Juliana Franco

| # | Funcionalidad |
|---|---|
| J1 | Solicitar el enlace de recuperación de contraseña |
| J2 | Validar el token de recuperación |
| J3 | Enviar el enlace por correo |
| J4 | Definir la nueva contraseña con un token vigente |
| J5 | Revocar las sesiones abiertas al cambiar la clave |

El inicio de sesión y el registro de usuarios por el administrador no se cuentan.

## 8. Qué queda fuera

- Inicio de sesión, registro de usuarios y gestión de cuentas.
- Reportes, resúmenes con IA, QR y estadísticas, que son de Samuel y de Andre.
- El contenido visual del correo y el despliegue en Render o Vercel. Esos entran en puntos posteriores de la rúbrica.

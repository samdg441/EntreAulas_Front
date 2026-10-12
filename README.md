# EntreAulas Frontend

## Descripción general
EntreAulas Frontend es la interfaz web de una solución orientada a modernizar y digitalizar el proceso de evaluación temprana de docentes en la Facultad de Ingenierías. El proyecto busca reemplazar las encuestas tradicionales realizadas mediante formularios estáticos por una plataforma más dinámica, visualmente atractiva y alineada con la identidad institucional.

La aplicación permite a estudiantes, docentes, coordinadores y administradores interactuar con un sistema de evaluaciones, reportes y gestión de usuarios de forma más intuitiva y organizada.

## Objetivo del proyecto
El propósito principal de EntreAulas es mejorar la experiencia de evaluación docente mediante una plataforma moderna que:

- ofrezca una interfaz más clara y visualmente representativa de la universidad;
- reduzca la cantidad de preguntas y haga las encuestas más generales y menos repetitivas;
- facilite la captura de opiniones de forma digital y eficiente;
- permita consultar resultados y reportes de manera más accesible;
- fortalezca el proceso de seguimiento académico y administrativo.

## Funcionalidades principales
La aplicación incluye las siguientes capacidades:

- Autenticación de usuarios y recuperación de contraseña.
- Dashboards diferenciados según el rol del usuario:
  - estudiante
  - profesor
  - coordinador
  - decano / administrador
- Proceso de evaluación docente desde la interfaz web.
- Acceso mediante código QR para participar en evaluaciones.
- Visualización de reportes y resultados de encuestas.
- Gestión de profesores, usuarios y contenidos relacionados con las evaluaciones.
- Rutas protegidas y control de permisos por rol.

## Tecnologías utilizadas
El frontend está desarrollado con las siguientes tecnologías:

- React
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Recharts
- Axios
- XLSX, ExcelJS, jsPDF y FileSaver
- Lucide React

## Estructura del proyecto
La estructura principal del repositorio es la siguiente:

- src/: contiene la lógica principal de la aplicación.
  - api/: servicios y consumo de APIs.
  - components/: componentes reutilizables de interfaz.
  - context/: manejo de autenticación y estado global.
  - pages/: vistas principales del sistema.
  - types/: definiciones de tipos TypeScript.
  - utils/: utilidades auxiliares para exportación y funciones complementarias.

## Requisitos previos
Para ejecutar este proyecto localmente, es necesario contar con:

- Node.js 18 o superior
- npm o un gestor de paquetes compatible
- Un backend funcional que exponga la API utilizada por la aplicación

## Instalación
1. Clona el repositorio.
2. Instala las dependencias:

   npm install

3. Configura la variable de entorno para la API:

   VITE_API_URL=http://localhost:3000

4. Inicia el entorno de desarrollo:

   npm run dev

## Scripts disponibles
El proyecto incluye los siguientes scripts:

- npm run dev: inicia el servidor de desarrollo con Vite.
- npm run build: genera la versión de producción.
- npm run preview: previsualiza la build generada.
- npm run lint: ejecuta el análisis estático del código.
- npm run test:selenium: ejecuta las pruebas E2E de RQ1 a RQ5 (ver la sección siguiente).

## Pruebas E2E RQ1–RQ5 (Screenplay + Selenium)
Están en `screenplay-selenium/`, un subproyecto con su propio `package.json` para que `npm ci` del front no descargue las dependencias de E2E. Usan Serenity/JS con WebdriverIO (protocolo WebDriver, el mismo de Selenium) y Cucumber en español, con el patrón Screenplay: actores, tareas (`test/tasks`), interacciones (`test/interactions`), preguntas (`test/questions`) y localizadores (`test/ui`). Los steps solo llaman a tareas y a `Ensure.that/eventually(pregunta, expectativa)`.

| RQ | Feature | Exitosos | Alternativos |
|---|---|---|---|
| RQ1 | `rq1-*.feature` | crear estudiante, crear docente | correo duplicado, clave corta, estudiante sin acceso |
| RQ2 | `rq2-inicio-de-sesion.feature` | 4 roles llegan a su panel | clave mala, correo inexistente, cuenta inactiva, tipo no coincide, correo sin arroba |
| RQ3 / 3.2 | `rq3-*.feature` | correo registrado | correo no registrado, formato inválido, token inexistente o expirado, enlace incompleto |
| RQ4 | `rq4-*.feature` (API) | enlace de 64 hex | enlaces distintos, correo no registrado, formato inválido |
| RQ5 | `rq5-*.feature` | cambia la clave e ingresa; la anterior deja de servir | no coinciden, 5 reglas de política, token reutilizado |

Cómo correrlas:
1. Back en :3000 y front en :3001 (`VITE_API_URL` apuntando al back). El `.env` del back debe tener `PASSWORD_RESET_DEBUG_RESPONSE=true` (solo desarrollo; RQ4 y RQ5 lo necesitan para obtener el enlace de recuperación).
2. Sembrar las cuentas: en `EntreAulas_Back`, `npx ts-node src/scripts/seed-rq1-rq2-fixtures.ts` y `seed-rq3-rq4-fixtures.ts`.
3. Desde el front: `npm run test:selenium`. Para un solo archivo: `cd screenplay-selenium && npx wdio run wdio.conf.ts --spec features/rq2-inicio-de-sesion.feature`.

Variables: `NAVEGADOR=chrome|firefox` (por defecto Brave en `/usr/bin/brave`), `NAVEGADOR_BIN`, `CHROMEDRIVER_BIN` (por defecto `~/.cache/chromedriver-154/...`, su versión mayor debe coincidir con la del navegador), `HEADLESS=false`, `FRONT_URL` y `API_URL`.

Cada corrida crea usuarios `e2e.*` en la base configurada en el back; se pueden borrar con `delete from usuarios where email like 'e2e.%'`.

## Flujo de uso esperado
1. El usuario ingresa con sus credenciales.
2. El sistema redirige al dashboard correspondiente según su rol.
3. El estudiante puede responder evaluaciones de docentes.
4. El profesor y el coordinador pueden revisar resultados y reportes.
5. Los administradores pueden gestionar usuarios y otros recursos del sistema.

## Notas de arquitectura
La aplicación está organizada de forma modular, separando responsabilidades entre vistas, componentes, servicios y contexto de autenticación. Esto facilita su mantenimiento y permite escalar la plataforma a medida que se incorporen nuevas funcionalidades.

## Estado del proyecto
Este proyecto se encuentra en desarrollo como una solución frontend para el proceso de evaluación institucional, con enfoque en experiencia de usuario, usabilidad y modernización de flujos existentes.

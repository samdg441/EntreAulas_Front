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

# language: es
@web @REDISENO
Característica: Panel del coordinador rediseñado: auditoría, gestión de profesores y accesibilidad
  Como coordinador de carrera
  Quiero un panel con indicadores, una barra lateral por secciones y una vista de auditoría
  Para supervisar a los docentes, saber quién hizo qué y usar la plataforma con comodidad

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que el back responde el panel del coordinador con docentes, una evaluación programada y eventos de auditoría

  Escenario: El panel muestra los indicadores y la barra lateral agrupa los accesos por secciones
    Cuando Carlos inicia sesión con la cuenta "coordinador"
    Entonces él ve el indicador "Promedio general" con el valor "4.50"
    Y él ve en la barra lateral la sección "Control" con el enlace "Auditoría"
    Y él ve en la barra lateral la sección "Docentes" con el enlace "Gestión de profesores"
    Y él no ve el mensaje "Acciones Rápidas"

  Escenario: El calendario muestra las fechas de la evaluación programada
    Cuando Carlos inicia sesión con la cuenta "coordinador"
    Entonces él ve en el calendario un día de apertura y un día de cierre de la evaluación
    Y él ve el mensaje "Periodo 2026-2"

  Escenario: El coordinador consulta la auditoría y filtra por acción
    Dado que Carlos inició sesión con la cuenta "coordinador"
    Cuando él abre la auditoría desde la barra lateral
    Y él filtra la auditoría por la acción "Generó códigos QR"
    Entonces la auditoría lista 1 evento
    Y él ve el mensaje "María Gómez"

  Escenario: El coordinador encuentra a los docentes en riesgo en la gestión de profesores
    Dado que Carlos inició sesión con la cuenta "coordinador"
    Cuando él abre la gestión de profesores
    Y él filtra a los docentes en riesgo
    Entonces la lista de docentes muestra a "Marta Díaz"
    Y la lista de docentes no muestra a "Ana Pérez"

  Escenario: El coordinador activa el modo noche, el inglés y la letra grande
    Dado que Carlos inició sesión con la cuenta "coordinador"
    Cuando él elige el modo "Noche", el idioma "Inglés" y la letra "Grande"
    Entonces la página está en modo noche
    Y el idioma de la página es "en"
    Y él ve el mensaje "Teacher overview"

  Escenario: Un estudiante no puede abrir la auditoría
    Cuando Eva inicia sesión con la cuenta "estudiante"
    Y ella abre directamente "/auditoria"
    Entonces la ruta actual es "/forbidden"

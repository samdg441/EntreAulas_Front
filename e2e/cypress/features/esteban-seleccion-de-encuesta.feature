# language: es
@web @ESTEBAN @RF-EVAL-11 @RF-EVAL-12 @RF-ACA-27
Característica: Selección de la encuesta a usar
  Como estudiante matriculada
  Quiero elegir el docente, la materia y el grupo que voy a evaluar
  Para responder la encuesta correcta sin repetir una evaluación ya hecha

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que Eva está matriculada con los docentes:
      | docente    | departamento | materia        | código | respondida |
      | Ana Ruiz   | Sistemas     | Bases de datos | BD-101 | no         |
      | Luis Gómez | Básica       | Cálculo        | MAT-2  | no         |
      | Rosa Mejía | Sistemas     | Redes          | RED-3  | sí         |

  @RF-EVAL-11 @RF-EVAL-12 @exitoso
  Escenario: Eva elige docente, materia y grupo y pasa a la evaluación
    Dado que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Cuando ella elige al docente "Ana Ruiz", la materia "BD-101" y el grupo "01"
    Entonces la ruta actual es "/evaluate/form"

  @RF-ACA-27 @alternativo
  Escenario: El buscador deja solo la materia que coincide
    Dado que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Cuando ella busca "MAT-2" en la selección
    Entonces ella ve el mensaje "Luis Gómez"
    Y ella no ve el mensaje "Ana Ruiz"

  @RF-EVAL-11 @alternativo
  Escenario: Un docente ya evaluado no se puede volver a elegir
    Dado que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Entonces ella ve el mensaje "Respondida"
    Cuando ella intenta elegir al docente "Rosa Mejía"
    Entonces ella ve el mensaje "Primero selecciona un docente"

  @RF-EVAL-11 @error
  Escenario: Si el servicio de docentes falla, Eva puede reintentar
    Dado que el servicio de docentes no está disponible
    Y que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Entonces ella ve el mensaje "Error al cargar los profesores"
    Y ella ve el mensaje "Reintentar"

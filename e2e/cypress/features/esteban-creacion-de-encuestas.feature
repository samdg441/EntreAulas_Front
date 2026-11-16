# language: es
@web @ESTEBAN @RF-ENC-32 @RF-ENC-33
Característica: Creación de encuestas
  Como administradora de EntreAulas
  Quiero crear encuestas y mantener sus preguntas
  Para que los estudiantes evalúen a sus docentes con un instrumento correcto y actualizado

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que la encuesta "Docencia" tiene las preguntas:
      | El docente explica con claridad |
      | El docente llega a tiempo       |
    Y que Ada inició sesión con la cuenta "admin"
    Y que Ada abre la administración de encuestas

  @RF-ENC-32 @exitoso
  Escenario: Ada crea una encuesta nueva
    Cuando Ada crea la encuesta "Evaluación de cierre"
    Entonces ella ve el mensaje "Encuesta agregada"
    Y el back guarda la encuesta "Evaluación de cierre"

  @RF-ENC-32 @error
  Escenario: Una encuesta sin nombre no se guarda
    Cuando Ada crea la encuesta "   "
    Entonces ella ve el mensaje "Escribe el nombre de la encuesta"
    Y el back no guarda la encuesta "   "

  @RF-ENC-32 @exitoso
  Escenario: Ada agrega una pregunta a una encuesta existente
    Dado que Ada abre la encuesta "Docencia"
    Cuando ella agrega la pregunta "El docente responde las dudas"
    Entonces ella ve el mensaje "Pregunta agregada a la encuesta"
    Y la tabla de preguntas muestra "El docente responde las dudas"
    Y la encuesta "Docencia" guarda las preguntas activas:
      | El docente explica con claridad |
      | El docente llega a tiempo       |
      | El docente responde las dudas   |

  @RF-ENC-33 @exitoso
  Escenario: Ada corrige el texto de una pregunta
    Dado que Ada abre la encuesta "Docencia"
    Cuando ella corrige la pregunta "El docente explica con claridad" para que diga "El docente explica con ejemplos"
    Entonces ella ve el mensaje "Pregunta actualizada"
    Y la tabla de preguntas muestra "El docente explica con ejemplos"
    Y la tabla de preguntas no muestra "El docente explica con claridad"
    Y el back recibió 1 corrección

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

  @RF-ENC-33 @error
  Escenario: El servidor rechaza la corrección y el texto anterior se conserva
    Dado que el back rechazará la próxima corrección con "El texto de la pregunta es obligatorio."
    Y que Ada abre la encuesta "Docencia"
    Cuando ella corrige la pregunta "El docente explica con claridad" para que diga "El docente explica con ejemplos"
    Entonces el diálogo de la pregunta avisa "El texto de la pregunta es obligatorio."
    Y el diálogo de la pregunta sigue abierto
    Y la encuesta "Docencia" guarda las preguntas activas:
      | El docente explica con claridad |
      | El docente llega a tiempo       |

  @RF-ENC-33 @exitoso
  Escenario: Ada retira una pregunta y deja de ofrecerse
    Dado que Ada abre la encuesta "Docencia"
    Cuando ella retira la pregunta "El docente llega a tiempo"
    Entonces la tabla de preguntas no muestra "El docente llega a tiempo"
    Y la encuesta "Docencia" guarda las preguntas activas:
      | El docente explica con claridad |

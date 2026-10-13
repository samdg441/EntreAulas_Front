# language: es
@RQ11
Característica: RQ11 - Enviar la evaluación docente
  Como estudiante
  Quiero calificar a mi docente y enviar la encuesta
  Para que mi opinión quede registrada una sola vez

  @web @exitoso
  Escenario: El estudiante abre la selección de docentes
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "estudiante"
    Cuando ella abre una nueva evaluación
    Entonces la ruta actual es "/evaluate/selection"
    Y ve el texto "Buscar Profesor"

  @web @alternativo
  Escenario: Una búsqueda sin coincidencias no lista docentes
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "estudiante"
    Cuando ella abre una nueva evaluación
    Y ella busca el docente "zzz-sin-docente"
    Entonces ve el texto "No se encontraron docentes"

  @api @alternativo
  Escenario: Sin token no se guarda una evaluación
    Cuando Ana envía una evaluación sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @api @alternativo
  Escenario: Un coordinador no guarda una evaluación
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella envía una evaluación con su sesión
    Entonces la respuesta tiene estado 403
    Y el campo "error" de la respuesta es "Solo los estudiantes pueden realizar evaluaciones"
    Y la respuesta no trae el campo "evaluationId"

  @api @alternativo
  Escenario: Un identificador con SQL no se guarda
    Cuando Ana inicia sesión por API con la cuenta "estudiante"
    Y ella envía una evaluación con un identificador inválido
    Entonces la respuesta tiene estado 400
    Y el campo "error" de la respuesta es "No se identificó el profesor, el curso o el grupo. Vuelve a seleccionarlos e inténtalo de nuevo."
    Y la respuesta no trae el campo "evaluationId"

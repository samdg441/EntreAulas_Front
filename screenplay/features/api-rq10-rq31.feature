# language: es
@api
Característica: API de estadísticas, evaluaciones, usuarios y resúmenes
  Como sistema consumidor (el front de EntreAulas)
  Quiero que RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 rechacen lo que no corresponde
  Para que la interfaz no dependa de su propia validación

  @RQ10
  Escenario: Sin token no hay estadísticas del estudiante
    Cuando Api consulta "/api/teachers/student-stats" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @con-token @RQ10
  Escenario: Un coordinador no lee las estadísticas del estudiante
    Cuando Api consulta "/api/teachers/student-stats" como coordinador
    Entonces la respuesta tiene estado 403
    Y el campo "error" de la respuesta es "Solo los estudiantes pueden acceder a estas estadísticas"

  @RQ11
  Escenario: Sin token no se guarda una evaluación
    Cuando Api envía una evaluación sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @con-token @RQ11
  Escenario: Un coordinador no guarda una evaluación
    Cuando Api envía una evaluación como coordinador
    Entonces la respuesta tiene estado 403
    Y el campo "error" de la respuesta es "Solo los estudiantes pueden realizar evaluaciones"
    Y la respuesta no trae el campo "evaluationId"

  @con-token @RQ11
  Escenario: Un identificador con SQL no se guarda
    Cuando Api envía una evaluación con un identificador inválido
    Entonces la respuesta tiene estado 400
    Y la respuesta no trae el campo "evaluationId"

  @RQ13
  Escenario: Sin token no se crea un usuario
    Cuando Api crea un usuario sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @con-token @RQ13
  Escenario: Un coordinador no crea usuarios
    Cuando Api crea un usuario como coordinador
    Entonces la respuesta tiene estado 403
    Y el campo "code" de la respuesta es "FORBIDDEN_ROLE"

  @RQ29
  Escenario: Sin token no hay resumen
    Cuando Api pide un resumen sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @con-token @RQ29
  Escenario: Sin comentarios el resumen se rechaza
    Cuando Api pide un resumen sin comentarios como coordinador
    Entonces la respuesta tiene estado 400
    Y el campo "error" de la respuesta menciona "texts"

  @RQ30
  Escenario: Sin token no hay resumen de la carrera
    Cuando Api consulta "/api/ai/summarize/by-career" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @RQ30
  Escenario: Sin token no hay resumen de la facultad
    Cuando Api consulta "/api/ai/summarize/by-faculty" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @con-token @RQ30 @RQ31
  Escenario: Un coordinador no pide el resumen de la facultad
    Cuando Api consulta "/api/ai/summarize/by-faculty" como coordinador
    Entonces la respuesta tiene estado 403
    Y el campo "code" de la respuesta es "FORBIDDEN_ROLE"

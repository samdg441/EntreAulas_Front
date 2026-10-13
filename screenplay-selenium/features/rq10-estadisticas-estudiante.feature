# language: es
@RQ10
Característica: RQ10 - Estadísticas del estudiante
  Como estudiante
  Quiero ver cuántas evaluaciones completé, cuántas me faltan y cuántas materias tengo
  Para saber cómo voy en el periodo

  @web @exitoso
  Escenario: El estudiante ve completadas, pendientes y materias
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "estudiante"
    Entonces ve el texto "Evaluaciones Completadas"
    Y ve el texto "Evaluaciones Pendientes"
    Y ve el texto "Cursos Matriculados"
    Y la estadística "Evaluaciones Completadas" muestra un número
    Y la estadística "Evaluaciones Pendientes" muestra un número
    Y la estadística "Cursos Matriculados" muestra un número

  @api @alternativo
  Escenario: Sin token no hay estadísticas del estudiante
    Cuando Ana consulta "/api/teachers/student-stats" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @api @exitoso
  Escenario: El estudiante recibe sus estadísticas
    Cuando Ana inicia sesión por API con la cuenta "estudiante"
    Y ella consulta "/api/teachers/student-stats" con su sesión
    Entonces la respuesta tiene estado 200
    Y el campo "evaluacionesCompletadas" de la respuesta es un número
    Y el campo "evaluacionesPendientes" de la respuesta es un número
    Y el campo "materiasMatriculadas" de la respuesta es un número
    Y el campo "promedioGeneral" de la respuesta es un número

  @api @alternativo
  Escenario: Un coordinador no lee las estadísticas del estudiante
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella consulta "/api/teachers/student-stats" con su sesión
    Entonces la respuesta tiene estado 403
    Y el campo "error" de la respuesta es "Solo los estudiantes pueden acceder a estas estadísticas"

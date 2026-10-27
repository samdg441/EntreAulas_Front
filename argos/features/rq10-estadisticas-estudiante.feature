# language: es
@web @RQ10 @argos @eyes
Característica: Estadísticas del estudiante
  Como estudiante
  Quiero ver cuántas evaluaciones completé, cuántas me faltan y cuántas materias tengo
  Para saber cómo voy en el periodo

  @smoke
  Escenario: El estudiante ve completadas, pendientes y materias
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces la estadística "Evaluaciones Completadas" muestra "1"
    Y la estadística "Evaluaciones Pendientes" muestra "0"
    Y la estadística "Cursos Matriculados" muestra "1"
    Y el back recibió la petición "GET" "/api/teachers/student-stats"

  Escenario: Sin evaluaciones las estadísticas quedan en cero
    Dado que Lía abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "lia.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces la estadística "Evaluaciones Completadas" muestra "0"
    Y la estadística "Evaluaciones Pendientes" muestra "0"
    Y la estadística "Cursos Matriculados" muestra "0"

# language: es
@web @RQ10
Característica: RQ10 - Estadísticas del estudiante
  Como estudiante
  Quiero ver cuántas evaluaciones completé, cuántas me faltan y cuántas materias tengo
  Para saber cómo voy en el periodo

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31

  @smoke
  Escenario: El estudiante ve completadas, pendientes y materias
    Cuando Eva inicia sesión como "estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave "Clave-Segura2026!"
    Entonces la estadística "Evaluaciones Completadas" muestra "1"
    Y la estadística "Evaluaciones Pendientes" muestra "0"
    Y la estadística "Cursos Matriculados" muestra "1"

  Escenario: Sin evaluaciones las estadísticas quedan en cero
    Cuando Lía inicia sesión como "estudiante" con "lia.estudiante@soyudemedellin.edu.co" y la clave "Clave-Segura2026!"
    Entonces la estadística "Evaluaciones Completadas" muestra "0"
    Y la estadística "Evaluaciones Pendientes" muestra "0"
    Y la estadística "Cursos Matriculados" muestra "0"

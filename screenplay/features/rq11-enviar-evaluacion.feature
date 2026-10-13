# language: es
@web @RQ11
Característica: Enviar la evaluación docente
  Como estudiante
  Quiero calificar a mi docente y enviar la encuesta
  Para que mi opinión quede registrada una sola vez

  Antecedentes:
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida

  @smoke
  Escenario: La evaluación se guarda y llega a la despedida
    Cuando ella abre una nueva evaluación
    Y ella envía la evaluación con el comentario "La explicación fue clara"
    Entonces ella ve el mensaje "Gracias por tu participación"
    Y ella está en la ruta "/evaluate/goodbye"
    Y el back recibió la petición "POST" "/api/teachers/evaluations"
    Y la última petición "POST" "/api/teachers/evaluations" envió "teacherId" = "7"
    Y la última petición "POST" "/api/teachers/evaluations" envió "courseId" = "31"
    Y la última petición "POST" "/api/teachers/evaluations" envió "comments" = "La explicación fue clara"

  Escenario: Repetir la evaluación no crea otra
    Cuando ella abre una nueva evaluación
    Y ella envía la evaluación con el comentario "repetida"
    Entonces ella ve el mensaje "Ya has evaluado a este profesor para este curso y grupo"
    Y ella está en la ruta "/evaluate/form"

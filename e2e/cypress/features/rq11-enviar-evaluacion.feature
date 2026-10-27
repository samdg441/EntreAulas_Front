# language: es
@web @RQ11
Característica: RQ11 - Enviar la evaluación docente
  Como estudiante
  Quiero calificar a mi docente y enviar la encuesta
  Para que mi opinión quede registrada una sola vez

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31
    Y Eva inicia sesión como "estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave "Clave-Segura2026!"

  @smoke
  Escenario: La evaluación se guarda y llega a la despedida
    Cuando ella abre una nueva evaluación
    Y ella envía la evaluación con el comentario "La explicación fue clara"
    Entonces ella ve el mensaje "Gracias por tu participación"
    Y la ruta actual es "/evaluate/goodbye"

  Escenario: Repetir la evaluación no crea otra
    Cuando ella abre una nueva evaluación
    Y ella envía la evaluación con el comentario "repetida"
    Entonces ella ve el mensaje "Ya has evaluado a este profesor para este curso y grupo"
    Y la ruta actual es "/evaluate/form"

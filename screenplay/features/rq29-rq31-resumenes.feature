# language: es
@web
Característica: Resúmenes de respuestas abiertas y alerta de acoso
  Como docente, coordinador o decano
  Quiero un resumen de los comentarios de las evaluaciones
  Para leer lo que dijeron los estudiantes y enterarme si hubo una mención de acoso

  @RQ29 @smoke
  Escenario: El docente resume los comentarios de sus cursos
    Dado que Pedro ingresó como docente
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "Resumen de los comentarios del docente."
    Y él ve el mensaje "claridad"
    Y él no ve el mensaje "ALERTA DE ACOSO DETECTADO"
    Y el back recibió la petición "GET" "/api/ai/summarize/by-professor"

  @RQ30
  Escenario: El coordinador resume su carrera
    Dado que Carlos ingresó como coordinador
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "Resumen de la carrera."
    Y el back recibió la petición "GET" "/api/ai/summarize/by-career"

  @RQ30
  Escenario: Un texto corto de facultad no cuenta como comentario
    Dado que Dora ingresó como decano
    Y ella abre directamente "/reports"
    Cuando ella genera el resumen de IA
    Entonces ella ve el mensaje "No se encontraron respuestas abiertas"
    Y ella ve el mensaje "No hay comentarios suficientes en la facultad."
    Y ella no ve el mensaje "ALERTA DE ACOSO DETECTADO"
    Y el back recibió la petición "GET" "/api/ai/summarize/by-faculty"

  @RQ31
  Escenario: La alerta de acoso viaja con el resumen de la carrera
    Dado que Carlos ingresó como coordinador
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "ALERTA DE ACOSO DETECTADO"
    Y él ve el mensaje "Hubo acoso en una respuesta."
    Y él ve el mensaje "Ana Perez: 1 mención(es)"

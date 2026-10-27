# language: es
@web @RQ30
Característica: RQ30 - Resúmenes de carrera y facultad
  Como coordinador o decano
  Quiero un resumen de los comentarios de mi carrera o facultad
  Para leer lo que dijeron los estudiantes

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31

  Escenario: El coordinador resume su carrera
    Cuando Carlos inicia sesión como "coordinador" con "carlos.coordinador@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "Resumen de la carrera."

  Escenario: Un texto corto de facultad no cuenta como comentario
    Cuando Dora inicia sesión como "decano" con "dora.decano@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Y ella abre directamente "/reports"
    Cuando ella genera el resumen de IA
    Entonces ella ve el mensaje "No se encontraron respuestas abiertas"
    Y ella ve el mensaje "No hay comentarios suficientes en la facultad."
    Y ella no ve el mensaje "ALERTA DE ACOSO DETECTADO"

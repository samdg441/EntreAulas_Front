# language: es
@web @RQ29
Característica: RQ29 - Resumen de los comentarios del docente
  Como docente
  Quiero un resumen de los comentarios de mis cursos
  Para leer lo que dijeron los estudiantes

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31

  @smoke
  Escenario: El docente resume los comentarios de sus cursos
    Cuando Pedro inicia sesión como "profesor" con "pedro.docente@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "Resumen de los comentarios del docente."
    Y él ve el mensaje "claridad"
    Y él no ve el mensaje "ALERTA DE ACOSO DETECTADO"

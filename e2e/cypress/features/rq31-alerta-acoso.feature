# language: es
@web @RQ31
Característica: RQ31 - Alerta de acoso en el resumen
  Como coordinador
  Quiero enterarme si un comentario menciona acoso
  Para ver la alerta junto al resumen de la carrera

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31

  Escenario: La alerta de acoso viaja con el resumen de la carrera
    Cuando Carlos inicia sesión como "coordinador" con "carlos.coordinador@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Y él abre directamente "/reports"
    Cuando él genera el resumen de IA
    Entonces él ve el mensaje "ALERTA DE ACOSO DETECTADO"
    Y él ve el mensaje "Hubo acoso en una respuesta."
    Y él ve el mensaje "Ana Perez: 1 mención(es)"

# language: es
@web @ESTEBAN @RF-NOT-34 @RF-NOT-35
Característica: Notificaciones de la ventana de evaluación
  Como estudiante
  Quiero que la campana me avise cuándo abre y cuándo cierra la evaluación docente
  Para responder a tiempo

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que hoy es "2026-11-16"

  @RF-NOT-34 @RF-NOT-35 @exitoso
  Esquema del escenario: La campana anuncia el estado de la ventana
    Dado que la ventana de evaluación "2026-2" va del "<inicio>" al "<fin>"
    Y que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Cuando ella abre la campana de notificaciones
    Entonces ella ve el mensaje "<título>"
    Y ella ve el mensaje "<detalle>"

    Ejemplos:
      | inicio     | fin        | título                     | detalle            |
      | 2026-11-01 | 2026-11-30 | Evaluación docente abierta | Evaluar ahora      |
      | 2026-11-01 | 2026-11-17 | Evaluación docente abierta | cierra mañana      |
      | 2026-12-01 | 2026-12-10 | Próxima evaluación docente | 1 de diciembre     |

  @RF-NOT-35 @alternativo
  Escenario: Marcar todas como leídas quita el pendiente de la campana
    Dado que la ventana de evaluación "2026-2" va del "2026-11-01" al "2026-11-30"
    Y que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Y la campana marca 1 aviso sin leer
    Cuando ella abre la campana de notificaciones
    Y ella marca todas las notificaciones como leídas
    Entonces la campana marca 0 avisos sin leer

  @RF-NOT-34 @error
  Escenario: Sin ventanas programadas la campana no inventa avisos
    Dado que no hay ventanas de evaluación programadas
    Y que Eva inició sesión con la cuenta "estudiante"
    Y que Eva abre la selección de la encuesta
    Cuando ella abre la campana de notificaciones
    Entonces ella ve el mensaje "No hay notificaciones"
    Y la campana marca 0 avisos sin leer

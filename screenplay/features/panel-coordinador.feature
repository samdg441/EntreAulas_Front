# language: es
@web @RQ22 @RQ24
Característica: Panel del coordinador
  Como coordinador
  Quiero ver y buscar a los docentes de mi carrera con su promedio
  Para identificar a quién acompañar

  Antecedentes:
    Dado que Carlos ingresó como coordinador

  @smoke
  Escenario: Buscar un docente por nombre
    Cuando él busca el docente "  ana  "
    Entonces él ve solamente a los docentes:
      | Ana Pérez |
    Y la última consulta a "/api/coordinador/dashboard-summary" pidió "search" = "ana"
    Y la última consulta a "/api/coordinador/dashboard-summary" pidió "page" = "1"

  Escenario: Una búsqueda sin coincidencias
    Cuando él busca el docente "zzz"
    Entonces él ve en la tabla el mensaje "No se encontraron docentes para el filtro actual."

  Escenario: Al borrar la búsqueda vuelven todos los docentes
    Cuando él busca el docente "ana"
    Y él ve solamente a los docentes:
      | Ana Pérez |
    Y él borra la búsqueda
    Entonces él ve solamente a los docentes:
      | Ana Pérez  |
      | Luis Gómez |
      | Pedro Ruiz |
      | Marta Díaz |

  Esquema del escenario: Los promedios se muestran siempre en la escala de 0 a 5
    Entonces el promedio de "<docente>" se muestra como "<se ve>"

    Ejemplos:
      | docente    | se ve     | caso                           |
      | Ana Pérez  | 4.50      | promedio normal, dos decimales |
      | Luis Gómez | 0.00      | dato corrupto (99) del back    |
      | Pedro Ruiz | Sin datos | docente sin evaluaciones       |

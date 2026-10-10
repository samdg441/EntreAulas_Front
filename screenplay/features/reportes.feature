# language: es
@web @RQ23 @RQ25
Característica: Reportes del coordinador
  Como coordinador
  Quiero consultar los reportes por periodo y exportarlos a Excel
  Para analizarlos y compartirlos con la facultad

  Antecedentes:
    Dado que Carlos ingresó como coordinador
    Y él abre directamente "/reports"

  Escenario: Al abrir, pide el periodo actual
    Entonces la última consulta a "/api/coordinador/reports-overview" pidió "period" = "2026-1"

  Escenario: Cambiar de periodo pide los datos de ese periodo
    Cuando él cambia el periodo a "2025-2"
    Entonces la última consulta a "/api/coordinador/reports-overview" pidió "period" = "2025-2"

  @smoke
  Escenario: Exportar los datos del periodo a Excel
    Cuando él exporta los datos a Excel
    Entonces él descargó el archivo "reporte-coordinador-2026-1.xlsx"

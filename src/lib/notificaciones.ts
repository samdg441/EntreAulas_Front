import type { VentanaEvaluacion } from '../api/periodos.api'
import { formatoFechaLarga, resumenEvaluacion, textoDias } from './calendario'

export type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  urgente: boolean
  accion?: { texto: string; ruta: string }
}

function accionAbierta(tipoUsuario: string | undefined): Notificacion['accion'] {
  if (tipoUsuario === 'estudiante') return { texto: 'Evaluar ahora', ruta: '/evaluate/selection' }
  if (tipoUsuario === 'admin') return undefined
  return { texto: 'Ver reportes', ruta: '/reports' }
}

/** Notificaciones reales a partir de las ventanas de evaluación del calendario. */
export function notificacionesDeEvaluacion(
  hoy: Date,
  ventanas: VentanaEvaluacion[],
  tipoUsuario?: string
): Notificacion[] {
  const resumen = resumenEvaluacion(hoy, ventanas)
  if (resumen.tipo === 'ninguna') return []

  const { ventana } = resumen
  const periodo = `${ventana.ano}-${ventana.semestre}`
  if (resumen.tipo === 'abierta') {
    return [
      {
        id: `evaluacion-abierta-${periodo}-${ventana.fechaFin}`,
        titulo: 'Evaluación docente abierta',
        mensaje: `Periodo ${periodo}: se reciben evaluaciones hasta el ${formatoFechaLarga(ventana.fechaFin)} (cierra ${textoDias(resumen.diasRestantes)}).`,
        urgente: resumen.diasRestantes <= 2,
        accion: accionAbierta(tipoUsuario),
      },
    ]
  }
  return [
    {
      id: `evaluacion-proxima-${periodo}-${ventana.fechaInicio}`,
      titulo: 'Próxima evaluación docente',
      mensaje: `Periodo ${periodo}: la evaluación abre el ${formatoFechaLarga(ventana.fechaInicio)} (${textoDias(resumen.diasParaInicio)}).`,
      urgente: false,
    },
  ]
}

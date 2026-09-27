import { beforeAll, describe, expect, it } from 'vitest'
import { decidirGeneracionQr, validarCorreoQr } from '../../features/evaluations/qr-validacion'
import { decidirAccesoRuta, getDashboardPathForUser } from '../../features/auth/dashboard-path'
import { calcularPromedio, promedioVisible, rangoFechasPeriodo } from '../../lib/calificaciones'
import { filtrarDocentes } from '../../features/dashboard-coordinator/docentes'
import {
  armarModeloExcelCoordinador,
  nombreArchivoExcelReporte,
  usuarioPuedeExportarReporte,
} from '../../utils/reporte-exportacion'

/**
 * La regresión de la pantalla, en un solo archivo.
 * Primero corre el camino que sí funciona y después cada prueba titulada
 * Regresión comprueba que ese éxito no dejó abierta la puerta de atrás.
 * RQ20 y RQ21 no forman parte de este conjunto.
 */
const resultado: Record<string, any> = {}

describe('RQ18→RQ25 — Regresión en pantalla de QR, dashboard, métricas, histórico, coordinador y exportación', () => {
  beforeAll(() => {
    const pedidoBueno = {
      to: 'ana@udemedellin.edu.co',
      subject: 'Evaluación',
      grupoIds: [12],
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    }
    resultado.qrGenerado = decidirGeneracionQr(pedidoBueno)
    resultado.qrFechasAlReves = decidirGeneracionQr({
      ...pedidoBueno,
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    })
    resultado.qrSinCorreo = validarCorreoQr({ ...pedidoBueno, to: '' })

    resultado.rutaAdmin = getDashboardPathForUser({ roles: ['estudiante', 'admin'] })
    resultado.sinSesion = decidirAccesoRuta({
      token: null,
      savedUser: null,
      user: { roles: ['admin'] },
      allowedRoles: ['admin'],
    })
    resultado.estudianteEnAdmin = decidirAccesoRuta({
      token: 'jwt',
      savedUser: '{}',
      user: { tipo_usuario: 'estudiante' },
      allowedRoles: ['admin'],
    })

    resultado.promedioValido = calcularPromedio([4, 5])
    resultado.promedioCon99 = calcularPromedio([4, 5, 99])
    resultado.nota99Visible = promedioVisible(99)

    resultado.rangoPrimero = rangoFechasPeriodo('2026-1')
    resultado.rangoMalo = rangoFechasPeriodo('2026-9')
    resultado.rangoSegundo = rangoFechasPeriodo('2026-2')

    const docentes = [
      { nombre: 'Ana Pérez', email: 'ana@t.com', promedio: 4.5 },
      { nombre: 'Luis Gómez', email: 'luis@t.com', promedio: 3 },
    ]
    resultado.docentes = docentes
    resultado.listaCompleta = filtrarDocentes(docentes, '   ')
    resultado.soloAna = filtrarDocentes(docentes, 'ANA')
    resultado.nadie = filtrarDocentes(docentes, 'zzz')

    const filas = [{ DOCENTE: 'Ana Pérez', ASIGNATURA: 'Cálculo', PROMEDIO: 4.2 }]
    resultado.libro = armarModeloExcelCoordinador(filas)
    resultado.nombreExcel = nombreArchivoExcelReporte('2026-1', true)
    resultado.puedeEstudiante = usuarioPuedeExportarReporte('student')
    resultado.puedeCoordinador = usuarioPuedeExportarReporte('coordinator')
  })

  it('RQ18: con correo, asunto, grupo y fechas en orden se puede generar', () => {
    expect(resultado.qrGenerado.ok).toBe(true)
  })

  it('Regresión RQ18: las mismas fechas al revés se rechazan', () => {
    expect(resultado.qrFechasAlReves.ok).toBe(false)
    expect(resultado.qrFechasAlReves.error).toBe('La fecha de inicio no puede ser posterior a la de fin.')
  })

  it('Regresión RQ18: quitar el correo vuelve a invalidar el envío', () => {
    expect(resultado.qrSinCorreo.ok).toBe(false)
    expect(resultado.qrSinCorreo.error).toBe('Correo de destino inválido.')
  })

  it('RQ19: admin y estudiante abre el panel de admin', () => {
    expect(resultado.rutaAdmin).toBe('/dashboard-admin')
  })

  it('Regresión RQ19: sin token, aunque el usuario diga admin, manda al login', () => {
    expect(resultado.sinSesion).toBe('login')
  })

  it('Regresión RQ19: un estudiante con sesión no entra a la página de admin', () => {
    expect(resultado.estudianteEnAdmin).toBe('forbidden')
  })

  it('RQ22: 4 y 5 se ven como 4.5', () => {
    expect(resultado.promedioValido).toBe(4.5)
  })

  it('Regresión RQ22: agregar 99 deja el mismo 4.5', () => {
    expect(resultado.promedioCon99).toBe(resultado.promedioValido)
  })

  it('Regresión RQ22: en la tarjeta el 99 se pinta como 0', () => {
    expect(resultado.nota99Visible).toBe(0)
  })

  it('RQ23: 2026-1 sigue siendo enero a junio', () => {
    expect(resultado.rangoPrimero).toEqual({ start: '2026-01-01', end: '2026-06-30' })
  })

  it('Regresión RQ23: 2026-9 no arma fechas y no copia las de 2026-1', () => {
    expect(resultado.rangoMalo).toBeNull()
    expect(resultado.rangoMalo).not.toEqual(resultado.rangoPrimero)
  })

  it('Regresión RQ23: el segundo semestre no se come el rango del primero', () => {
    expect(resultado.rangoSegundo).toEqual({ start: '2026-07-01', end: '2026-12-31' })
    expect(resultado.rangoSegundo).not.toEqual(resultado.rangoPrimero)
  })

  it('RQ24: sin texto se ven los dos docentes', () => {
    expect(resultado.listaCompleta).toEqual(resultado.docentes)
  })

  it('Regresión RQ24: buscar a Ana no modifica a Luis en la lista de origen', () => {
    expect(resultado.soloAna).toHaveLength(1)
    expect(resultado.soloAna[0].nombre).toBe('Ana Pérez')
    expect(resultado.docentes).toHaveLength(2)
    expect(resultado.docentes[1].nombre).toBe('Luis Gómez')
  })

  it('Regresión RQ24: un texto sin coincidencias deja la lista de origen intacta', () => {
    expect(resultado.nadie).toEqual([])
    expect(resultado.docentes).toHaveLength(2)
  })

  it('RQ25: el libro del coordinador trae a Ana y el archivo lleva el periodo', () => {
    expect(resultado.puedeCoordinador).toBe(true)
    expect(resultado.nombreExcel).toBe('reporte-coordinador-2026-1.xlsx')
    expect(resultado.libro.dataRows[0][0]).toBe('Ana Pérez')
  })

  it('Regresión RQ25: el estudiante sigue sin permiso aunque el libro ya exista', () => {
    expect(resultado.puedeEstudiante).toBe(false)
    expect(resultado.libro.dataRows[0][0]).toBe('Ana Pérez')
  })
})

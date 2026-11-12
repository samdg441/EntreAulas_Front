import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { getVentanasEvaluacion, type VentanaEvaluacion } from '../api/periodos.api'
import { usePreferencias } from '../preferencias/PreferenciasContext'
import {
  celdasDelMes,
  diasHasta,
  estadoDelDia,
  formatoFechaLarga,
  inicioDelDia,
  mesInicial,
  mismoDia,
  nombresDiasSemana,
  parseFecha,
  type EstadoDia,
} from '../lib/calendario'
import type { Clave } from '../i18n/diccionario'

interface AgendaProps {
  /** Para pruebas: reemplaza la consulta al servidor. */
  cargar?: () => Promise<VentanaEvaluacion[]>
  /** Para pruebas: fecha de «hoy» fija. */
  hoy?: Date
  className?: string
}

type Situacion = { tipo: 'abierta' | 'proxima' | 'cerrada'; dias: number }

export function situacionDeVentana(v: VentanaEvaluacion, hoy: Date): Situacion {
  const dia = inicioDelDia(hoy)
  const inicio = parseFecha(v.fechaInicio)
  const fin = parseFecha(v.fechaFin)
  if (dia < inicio) return { tipo: 'proxima', dias: diasHasta(dia, inicio) }
  if (dia > fin) return { tipo: 'cerrada', dias: diasHasta(fin, dia) }
  return { tipo: 'abierta', dias: diasHasta(dia, fin) }
}

const CLAVE_DIA: Record<EstadoDia, Clave> = {
  inicio: 'cal.dia.inicio',
  fin: 'cal.dia.fin',
  abierta: 'cal.dia.abierta',
  normal: 'cal.dia.normal',
}

function claseDia(estado: EstadoDia, borde: { izq: boolean; der: boolean }): string {
  if (estado === 'normal') return 'rounded-lg text-gray-700 hover:bg-gray-100'
  const redondeo = `${borde.izq ? 'rounded-l-full' : ''} ${borde.der ? 'rounded-r-full' : ''}`
  if (estado === 'abierta') return `${redondeo} bg-red-100 text-red-800`
  return `${redondeo} bg-red-600 font-semibold text-white`
}

/** Calendario del mes con la ventana de evaluación como una franja continua, y la lista de fechas próximas. */
export default function AgendaEvaluaciones({ cargar = getVentanasEvaluacion, hoy: hoyProp, className = '' }: Readonly<AgendaProps>) {
  const { t, locale } = usePreferencias()
  const reducir = useReducedMotion()
  const hoy = useMemo(() => hoyProp ?? new Date(), [hoyProp])
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [ventanas, setVentanas] = useState<VentanaEvaluacion[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const tituloId = useId()

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    cargar()
      .then((datos) => {
        if (!activo) return
        setVentanas(datos)
        setMes(mesInicial(hoy, datos))
        setEstado('listo')
      })
      .catch(() => activo && setEstado('error'))
    return () => {
      activo = false
    }
  }, [cargar, hoy])

  const direccion = useRef(1)
  const cambiarMes = (delta: number) => {
    direccion.current = delta
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }
  const nombreMes = mes.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const semanas = useMemo(() => {
    const celdas = celdasDelMes(mes)
    return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7))
  }, [mes])
  const dias = nombresDiasSemana(locale)
  const diasLargos = nombresDiasSemana(locale, 'long')

  const cuando = (n: number) => (n === 0 ? t('cal.cuando.hoy') : n === 1 ? t('cal.cuando.manana') : t('cal.cuando.dias', { n }))

  const proximas = useMemo(
    () =>
      [...ventanas]
        .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
        .map((v) => ({ v, s: situacionDeVentana(v, hoy) }))
        .filter(({ s }) => s.tipo !== 'cerrada')
        .slice(0, 3),
    [ventanas, hoy]
  )

  return (
    <section aria-labelledby={tituloId} className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-red-600" aria-hidden="true" />
        <h2 id={tituloId} className="text-subtitle font-semibold text-gray-900">
          {t('cal.titulo')}
        </h2>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <p className="flex-1 text-body font-semibold text-gray-900" aria-live="polite">
          {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
        </p>
        <button
          type="button"
          onClick={() => setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1))}
          className="rounded-lg px-3 py-2 text-small font-medium text-gray-700 hover:bg-gray-100"
        >
          {t('cal.hoy')}
        </button>
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          aria-label={t('cal.mesAnterior')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          aria-label={t('cal.mesSiguiente')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${mes.getFullYear()}-${mes.getMonth()}`}
        className="mt-2"
        role="grid"
        aria-label={t('cal.dias', { mes: nombreMes })}
        initial={reducir ? false : { opacity: 0, x: direccion.current * 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reducir ? { opacity: 1, x: 0 } : { opacity: 0, x: direccion.current * -18 }}
        transition={{ duration: reducir ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div role="row" className="grid grid-cols-7">
          {dias.map((d, i) => (
            <div key={d} role="columnheader" className="py-1 text-center text-small font-medium text-gray-500">
              <abbr title={diasLargos[i]} className="no-underline">
                {d.replace('.', '').slice(0, 3)}
              </abbr>
            </div>
          ))}
        </div>
        {semanas.map((semana, w) => (
          <div key={`semana-${w}`} role="row" className="mt-1 grid grid-cols-7">
            {semana.map((dia, columna) => {
              if (!dia) return <div key={`vacio-${w}-${columna}`} role="gridcell" aria-hidden="true" />
              const situacion = estadoDelDia(dia, ventanas)
              const esHoy = mismoDia(dia, hoy)
              const borde = {
                izq: situacion === 'inicio' || columna === 0 || estadoDelDia(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() - 1), ventanas) === 'normal',
                der: situacion === 'fin' || columna === 6 || estadoDelDia(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1), ventanas) === 'normal',
              }
              const fecha = dia.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
              return (
                <div
                  key={dia.toISOString()}
                  role="gridcell"
                  aria-current={esHoy ? 'date' : undefined}
                  aria-label={`${fecha}${esHoy ? `, ${t('cal.leyenda.hoy').toLowerCase()}` : ''}, ${t(CLAVE_DIA[situacion])}`}
                  className={`flex h-11 items-center justify-center text-small lg:h-14 lg:text-body ${claseDia(situacion, borde)} ${
                    esHoy ? 'ring-2 ring-gray-900 ring-offset-1 ring-offset-white' : ''
                  }`}
                >
                  {dia.getDate()}
                </div>
              )
            })}
          </div>
        ))}
      </motion.div>
      </AnimatePresence>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-small text-gray-700">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600" aria-hidden="true" />
          {t('cal.leyenda.limites')}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-100 ring-1 ring-red-300" aria-hidden="true" />
          {t('cal.leyenda.abierta')}
        </li>
      </ul>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="text-body font-semibold text-gray-900">{t('cal.proximasFechas')}</h3>
        {estado === 'cargando' && <p className="mt-2 text-small text-gray-600">{t('cal.cargando')}</p>}
        {estado === 'error' && (
          <p role="status" className="mt-2 text-small text-red-700">
            {t('cal.error')}
          </p>
        )}
        {estado === 'listo' && proximas.length === 0 && (
          <div className="mt-2">
            <p className="text-small font-medium text-gray-900">{t('cal.ninguna')}</p>
            <p className="text-small text-gray-600">{t('cal.ningunaAyuda')}</p>
          </div>
        )}
        {estado === 'listo' && proximas.length > 0 && (
          <ul className="mt-2 space-y-3">
            {proximas.map(({ v, s }) => (
              <li key={v.periodoId} className="rounded-xl bg-gray-50 p-3">
                <p className="text-small font-semibold text-gray-900">{t('cal.periodo', { periodo: `${v.ano}-${v.semestre}` })}</p>
                <p className="text-small text-gray-700">
                  {t('cal.rango', { inicio: formatoFechaLarga(v.fechaInicio, locale), fin: formatoFechaLarga(v.fechaFin, locale) })}
                </p>
                <p className={`mt-1 text-small font-medium ${s.tipo === 'abierta' ? 'text-red-700' : 'text-gray-700'}`}>
                  {s.tipo === 'abierta' ? `${t('cal.abierta')} · ${t('cal.cierra', { cuando: cuando(s.dias) })}` : `${t('cal.proxima')} · ${t('cal.abre', { cuando: cuando(s.dias) })}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

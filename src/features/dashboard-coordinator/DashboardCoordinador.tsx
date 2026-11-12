import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Header from '../../components/Header'
import HelpTooltip from '../../components/HelpTooltip'
import OnboardingBanner from '../../components/OnboardingBanner'
import AgendaEvaluaciones from '../../components/AgendaEvaluaciones'
import { fetchCoordinatorDashboardSummary, CoordinatorTeacherSummary } from '../../api/coordinador.api'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { promedioVisible } from '../../lib/calificaciones'
import { User } from '../../types'
import { statsVaciasCoordinador } from './docentes'
import { UMBRAL_RIESGO, estadoDelDocente, porcentajeEscala } from './gestion-profesores'

interface DashboardCoordinadorProps {
  user: User
}

function claseDelEstado(estado: ReturnType<typeof estadoDelDocente>): string {
  if (estado === 'riesgo') return 'bg-red-100 text-red-800'
  if (estado === 'sinDatos') return 'bg-gray-100 text-gray-700'
  return 'bg-green-100 text-green-800'
}

function Indicador({
  etiqueta,
  ayuda,
  valor,
  detalle,
  cargando,
  tono = 'neutro',
  children,
}: Readonly<{
  etiqueta: string
  ayuda: string
  valor: React.ReactNode
  detalle: string
  cargando: boolean
  tono?: 'neutro' | 'alerta'
  children?: React.ReactNode
}>) {
  return (
    <div className="marca-rojo rounded-2xl border border-gray-200 bg-white p-5">
      <dt className="flex items-center gap-1.5 text-small font-medium text-gray-700">
        {etiqueta}
        <HelpTooltip texto={ayuda} etiqueta={etiqueta} />
      </dt>
      <dd className="mt-2">
        {cargando ? (
          <span className="block h-9 w-16 animate-pulse rounded bg-gray-200" aria-hidden="true" />
        ) : (
          <span className={`text-display font-semibold ${tono === 'alerta' ? 'text-red-600' : 'text-gray-900'}`}>
            {valor}
          </span>
        )}
        <span className="mt-1 block text-small text-gray-600">{detalle}</span>
        {children}
      </dd>
    </div>
  )
}

/** Barra de 1.0 a 5.0 con una marca en el umbral de riesgo (4.0). */
function EscalaPromedio({ valor, etiqueta, umbral }: Readonly<{ valor: number; etiqueta: string; umbral: string }>) {
  const relleno = porcentajeEscala(valor)
  const marca = porcentajeEscala(UMBRAL_RIESGO)
  return (
    <div className="mt-3">
      <meter className="sr-only" min={1} max={5} value={valor || 1} aria-label={etiqueta}>
        {`${valor.toFixed(1)} / 5`}
      </meter>
      <div aria-hidden="true" className="relative h-2 rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${valor >= UMBRAL_RIESGO ? 'bg-green-600' : 'bg-red-600'}`}
          style={{ width: `${relleno}%` }}
        />
        <span className="absolute -top-1 h-4 w-0.5 bg-gray-900" style={{ left: `${marca}%` }} aria-hidden="true" />
      </div>
      <p className="mt-1 text-right text-small text-gray-600" style={{ paddingRight: `${100 - marca}%` }}>
        {umbral}
      </p>
    </div>
  )
}

export default function DashboardCoordinador({ user }: Readonly<DashboardCoordinadorProps>) {
  const { t, locale } = usePreferencias()
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [teachers, setTeachers] = useState<CoordinatorTeacherSummary[]>([])
  const [stats, setStats] = useState(statsVaciasCoordinador())
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 0 })

  // Solo se reinicia la página si el texto realmente cambió; si no, un clic en "Siguiente" antes de 350 ms se deshacía.
  useEffect(() => {
    const nueva = searchInput.trim()
    if (nueva === searchTerm) return
    const id = window.setTimeout(() => {
      setPage(1)
      setSearchTerm(nueva)
    }, 350)
    return () => window.clearTimeout(id)
  }, [searchInput, searchTerm])

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        setLoadingStats(true)
        setError(false)
        const respuesta = await fetchCoordinatorDashboardSummary({ page, pageSize: pagination.pageSize, search: searchTerm })
        if (!activo) return
        setStats(respuesta.stats ?? statsVaciasCoordinador())
        setTeachers(respuesta.teachers || [])
        setPagination(respuesta.pagination || { page: 1, pageSize: 8, total: 0, totalPages: 0 })
      } catch (e) {
        console.error('Error cargando resumen del coordinador:', e)
        if (!activo) return
        setError(true)
        setTeachers([])
        setStats(statsVaciasCoordinador())
      } finally {
        if (activo) setLoadingStats(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [page, pagination.pageSize, searchTerm])

  const hora = new Date().getHours()
  let claveSaludo: 'coord.saludo.manana' | 'coord.saludo.tarde' | 'coord.saludo.noche' = 'coord.saludo.noche'
  if (hora < 12) claveSaludo = 'coord.saludo.manana'
  else if (hora < 18) claveSaludo = 'coord.saludo.tarde'
  const saludo = t(claveSaludo)
  const primerNombre = (user?.name || '').split(' ')[0] || t('rol.coordinador')

  const promedio = promedioVisible(stats.promedioEvaluaciones)
  const carreraEnRiesgo = promedio > 0 && promedio < UMBRAL_RIESGO
  const desde = teachers.length === 0 || pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const hasta = teachers.length === 0 || pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + teachers.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} subtitle={t('coord.subtitulo')} />

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        <h1 className="text-title font-semibold text-white dark:text-gray-900">
          {t('coord.saludo', { saludo, nombre: primerNombre })}
        </h1>

        <OnboardingBanner
          rol="coordinador"
          titulo={t('coord.guia.titulo')}
          pasos={[t('coord.guia.p1'), t('coord.guia.p2'), t('coord.guia.p3')]}
        />

        {/* Métricas apiladas a la izquierda y calendario a la derecha; la tabla ocupa todo el ancho debajo. */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
            <section aria-label={t('coord.metricas')} className="min-w-0">
              <dl className="grid grid-cols-1 gap-3">
                <Indicador
                  etiqueta={t('coord.m.profesores')}
                  ayuda={t('coord.m.profesoresAyuda')}
                  valor={stats.totalProfesores}
                  detalle={t('coord.m.profesoresDesc')}
                  cargando={loadingStats}
                />
                <Indicador
                  etiqueta={t('coord.m.cursos')}
                  ayuda={t('coord.m.cursosAyuda')}
                  valor={stats.totalCursos}
                  detalle={t('coord.m.cursosDesc')}
                  cargando={loadingStats}
                />
                <Indicador
                  etiqueta={t('coord.m.promedio')}
                  ayuda={t('coord.m.promedioAyuda')}
                  valor={promedio > 0 ? promedio.toFixed(2) : '—'}
                  detalle={carreraEnRiesgo ? t('coord.m.promedioRiesgo') : t('coord.m.promedioDesc')}
                  cargando={loadingStats}
                  tono={carreraEnRiesgo ? 'alerta' : 'neutro'}
                >
                  {!loadingStats && promedio > 0 && (
                    <EscalaPromedio valor={promedio} etiqueta={t('coord.m.promedio')} umbral={t('coord.m.umbral')} />
                  )}
                </Indicador>
                <Indicador
                  etiqueta={t('coord.m.riesgo')}
                  ayuda={t('coord.m.riesgoAyuda')}
                  valor={stats.profesoresEnRiesgo}
                  detalle={t('coord.m.riesgoDesc')}
                  cargando={loadingStats}
                  tono={stats.profesoresEnRiesgo > 0 ? 'alerta' : 'neutro'}
                />
              </dl>
            </section>
          <AgendaEvaluaciones key={locale} />
        </div>

        <section aria-labelledby="resumen-docentes" className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 id="resumen-docentes" className="text-subtitle font-semibold text-gray-900">
                {t('coord.t.titulo')}
              </h2>
              <p className="text-small text-gray-600">{t('coord.t.descripcion')}</p>

              <div className="relative mt-4">
                <label htmlFor="buscar-docente" className="sr-only">
                  {t('coord.t.buscar')}
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                  id="buscar-docente"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('coord.t.buscar')}
                  className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-body text-gray-900 placeholder:text-gray-500"
                />
              </div>

              {error && (
                <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-small text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('com.error')}
                </p>
              )}

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-small">
                  <caption className="sr-only">{t('coord.t.titulo')}</caption>
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('coord.t.docente')}</th>
                      <th scope="col" className="hidden px-4 py-3 font-semibold 2xl:table-cell">{t('coord.t.correo')}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('coord.t.evaluaciones')}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('coord.t.promedio')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStats && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-600" colSpan={4}>
                          {t('com.cargando')}
                        </td>
                      </tr>
                    )}
                    {!loadingStats && teachers.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-600" colSpan={4}>
                          {t('coord.t.vacia')}
                        </td>
                      </tr>
                    )}
                    {!loadingStats &&
                      teachers.map((d) => {
                        const estado = estadoDelDocente(d)
                        return (
                          <tr key={d.profesorId} className={`border-t border-gray-200 ${estado === 'riesgo' ? 'bg-red-50' : ''}`}>
                            <td className="min-w-[11rem] px-4 py-3 font-medium text-gray-900">
                              <Link
                                to={`/profesores/gestionar?profesor=${d.profesorId}`}
                                className="underline decoration-gray-300 underline-offset-4 hover:decoration-red-600"
                                aria-label={`${t('coord.t.verDetalle')}: ${d.nombre}`}
                              >
                                {d.nombre}
                              </Link>
                            </td>
                            <td className="hidden max-w-[14rem] truncate px-4 py-3 text-gray-700 2xl:table-cell" title={d.email}>{d.email || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">{d.totalEvaluaciones}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-semibold ${claseDelEstado(estado)}`}
                              >
                                {estado === 'sinDatos' ? t('coord.t.sinDatos') : promedioVisible(d.promedio).toFixed(2)}
                                {estado === 'riesgo' && <span>· {t('coord.t.enRiesgo')}</span>}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-small text-gray-600">{t('com.mostrando', { desde, hasta, total: pagination.total })}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loadingStats || pagination.page <= 1}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-small font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {t('com.anterior')}
                  </button>
                  <span className="text-small text-gray-700">
                    {t('com.pagina', { pagina: pagination.totalPages === 0 ? 0 : pagination.page, total: pagination.totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                    disabled={loadingStats || pagination.page >= pagination.totalPages}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-small font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t('com.siguiente')}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>
      </main>
    </div>
  )
}

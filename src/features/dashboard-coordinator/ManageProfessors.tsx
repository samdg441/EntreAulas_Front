import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Search } from 'lucide-react'
import { fetchCoordinatorDashboardSummary, fetchCoordinatorProfessorStats } from '../../api/coordinador.api'
import Header from '../../components/Header'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import type { Clave } from '../../i18n/diccionario'
import {
  UMBRAL_RIESGO,
  contarPorEstado,
  estadoDelDocente,
  filtrarYOrdenar,
  docentesSinRepetir,
  iniciales,
  porcentajeEscala,
  type DocenteResumen,
  type FiltroDocentes,
  type OrdenDocentes,
} from './gestion-profesores'

const PERIODOS = ['2026-1', '2025-2', '2025-1', '2024-2']
const FILTROS: { valor: FiltroDocentes; clave: Clave }[] = [
  { valor: 'todos', clave: 'gp.f.todos' },
  { valor: 'riesgo', clave: 'gp.f.riesgo' },
  { valor: 'ok', clave: 'gp.f.ok' },
  { valor: 'sinDatos', clave: 'gp.f.sinDatos' },
]
const ORDENES: { valor: OrdenDocentes; clave: Clave }[] = [
  { valor: 'nombre', clave: 'gp.o.nombre' },
  { valor: 'promedioAsc', clave: 'gp.o.promedioAsc' },
  { valor: 'promedioDesc', clave: 'gp.o.promedioDesc' },
  { valor: 'evaluaciones', clave: 'gp.o.evaluaciones' },
]

/** Barra horizontal de 1.0 a 5.0 con la marca del umbral de riesgo. */
function BarraPromedio({ valor, etiqueta }: Readonly<{ valor: number; etiqueta: string }>) {
  return (
    <div
      role="meter"
      aria-label={etiqueta}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={valor || 1}
      aria-valuetext={`${valor.toFixed(2)} / 5`}
      className="relative h-2 rounded-full bg-gray-200"
    >
      <div className={`h-full rounded-full ${valor < UMBRAL_RIESGO ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${porcentajeEscala(valor)}%` }} />
      <span className="absolute -top-0.5 h-3 w-0.5 bg-gray-900" style={{ left: `${porcentajeEscala(UMBRAL_RIESGO)}%` }} aria-hidden="true" />
    </div>
  )
}

function Dato({ etiqueta, valor }: Readonly<{ etiqueta: string; valor: React.ReactNode }>) {
  return (
    <div className="bg-white p-4">
      <dt className="text-small text-gray-600">{etiqueta}</dt>
      <dd className="mt-1 text-title font-semibold text-gray-900">{valor}</dd>
    </div>
  )
}

export default function ManageProfessors() {
  const { t } = usePreferencias()
  const [params, setParams] = useSearchParams()

  const [docentes, setDocentes] = useState<DocenteResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorLista, setErrorLista] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroDocentes>('todos')
  const [orden, setOrden] = useState<OrdenDocentes>('nombre')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(params.get('profesor'))
  const [periodo, setPeriodo] = useState(params.get('period') || PERIODOS[0])
  const [stats, setStats] = useState<any | null>(null)
  const [cargandoStats, setCargandoStats] = useState(false)
  const [errorStats, setErrorStats] = useState(false)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      setErrorLista(false)
      try {
        const primera = await fetchCoordinatorDashboardSummary({ page: 1, pageSize: 50 })
        if (!activo) return
        const totalPages = Math.min(Math.max(primera.pagination?.totalPages ?? 1, 1), 10)
        const resto =
          totalPages > 1
            ? await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, i) =>
                  fetchCoordinatorDashboardSummary({ page: i + 2, pageSize: 50 })
                )
              )
            : []
        if (!activo) return
        setDocentes(
          docentesSinRepetir(
            [primera, ...resto].map((p) =>
              (p.teachers || []).map((t) => ({
                id: t.profesorId,
                nombre: t.nombre || '—',
                email: t.email || '',
                promedio: Number(t.promedio) || 0,
                totalEvaluaciones: Number(t.totalEvaluaciones) || 0,
              }))
            )
          )
        )
      } catch (e) {
        console.error('Error cargando los docentes de la carrera:', e)
        if (!activo) return
        setErrorLista(true)
        setDocentes([])
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [])

  const seleccionado = useMemo(() => docentes.find((d) => String(d.id) === seleccionadoId) ?? null, [docentes, seleccionadoId])
  const cuentas = useMemo(() => contarPorEstado(docentes), [docentes])
  const visibles = useMemo(() => filtrarYOrdenar(docentes, { busqueda, filtro, orden }), [docentes, busqueda, filtro, orden])

  useEffect(() => {
    if (!seleccionado) return
    let activo = true
    setCargandoStats(true)
    setErrorStats(false)
    setStats(null)
    fetchCoordinatorProfessorStats(seleccionado.id, periodo)
      .then((datos) => activo && setStats(datos))
      .catch(() => activo && setErrorStats(true))
      .finally(() => activo && setCargandoStats(false))
    return () => {
      activo = false
    }
  }, [seleccionado, periodo])

  const elegir = (id: string | null) => {
    setSeleccionadoId(id)
    const siguiente = new URLSearchParams(params)
    if (id) siguiente.set('profesor', id)
    else siguiente.delete('profesor')
    setParams(siguiente, { replace: true })
  }

  const resumen = stats?.summary
  const categorias: Array<{ categoriaId: string | number; nombre: string; promedio: number }> = stats?.categories ?? []
  const cursos: Array<{ cursoId: number; codigo?: string; nombre: string; promedio: number; totalEvaluaciones: number }> = stats?.courses ?? []
  const nDocentes = visibles.length === 1 ? t('gp.encontrado') : t('gp.encontrados', { n: visibles.length })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('gp.titulo')} subtitle={t('gp.subtitulo')} />

      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <h1 className="sr-only">{t('gp.titulo')}</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          {/* Lista: en móvil se oculta cuando hay un docente elegido. */}
          <section aria-labelledby="titulo-lista" className={`${seleccionado ? 'hidden lg:block' : ''} min-w-0 rounded-2xl border border-red-100 bg-white shadow-[0_10px_28px_rgb(227_6_19/0.08)]`}>
            <div className="space-y-3 border-b border-gray-200 p-4">
              <h2 id="titulo-lista" className="text-subtitle font-semibold text-gray-900">
                {t('gp.lista')}
              </h2>
              <div className="relative">
                <label htmlFor="gp-buscar" className="sr-only">{t('gp.buscar')}</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                  id="gp-buscar"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={t('gp.buscar')}
                  className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-body text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div role="radiogroup" aria-label={t('gp.filtro')} className="flex flex-wrap gap-1.5">
                {FILTROS.map(({ valor, clave }) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={filtro === valor}
                    onClick={() => setFiltro(valor)}
                    className={`marca-rojo min-h-[36px] rounded-full border px-3 text-small font-medium ${
                      filtro === valor ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300 bg-white text-gray-800'
                    }`}
                  >
                    {t(clave)} <span>({cuentas[valor]})</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-small text-gray-600" aria-live="polite">{nDocentes}</p>
                <div className="flex items-center gap-2">
                  <label htmlFor="gp-orden" className="text-small text-gray-700">{t('gp.orden')}</label>
                  <select
                    id="gp-orden"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value as OrdenDocentes)}
                    className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-2 text-small text-gray-900"
                  >
                    {ORDENES.map(({ valor, clave }) => (
                      <option key={valor} value={valor}>{t(clave)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {cargando && <p className="p-6 text-center text-small text-gray-600">{t('gp.cargando')}</p>}
            {!cargando && errorLista && (
              <p role="alert" className="m-4 rounded-xl bg-red-50 p-3 text-small text-red-800">{t('com.error')}</p>
            )}
            {!cargando && !errorLista && visibles.length === 0 && (
              <div className="p-8 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
                <p className="mt-2 text-body font-medium text-gray-900">{t('gp.sinResultados')}</p>
                <p className="text-small text-gray-600">{t('gp.sinResultadosAyuda')}</p>
              </div>
            )}
            {!cargando && visibles.length > 0 && (
              <ul className="max-h-[calc(100vh-22rem)] min-h-[12rem] divide-y divide-gray-200 overflow-y-auto">
                {visibles.map((d) => {
                  const estado = estadoDelDocente(d)
                  const activo = seleccionado?.id === d.id
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => elegir(String(d.id))}
                        aria-current={activo ? 'true' : undefined}
                        className={`marca-rojo flex w-full items-center gap-3 border border-transparent px-4 py-3 text-left ${activo ? 'bg-red-50' : ''}`}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-700 text-small font-semibold text-white"
                          aria-hidden="true"
                        >
                          {iniciales(d.nombre)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-medium text-gray-900">{d.nombre}</span>
                          <span className="block truncate text-small text-gray-600">{d.email || t('com.sinCorreo')}</span>
                          {estado !== 'sinDatos' && <span className="mt-1.5 block"><BarraPromedio valor={d.promedio} etiqueta={d.nombre} /></span>}
                        </span>
                        <span className="shrink-0 text-right">
                          {estado === 'sinDatos' ? (
                            <span className="text-small text-gray-600">{t('coord.t.sinDatos')}</span>
                          ) : (
                            <span className={`block text-subtitle font-semibold ${estado === 'riesgo' ? 'text-red-600' : 'text-gray-900'}`}>
                              {d.promedio.toFixed(2)}
                            </span>
                          )}
                          <span className="block text-small text-gray-600">{t('gp.evaluacionesN', { n: d.totalEvaluaciones })}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Detalle */}
          <section aria-labelledby="titulo-detalle" className={`${seleccionado ? '' : 'hidden lg:block'} min-w-0 rounded-2xl border border-red-100 bg-white p-5 shadow-[0_14px_36px_rgb(227_6_19/0.10)] lg:sticky lg:top-24`}>
            {!seleccionado ? (
              <div className="py-12 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <h2 id="titulo-detalle" className="mt-3 text-subtitle font-semibold text-gray-900">{t('gp.seleccionar')}</h2>
                <p className="mx-auto max-w-sm text-small text-gray-600">{t('gp.seleccionarAyuda')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => elegir(null)}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-small font-medium text-gray-700 hover:bg-gray-100 lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {t('gp.volverLista')}
                </button>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-700 text-subtitle font-semibold text-white ring-2 ring-red-600 ring-offset-2 ring-offset-white" aria-hidden="true">
                      {iniciales(seleccionado.nombre)}
                    </span>
                    <div className="min-w-0">
                      <h2 id="titulo-detalle" className="truncate text-subtitle font-semibold text-gray-900">{seleccionado.nombre}</h2>
                      <p className="truncate text-small text-gray-600">{seleccionado.email || t('com.sinCorreo')}</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gp-periodo" className="block text-small text-gray-700">{t('gp.periodo')}</label>
                    <select
                      id="gp-periodo"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-body text-gray-900"
                    >
                      {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {cargandoStats && <p className="py-8 text-center text-small text-gray-600">{t('gp.cargandoStats')}</p>}
                {!cargandoStats && errorStats && (
                  <p role="alert" className="rounded-xl bg-red-50 p-3 text-small text-red-800">{t('gp.errorStats')}</p>
                )}

                {!cargandoStats && stats && (
                  <>
                    {estadoDelDocente({ promedio: Number(resumen?.promedio) || 0, totalEvaluaciones: Number(resumen?.totalEvaluaciones) || 0 }) === 'riesgo' && (
                      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-small font-medium text-red-800">{t('gp.riesgoAviso')}</p>
                    )}

                    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-red-100 bg-red-100 shadow-[0_8px_20px_rgb(227_6_19/0.08)] sm:grid-cols-4">
                      <Dato etiqueta={t('gp.evaluaciones')} valor={resumen?.totalEvaluaciones || 0} />
                      <Dato etiqueta={t('gp.promedio')} valor={`${resumen?.promedio || 0}/5`} />
                      <Dato etiqueta={t('gp.evaluadores')} valor={resumen?.estudiantesEvaluadores || 0} />
                      <Dato etiqueta={t('gp.cursosEvaluados')} valor={resumen?.totalCursos || 0} />
                    </dl>

                    <div>
                      <h3 className="text-body font-semibold text-gray-900">{t('gp.porCategoria')}</h3>
                      {categorias.length === 0 ? (
                        <p className="mt-2 text-small text-gray-600">{t('gp.sinCategorias')}</p>
                      ) : (
                        <ul className="mt-2 space-y-3">
                          {categorias.map((c) => (
                            <li key={c.categoriaId}>
                              <div className="flex items-baseline justify-between gap-3 text-small">
                                <span className="text-gray-800">{c.nombre}</span>
                                <span className="font-semibold text-gray-900">{Number(c.promedio || 0).toFixed(2)}</span>
                              </div>
                              <div className="mt-1"><BarraPromedio valor={Number(c.promedio) || 0} etiqueta={c.nombre} /></div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h3 className="text-body font-semibold text-gray-900">{t('gp.porCurso')}</h3>
                      {cursos.length === 0 ? (
                        <p className="mt-2 text-small text-gray-600">{t('gp.sinCursos')}</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-red-50 rounded-xl border border-red-100">
                          {cursos.map((c) => (
                            <li key={c.cursoId} className="marca-rojo flex items-center justify-between gap-3 border border-transparent px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-body font-medium text-gray-900">{c.codigo ? `${c.codigo} · ` : ''}{c.nombre}</p>
                                <p className="text-small text-gray-600">{t('gp.evaluacionesN', { n: c.totalEvaluaciones })}</p>
                              </div>
                              <span className={`text-subtitle font-semibold ${Number(c.promedio) < UMBRAL_RIESGO ? 'text-red-600' : 'text-gray-900'}`}>
                                {Number(c.promedio || 0).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

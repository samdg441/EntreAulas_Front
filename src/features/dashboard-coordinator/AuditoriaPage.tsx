import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileSearch, QrCode, CalendarClock, BarChart3, UserSearch, Search, type LucideIcon } from 'lucide-react'
import Header from '../../components/Header'
import { ACCIONES, fetchAuditoria, type AccionAuditoria, type RespuestaAuditoria } from '../../api/auditoria.api'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { existeClave, type Clave } from '../../i18n/diccionario'
import { eventosACsv, rangoFechasValido } from './auditoria'

const ICONO_ACCION: Record<AccionAuditoria, LucideIcon> = {
  programar_encuesta: CalendarClock,
  generar_qr: QrCode,
  consultar_reportes: BarChart3,
  consultar_docente: UserSearch,
}

const claveAccion = (accion: string) => `au.a.${accion}` as Clave
const esAccionConocida = (accion: string): accion is AccionAuditoria => (ACCIONES as string[]).includes(accion)

const TAM_PAGINA = 10

export default function AuditoriaPage() {
  const { t, locale } = usePreferencias()
  const [accion, setAccion] = useState<AccionAuditoria | 'todas'>('todas')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [datos, setDatos] = useState<RespuestaAuditoria | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const rangoOk = rangoFechasValido(desde, hasta)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setPage(1)
      setBusqueda(busquedaInput.trim())
    }, 350)
    return () => window.clearTimeout(id)
  }, [busquedaInput])

  const cargar = useCallback(async () => {
    if (!rangoOk) return
    setCargando(true)
    setError(false)
    try {
      setDatos(await fetchAuditoria({ page, pageSize: TAM_PAGINA, accion, desde, hasta, search: busqueda }))
    } catch (e) {
      console.error('Error cargando la auditoría:', e)
      setError(true)
    } finally {
      setCargando(false)
    }
  }, [page, accion, desde, hasta, busqueda, rangoOk])

  useEffect(() => {
    cargar()
  }, [cargar])

  const formatoFecha = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    [locale]
  )

  const limpiar = () => {
    setAccion('todas')
    setDesde('')
    setHasta('')
    setBusquedaInput('')
    setBusqueda('')
    setPage(1)
  }

  const exportarCsv = () => {
    if (!datos) return
    const csv = eventosACsv(
      datos.eventos,
      { cuando: t('au.cuando'), persona: t('au.quien'), rol: 'Rol', accion: t('au.accion'), detalle: t('au.detalle') },
      (a) => (esAccionConocida(a) ? t(claveAccion(a)) : a)
    )
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const hayFiltros = accion !== 'todas' || desde || hasta || busqueda
  const eventos = datos?.eventos ?? []
  const pag = datos?.pagination ?? { page: 1, pageSize: TAM_PAGINA, total: 0, totalPages: 0 }
  const resumen = datos?.resumen
  const inicio = pag.total === 0 ? 0 : (pag.page - 1) * pag.pageSize + 1
  const fin = pag.total === 0 ? 0 : inicio + eventos.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('au.titulo')} subtitle={t('au.subtitulo')} />

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        <div>
          <h1 className="text-title font-semibold text-gray-900">{t('au.titulo')}</h1>
          <p className="max-w-3xl text-body text-gray-700">{t('au.subtitulo')}</p>
        </div>

        {datos && !datos.disponible ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center" aria-live="polite">
            <FileSearch className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 text-subtitle font-semibold text-gray-900">{t('au.noDisponible')}</h2>
            <p className="mx-auto max-w-lg text-body text-gray-700">{t('au.noDisponibleAyuda')}</p>
          </section>
        ) : (
          <>
            <section aria-label={t('au.resumenAcciones')} className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-6">
              <div className="bg-white p-4 lg:col-span-2">
                <p className="text-small text-gray-600">{t('au.total')}</p>
                <p className="text-display font-semibold text-gray-900">{resumen?.total ?? 0}</p>
                <p className="text-small text-gray-600">
                  {t('au.ultimo')}: {resumen?.ultimoEvento ? formatoFecha.format(new Date(resumen.ultimoEvento)) : t('au.ninguno')}
                </p>
              </div>
              {ACCIONES.map((a) => {
                const Icono = ICONO_ACCION[a]
                return (
                  <div key={a} className="bg-white p-4">
                    <p className="flex items-center gap-1.5 text-small text-gray-600">
                      <Icono className="h-4 w-4" aria-hidden="true" />
                      {t(claveAccion(a))}
                    </p>
                    <p className="mt-1 text-title font-semibold text-gray-900">{resumen?.porAccion?.[a] ?? 0}</p>
                  </div>
                )
              })}
            </section>

            <section aria-labelledby="titulo-filtros" className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 id="titulo-filtros" className="sr-only">{t('au.filtros')}</h2>
              <form
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_16rem_auto] lg:items-end"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative">
                  <label htmlFor="au-buscar" className="mb-1 block text-small font-medium text-gray-800">{t('au.buscar')}</label>
                  <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                  <input
                    id="au-buscar"
                    type="search"
                    value={busquedaInput}
                    onChange={(e) => setBusquedaInput(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-body text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="au-desde" className="mb-1 block text-small font-medium text-gray-800">{t('au.desde')}</label>
                  <input
                    id="au-desde"
                    type="date"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => { setDesde(e.target.value); setPage(1) }}
                    aria-invalid={!rangoOk}
                    className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-3 text-body text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="au-hasta" className="mb-1 block text-small font-medium text-gray-800">{t('au.hasta')}</label>
                  <input
                    id="au-hasta"
                    type="date"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => { setHasta(e.target.value); setPage(1) }}
                    aria-invalid={!rangoOk}
                    className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-3 text-body text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="au-accion" className="mb-1 block text-small font-medium text-gray-800">{t('au.accion')}</label>
                  <select
                    id="au-accion"
                    value={accion}
                    onChange={(e) => { setAccion(e.target.value as AccionAuditoria | 'todas'); setPage(1) }}
                    className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-3 text-body text-gray-900"
                  >
                    <option value="todas">{t('au.todas')}</option>
                    {ACCIONES.map((a) => <option key={a} value={a}>{t(claveAccion(a))}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  {hayFiltros && (
                    <button type="button" onClick={limpiar} className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-4 text-small font-medium text-gray-900 hover:bg-gray-100">
                      {t('com.limpiar')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={exportarCsv}
                    disabled={eventos.length === 0}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-600 px-4 text-small font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t('au.exportar')}
                  </button>
                </div>
              </form>
              {!rangoOk && <p role="alert" className="mt-3 text-small font-medium text-red-700">{t('au.fechaInvalida')}</p>}
            </section>

            <section aria-label={t('au.titulo')} className="rounded-2xl border border-gray-200 bg-white">
              {error && <p role="alert" className="m-4 rounded-xl bg-red-50 p-3 text-small text-red-800">{t('au.error')}</p>}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-small">
                  <caption className="sr-only">{t('au.titulo')}</caption>
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{t('au.cuando')}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('au.quien')}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('au.accion')}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t('au.detalle')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-600">{t('com.cargando')}</td></tr>
                    )}
                    {!cargando && !error && eventos.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center">
                          <FileSearch className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
                          <p className="mt-2 text-body font-medium text-gray-900">{t('au.vacia')}</p>
                          {!hayFiltros && <p className="text-small text-gray-600">{t('au.vaciaAyuda')}</p>}
                        </td>
                      </tr>
                    )}
                    {!cargando && eventos.map((e) => {
                      const conocida = esAccionConocida(e.accion)
                      const Icono = conocida ? ICONO_ACCION[e.accion as AccionAuditoria] : FileSearch
                      return (
                        <tr key={e.id} className="border-t border-gray-200 align-top">
                          <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                            <time dateTime={e.creadoEn}>{formatoFecha.format(new Date(e.creadoEn))}</time>
                          </td>
                          <td className="px-4 py-3">
                            <span className="block font-medium text-gray-900">{e.actorNombre}</span>
                            <span className="block text-gray-600">{existeClave(`rol.${e.actorRol}`) ? t(`rol.${e.actorRol}` as Clave) : e.actorRol}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-900">
                              <Icono className="h-4 w-4" aria-hidden="true" />
                              {conocida ? t(claveAccion(e.accion)) : e.accion}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{e.detalle || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4">
                <p className="text-small text-gray-600">{t('com.mostrando', { desde: inicio, hasta: fin, total: pag.total })}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={cargando || pag.page <= 1}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-small font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {t('com.anterior')}
                  </button>
                  <span className="text-small text-gray-700">{t('com.pagina', { pagina: pag.totalPages === 0 ? 0 : pag.page, total: pag.totalPages })}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pag.totalPages || 1, p + 1))}
                    disabled={cargando || pag.page >= pag.totalPages}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-small font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t('com.siguiente')}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card, { CardHeader, CardContent, CardTitle, CardDescription } from '../components/Card'
import Button from '../components/Button'
import { CourseQrPoster } from '../components/CourseQrPoster'
import apiClient from '../api/client'
import { exportElementToPNG } from '../utils/export'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CursoGrupo {
  id: number;
  cursoNombre: string;
  cursoCodigo: string;
  grupo: string;
  profesorNombre: string;
}


export default function ScheduleSurveys() {
  const navigate = useNavigate()
  const storedUser = (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })()

  const [form, setForm] = useState({
    careerId: '',
    period: '',
    startDate: '',
    endDate: '',
    target: 'all',
  })

  const [cursos, setCursos] = useState<CursoGrupo[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrSearch, setQrSearch] = useState('')
  const [qrPage, setQrPage] = useState(0)
  const [generatingQrs, setGeneratingQrs] = useState(false)
  const [qrTokensByGrupoId, setQrTokensByGrupoId] = useState<Record<number, string>>({})
  const [tableSearch, setTableSearch] = useState('')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('Encuestas de evaluación temprana - Códigos QR')
  const [emailMessage, setEmailMessage] = useState('Hola,\n\nTe comparto los códigos QR para responder las encuestas de evaluación temprana.\n\nSaludos.')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const loadCursos = async () => {
    try {
      setLoadingCursos(true)
      // TODO: ajustar al endpoint real que devuelva los cursos/grupos del coordinador
      const res = await apiClient.get('/api/coordinador/cursos-con-profesor')
      setCursos(res.data as CursoGrupo[])
    } catch (err) {
      console.error('Error cargando cursos para QRs:', err)
    } finally {
      setLoadingCursos(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const q = tableSearch.trim().toLowerCase()
    const visible = !q
      ? cursos
      : cursos.filter(c =>
        `${c.cursoNombre} ${c.cursoCodigo} ${c.grupo} ${c.profesorNombre}`.toLowerCase().includes(q)
      )

    // Evitar duplicados si por alguna razón vienen repetidos
    setSelectedIds(Array.from(new Set(visible.map(c => c.id))))
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const selectedCursos = useMemo(
    () => cursos.filter(c => selectedIds.includes(c.id)),
    [cursos, selectedIds]
  )

  const filteredCursosTable = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return cursos
    return cursos.filter(c =>
      `${c.cursoNombre} ${c.cursoCodigo} ${c.grupo} ${c.profesorNombre}`.toLowerCase().includes(q)
    )
  }, [cursos, tableSearch])

  const filteredSelectedCursos = useMemo(() => {
    const q = qrSearch.trim().toLowerCase()
    if (!q) return selectedCursos
    return selectedCursos.filter(c =>
      `${c.cursoNombre} ${c.cursoCodigo} ${c.grupo} ${c.profesorNombre}`.toLowerCase().includes(q)
    )
  }, [qrSearch, selectedCursos])

  const emailPreviewCursos = useMemo(
    () => selectedCursos.filter(c => !!qrTokensByGrupoId[c.id]),
    [selectedCursos, qrTokensByGrupoId]
  )

  const perPage = 3
  const totalPages = Math.max(1, Math.ceil(filteredSelectedCursos.length / perPage))
  const pageCursos = filteredSelectedCursos.slice(qrPage * perPage, qrPage * perPage + perPage)

  const visibleHaveTokens = useMemo(() => {
    if (pageCursos.length === 0) return false
    return pageCursos.every(c => !!qrTokensByGrupoId[c.id])
  }, [pageCursos, qrTokensByGrupoId])

  const buildQrUrl = (grupoId: number, cursoCodigo: string, grupo: string) => {
    const token = qrTokensByGrupoId[grupoId]
    if (token) return `${window.location.origin}/qr-evaluacion?token=${token}`
    // Previsualización (dummy) si aún no hay token real
    return `${window.location.origin}/qr-evaluacion?curso=${encodeURIComponent(cursoCodigo)}&grupo=${encodeURIComponent(grupo)}`
  }

  const ensureTokensForGrupoIds = async (grupoIds: number[]) => {
    const uniqueGrupoIds = Array.from(new Set(grupoIds))
    const missing = uniqueGrupoIds.filter(id => !qrTokensByGrupoId[id])
    if (missing.length === 0) return
    const resp = await apiClient.post('/api/qr-evaluaciones/batch', { grupoIds: missing })
    const created = (resp.data?.created || []) as Array<{ grupoId: number; token: string }>
    const skipped = (resp.data?.skipped || []) as Array<{ grupoId: number; reason: string }>
    if (created.length > 0) {
      setQrTokensByGrupoId(prev => {
        const next = { ...prev }
        created.forEach(item => { next[Number(item.grupoId)] = item.token })
        return next
      })
    }
    if (skipped.length > 0) {
      console.warn('QRs omitidos por falta de profesor_id:', skipped)
      alert(`Se omitieron ${skipped.length} grupo(s) porque no tienen profesor asignado.`)
    }
  }

  const openQrModal = async () => {
    const validSelected = selectedIds.filter(id => cursos.some(c => c.id === id))
    const uniqueSelected = Array.from(new Set(validSelected))

    if (uniqueSelected.length === 0) {
      alert('Selecciona al menos un curso/grupo para generar QR.')
      return
    }
    if (cursos.length === 0) {
      alert('Primero carga los cursos para poder generar los QR.')
      return
    }
    setQrModalOpen(true)
    setQrSearch('')
    setQrPage(0)

    // Generar tokens reales si aún no existen (o si faltan algunos)
    try {
      setGeneratingQrs(true)
      await ensureTokensForGrupoIds(uniqueSelected)
    } catch (err) {
      console.error('Error generando QRs (modal):', err)
      // Dejamos el modal abierto con previsualización dummy
    } finally {
      setGeneratingQrs(false)
    }
  }

  const downloadCurrentPage = async () => {
    if (pageCursos.length === 0) return
    if (generatingQrs || !visibleHaveTokens) {
      alert('Aún se están generando los tokens reales. Espera un momento y vuelve a intentar.')
      return
    }
    for (const c of pageCursos) {
      const el = document.getElementById(`qr-poster-${c.id}`) as HTMLElement | null
      if (!el) continue
      const safeName = `${c.cursoCodigo || 'curso'}-grupo-${c.grupo || c.id}`.replace(/[^\w\-]+/g, '_')
      // eslint-disable-next-line no-await-in-loop
      await exportElementToPNG(el, `QR_${safeName}.png`)
    }
  }

  const openEmailShareModal = async () => {
    if (selectedCursos.length === 0) {
      alert('Selecciona al menos un curso/grupo para compartir.')
      return
    }
    const ids = selectedCursos.map(c => c.id)
    try {
      setGeneratingQrs(true)
      await ensureTokensForGrupoIds(ids)
      setEmailModalOpen(true)
    } catch (e) {
      console.error('No se pudieron asegurar tokens para compartir por correo:', e)
      alert('No se pudieron generar/validar los tokens para compartir.')
    } finally {
      setGeneratingQrs(false)
    }
  }

  const sendShareEmail = async () => {
    const to = emailTo.trim()
    const subject = emailSubject.trim()
    const grupoIds = emailPreviewCursos.map(c => c.id)
    if (!to) {
      alert('Ingresa un correo de destino.')
      return
    }
    if (!subject) {
      alert('Ingresa un asunto para el correo.')
      return
    }
    if (grupoIds.length === 0) {
      alert('No hay QRs disponibles para enviar.')
      return
    }

    try {
      setSendingEmail(true)
      await apiClient.post('/api/qr-evaluaciones/share-email', {
        to,
        subject,
        message: emailMessage,
        grupoIds
      })
      setEmailModalOpen(false)
      alert('Correo enviado correctamente.')
    } catch (e: any) {
      console.error('Error enviando correo de QRs:', e)
      const msg = e?.response?.data?.error || e?.response?.data?.details || e?.message || 'No se pudo enviar el correo.'
      alert(String(msg))
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate || !form.endDate || !form.period) {
      alert('Completa Fecha de inicio, Fecha de cierre y Período antes de programar.')
      return
    }
    setSubmitting(true)
    try {
      // 1) Aquí iría la llamada real a tu endpoint de programación de encuestas

      setSubmitting(false)
      alert('Encuesta programada correctamente')
      navigate('/dashboard-coordinador')
    } catch (err) {
      setSubmitting(false)
      alert('Error al programar la encuesta')
    }
  }

  const backToDashboard = () => navigate('/dashboard-coordinador')

  const fondo = new URL('../assets/fondo.webp', import.meta.url).href

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      <div className="relative z-10">
        <Header user={{ id: storedUser?.id || '', name: `${storedUser?.nombre || ''} ${storedUser?.apellido || ''}`.trim() || 'Coordinador', type: 'coordinator', email: storedUser?.email || '' }} />

        <main className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-8">
          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-gray-900">Programar Encuestas</CardTitle>
              <CardDescription>
                Define el período y selecciona los cursos que tendrán código QR para esta encuesta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
                    <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de cierre</label>
                    <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                    <input name="period" value={form.period} onChange={handleChange} placeholder="2025-1" required className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                  </div>

                  <div>
                  </div>
                </div>

                {/* Selección masiva de cursos para QRs */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Cursos para generar QR</h3>
                      <p className="text-sm text-gray-600">
                        Marca los cursos/grupos que tendrán un QR para esta encuesta. Luego podrás descargar o imprimir los posters.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={loadCursos}>
                        {loadingCursos ? 'Cargando...' : 'Cargar cursos'}
                      </Button>
                      <Button type="button" variant="outline" onClick={selectAll} disabled={cursos.length === 0}>
                        Seleccionar todos
                      </Button>
                      <Button type="button" variant="outline" onClick={clearSelection} disabled={selectedIds.length === 0}>
                        Limpiar
                      </Button>
                      <Button
                        type="button"
                        onClick={openQrModal}
                        disabled={selectedIds.length === 0}
                        className="bg-university-red hover:bg-red-700 text-white"
                      >
                        {generatingQrs ? 'Generando...' : 'Generar QR'}
                      </Button>
                    </div>
                  </div>

                  {/* Buscador fuera del modal (tabla) */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <input
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Buscar en cursos por materia, código, grupo o docente..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Mostrando {filteredCursosTable.length} de {cursos.length}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-3 w-10" />
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Grupo</th>
                          <th className="px-4 py-3">Docente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingCursos ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                              Cargando cursos...
                            </td>
                          </tr>
                        ) : filteredCursosTable.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                              {cursos.length === 0
                                ? 'No hay cursos cargados. Haz clic en "Cargar cursos".'
                                : 'No hay resultados para tu búsqueda.'}
                            </td>
                          </tr>
                        ) : (
                          filteredCursosTable.map(curso => (
                            <tr key={curso.id} className="border-t hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(curso.id)}
                                  onChange={() => toggleSelect(curso.id)}
                                  className="h-4 w-4 text-university-red rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-2">{curso.cursoNombre}</td>
                              <td className="px-4 py-2">{curso.cursoCodigo}</td>
                              <td className="px-4 py-2">{curso.grupo}</td>
                              <td className="px-4 py-2">{curso.profesorNombre}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? 'Programando...' : 'Programar encuesta'}
                  </Button>
                  <Button type="button" variant="outline" onClick={backToDashboard}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modal de QRs */}
      <AnimatePresence>
      {qrModalOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setQrModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[86vh] flex flex-col"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Códigos QR de evaluación temprana</p>
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredSelectedCursos.length} seleccionado(s). Vista en carrusel de {perPage}.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setQrModalOpen(false)}>
                  Cerrar
                </Button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-auto">
                {/* Buscador */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <input
                      value={qrSearch}
                      onChange={(e) => { setQrSearch(e.target.value); setQrPage(0) }}
                      placeholder="Buscar por curso, código, grupo o docente..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  {/* Controles del carrusel */}
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setQrPage(p => Math.max(0, p - 1))}
                      disabled={qrPage <= 0}
                      className="h-10 w-10 rounded-full border border-gray-300 bg-white shadow-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Anterior"
                      title="Anterior"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={qrPage >= totalPages - 1}
                      className="h-10 w-10 rounded-full border border-gray-300 bg-white shadow-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Siguiente"
                      title="Siguiente"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Carrusel (paginación) */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Página {Math.min(totalPages, qrPage + 1)} de {totalPages}
                  </p>
                  {generatingQrs && (
                    <p className="text-xs text-gray-500">Generando tokens reales...</p>
                  )}
                </div>

                {/* Carrusel centrado (como la referencia): flecha - cards - flecha */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <button
                    type="button"
                    onClick={() => setQrPage(p => Math.max(0, p - 1))}
                    disabled={qrPage <= 0}
                    className="h-12 w-12 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Anterior"
                    title="Anterior"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-900" />
                  </button>

                  <div className="flex items-center justify-center gap-6">
                    {pageCursos.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 w-[700px] max-w-full">
                        No hay resultados para tu búsqueda.
                      </div>
                    ) : (
                      pageCursos.map(c => {
                        const url = buildQrUrl(c.id, c.cursoCodigo, c.grupo)
                        return (
                          <div key={c.id} id={`qr-poster-${c.id}`} className="flex">
                            <CourseQrPoster
                              url={url}
                              nombreMateria={c.cursoNombre}
                              grupo={c.grupo}
                              nombreProfesor={c.profesorNombre}
                            />
                          </div>
                        )
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setQrPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={qrPage >= totalPages - 1}
                    className="h-12 w-12 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Siguiente"
                    title="Siguiente"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-900" />
                  </button>
                </div>
              </div>

              {/* Footer con acciones */}
              <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openEmailShareModal}
                  disabled={selectedCursos.length === 0 || generatingQrs}
                >
                  Compartir
                </Button>
                <Button
                  type="button"
                  onClick={downloadCurrentPage}
                  disabled={pageCursos.length === 0 || generatingQrs || !visibleHaveTokens}
                  className="bg-university-red hover:bg-red-700 text-white"
                >
                  Descargar
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {emailModalOpen && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-60"
              onClick={() => !sendingEmail && setEmailModalOpen(false)}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[86vh] flex flex-col"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Compartir QRs por correo</p>
                    <p className="text-sm text-gray-600">
                      Define destinatario y asunto antes de enviar.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>
                    Cerrar
                  </Button>
                </div>

                <div className="p-5 space-y-4 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correo destino</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="ejemplo@universidad.edu.co"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                      <input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Asunto del correo"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      QRs que se enviarán ({emailPreviewCursos.length})
                    </p>
                    {emailPreviewCursos.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay QRs listos para enviar.</p>
                    ) : (
                      <div className="max-h-52 overflow-auto space-y-2">
                        {emailPreviewCursos.map((c) => (
                          <div key={c.id} className="text-sm text-gray-700 border border-gray-200 bg-white rounded-md p-2">
                            <p className="font-medium">{c.cursoNombre} ({c.cursoCodigo})</p>
                            <p>Grupo: {c.grupo} | Docente: {c.profesorNombre}</p>
                            <p className="text-xs text-gray-500 break-all">{buildQrUrl(c.id, c.cursoCodigo, c.grupo)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={sendShareEmail}
                    disabled={sendingEmail || emailPreviewCursos.length === 0}
                    className="bg-university-red hover:bg-red-700 text-white"
                  >
                    {sendingEmail ? 'Enviando...' : 'Enviar correo'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



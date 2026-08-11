import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '../../components/Header'
import Button from '../../components/Button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/Card'
import { CourseQrPoster } from '../../components/CourseQrPoster'
import { useAuth } from '../../context/AuthContext'
import { usersApi, GrupoConProfesor, FacultadConCarreras } from '../../api/users'
import { createQrEvaluationsBatch, shareQrEvaluationsEmail } from '../../api/evaluations.api'
import { exportElementToPNG } from '../../utils/export'
import { User } from '../../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href

export default function AdminQrPage() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const headerUser: User = {
    id: authUser?.id || '',
    name: `${authUser?.nombre || ''} ${authUser?.apellido || ''}`.trim() || 'Admin',
    type: 'admin',
    email: authUser?.email || '',
  }

  const [facultades, setFacultades] = useState<FacultadConCarreras[]>([])
  const [careerId, setCareerId] = useState('')
  const [period, setPeriod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [grupos, setGrupos] = useState<GrupoConProfesor[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrSearch, setQrSearch] = useState('')
  const [qrPage, setQrPage] = useState(0)
  const [generatingQrs, setGeneratingQrs] = useState(false)
  const [qrTokensByGrupoId, setQrTokensByGrupoId] = useState<Record<number, string>>({})

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('Encuestas de evaluación - Códigos QR')
  const [emailMessage, setEmailMessage] = useState(
    'Hola,\n\nTe comparto los códigos QR para responder las encuestas.\n\nSaludos.'
  )

  const careers = useMemo(
    () =>
      facultades.flatMap((f) =>
        (f.carreras || []).map((c) => ({
          ...c,
          facultadNombre: f.nombre,
        }))
      ),
    [facultades]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { facultades: list } = await usersApi.academicStructure()
        if (!cancelled) setFacultades(list)
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.error || 'Error cargando carreras')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadGrupos = async () => {
    if (!careerId) {
      setError('Selecciona una carrera primero')
      return
    }
    setLoadingGrupos(true)
    setError(null)
    setSelectedIds([])
    setQrTokensByGrupoId({})
    try {
      const data = await usersApi.gruposByCareer(Number(careerId))
      setGrupos(data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error cargando cursos/grupos')
      setGrupos([])
    } finally {
      setLoadingGrupos(false)
    }
  }

  const filteredCursosTable = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return grupos
    return grupos.filter((c) =>
      `${c.cursoNombre} ${c.cursoCodigo} ${c.grupo} ${c.profesorNombre}`.toLowerCase().includes(q)
    )
  }, [grupos, tableSearch])

  const selectedCursos = useMemo(
    () => grupos.filter((c) => selectedIds.includes(c.id)),
    [grupos, selectedIds]
  )

  const filteredSelectedCursos = useMemo(() => {
    const q = qrSearch.trim().toLowerCase()
    if (!q) return selectedCursos
    return selectedCursos.filter((c) =>
      `${c.cursoNombre} ${c.cursoCodigo} ${c.grupo} ${c.profesorNombre}`.toLowerCase().includes(q)
    )
  }, [qrSearch, selectedCursos])

  const perPage = 3
  const totalPages = Math.max(1, Math.ceil(filteredSelectedCursos.length / perPage))
  const pageCursos = filteredSelectedCursos.slice(qrPage * perPage, qrPage * perPage + perPage)

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(Array.from(new Set(filteredCursosTable.map((c) => c.id))))
  }

  const clearSelection = () => setSelectedIds([])

  const buildQrUrl = (grupoId: number, cursoCodigo: string, grupo: string) => {
    const token = qrTokensByGrupoId[grupoId]
    if (token) return `${window.location.origin}/qr-evaluacion?token=${token}`
    return `${window.location.origin}/qr-evaluacion?curso=${encodeURIComponent(cursoCodigo)}&grupo=${encodeURIComponent(grupo)}`
  }

  const ensureTokensForGrupoIds = async (grupoIds: number[]) => {
    const unique = Array.from(new Set(grupoIds))
    const missing = unique.filter((id) => !qrTokensByGrupoId[id])
    if (missing.length === 0) return
    const resp = await createQrEvaluationsBatch(missing)
    const created = resp?.created || []
    const skipped = resp?.skipped || []
    if (created.length > 0) {
      setQrTokensByGrupoId((prev) => {
        const next = { ...prev }
        created.forEach((item) => {
          next[Number(item.grupoId)] = item.token
        })
        return next
      })
    }
    if (skipped.length > 0) {
      alert(`Se omitieron ${skipped.length} grupo(s) porque no tienen profesor asignado.`)
    }
  }

  const openQrModal = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un curso/grupo para generar QR.')
      return
    }
    setQrModalOpen(true)
    setQrSearch('')
    setQrPage(0)
    try {
      setGeneratingQrs(true)
      await ensureTokensForGrupoIds(selectedIds)
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingQrs(false)
    }
  }

  const downloadCurrentPage = async () => {
    for (const c of pageCursos) {
      const el = document.getElementById(`admin-qr-poster-${c.id}`) as HTMLElement | null
      if (!el) continue
      const safeName = `${c.cursoCodigo || 'curso'}-grupo-${c.grupo || c.id}`.replace(/[^\w\-]+/g, '_')
      // eslint-disable-next-line no-await-in-loop
      await exportElementToPNG(el, `QR_${safeName}.png`)
    }
  }

  const sendShareEmail = async () => {
    const to = emailTo.trim()
    const subject = emailSubject.trim()
    const grupoIds = selectedCursos.filter((c) => qrTokensByGrupoId[c.id]).map((c) => c.id)
    if (!to || !subject || grupoIds.length === 0) {
      alert('Completa correo/asunto y genera QRs antes de enviar.')
      return
    }
    try {
      setSendingEmail(true)
      await shareQrEvaluationsEmail({ to, subject, message: emailMessage, grupoIds })
      setEmailModalOpen(false)
      alert('Correo enviado correctamente.')
    } catch (e: any) {
      alert(e?.response?.data?.error || 'No se pudo enviar el correo.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || !period) {
      alert('Completa Fecha de inicio, Fecha de cierre y Período.')
      return
    }
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un curso/grupo.')
      return
    }
    try {
      setGeneratingQrs(true)
      await ensureTokensForGrupoIds(selectedIds)
      alert('QR generados / encuesta lista para compartir.')
    } catch {
      alert('Error al generar los QR')
    } finally {
      setGeneratingQrs(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 pointer-events-none" />
      </div>

      <div className="relative z-10">
        <Header user={headerUser} />

        <main className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-8">
          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-4">
              <Link to="/dashboard-admin" className="text-sm text-red-600 hover:underline">
                ← Volver al panel
              </Link>
              <CardTitle className="text-2xl text-gray-900 mt-1">Generación de QR</CardTitle>
              <CardDescription>
                Define el período y selecciona los cursos/grupos que tendrán código QR (mismo flujo
                del coordinador, con alcance por carrera).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
                    <select
                      value={careerId}
                      onChange={(e) => setCareerId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Selecciona una carrera…</option>
                      {careers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.facultadNombre} · {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                    <input
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="2026-1"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de cierre</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Cursos para generar QR</h3>
                      <p className="text-sm text-gray-600">
                        Marca los cursos/grupos y genera posters descargables.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={loadGrupos}>
                        {loadingGrupos ? 'Cargando...' : 'Cargar cursos'}
                      </Button>
                      <Button type="button" variant="outline" onClick={selectAll} disabled={grupos.length === 0}>
                        Seleccionar todos
                      </Button>
                      <Button type="button" variant="outline" onClick={clearSelection} disabled={selectedIds.length === 0}>
                        Limpiar
                      </Button>
                      <Button
                        type="button"
                        onClick={openQrModal}
                        disabled={selectedIds.length === 0}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {generatingQrs ? 'Generando...' : 'Generar QR'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <input
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Buscar por materia, código, grupo o docente..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      Mostrando {filteredCursosTable.length} de {grupos.length}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

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
                        {loadingGrupos ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                              Cargando cursos...
                            </td>
                          </tr>
                        ) : filteredCursosTable.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                              {grupos.length === 0
                                ? 'No hay cursos cargados. Elige carrera y pulsa "Cargar cursos".'
                                : 'No hay resultados para tu búsqueda.'}
                            </td>
                          </tr>
                        ) : (
                          filteredCursosTable.map((curso) => (
                            <tr key={curso.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(curso.id)}
                                  onChange={() => toggleSelect(curso.id)}
                                  className="h-4 w-4 text-red-600 rounded border-gray-300"
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
                  <Button type="submit" disabled={generatingQrs} className="bg-red-600 hover:bg-red-700 text-white">
                    {generatingQrs ? 'Procesando...' : 'Confirmar generación'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard-admin')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>

      <AnimatePresence>
        {qrModalOpen && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-60"
              onClick={() => setQrModalOpen(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[86vh] flex flex-col"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
              >
                <div className="p-4 border-b flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Posters QR</h3>
                    <p className="text-sm text-gray-500">
                      {generatingQrs ? 'Generando tokens…' : `${selectedCursos.length} grupo(s) seleccionados`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={downloadCurrentPage}>
                      Descargar página
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        await ensureTokensForGrupoIds(selectedIds)
                        setEmailModalOpen(true)
                      }}
                    >
                      Compartir email
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setQrModalOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
                <div className="p-4 border-b flex items-center gap-3">
                  <input
                    value={qrSearch}
                    onChange={(e) => {
                      setQrSearch(e.target.value)
                      setQrPage(0)
                    }}
                    placeholder="Filtrar posters…"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={qrPage <= 0} onClick={() => setQrPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {qrPage + 1}/{totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={qrPage >= totalPages - 1}
                    onClick={() => setQrPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-6 overflow-auto flex flex-wrap gap-4 justify-center">
                  {pageCursos.map((c) => (
                    <div key={c.id} id={`admin-qr-poster-${c.id}`} className="flex">
                      <CourseQrPoster
                        url={buildQrUrl(c.id, c.cursoCodigo, c.grupo)}
                        nombreMateria={c.cursoNombre}
                        grupo={c.grupo}
                        nombreProfesor={c.profesorNombre}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {emailModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold">Compartir QRs por correo</h3>
            <input
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Destinatario"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
            <input
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Asunto"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <textarea
              className="w-full border rounded-md p-2 text-sm min-h-[120px]"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={sendShareEmail} disabled={sendingEmail}>
                {sendingEmail ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

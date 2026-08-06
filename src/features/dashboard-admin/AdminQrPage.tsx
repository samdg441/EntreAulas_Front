import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Button from '../../components/Button'
import { CourseQrPoster } from '../../components/CourseQrPoster'
import { useAuth } from '../../context/AuthContext'
import { usersApi, GrupoConProfesor, FacultadConCarreras } from '../../api/users'
import { createQrEvaluationsBatch } from '../../api/evaluations.api'
import { exportElementToPNG } from '../../utils/export'
import { User } from '../../types'
import { QrCode, Search } from 'lucide-react'

export default function AdminQrPage() {
  const { user: authUser } = useAuth()
  const headerUser: User = {
    id: authUser?.id || '',
    name: `${authUser?.nombre || ''} ${authUser?.apellido || ''}`.trim() || 'Admin',
    type: 'admin',
    email: authUser?.email || '',
  }

  const [facultades, setFacultades] = useState<FacultadConCarreras[]>([])
  const [careerId, setCareerId] = useState('')
  const [grupos, setGrupos] = useState<GrupoConProfesor[]>([])
  const [loadingStructure, setLoadingStructure] = useState(true)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)
  const [tokens, setTokens] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
      } finally {
        if (!cancelled) setLoadingStructure(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadGrupos = async (id: string) => {
    if (!id) {
      setGrupos([])
      return
    }
    setLoadingGrupos(true)
    setError(null)
    setSelectedIds([])
    setTokens({})
    setMessage(null)
    try {
      const data = await usersApi.gruposByCareer(Number(id))
      setGrupos(data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error cargando grupos')
      setGrupos([])
    } finally {
      setLoadingGrupos(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return grupos
    return grupos.filter((g) =>
      `${g.cursoNombre} ${g.cursoCodigo} ${g.grupo} ${g.profesorNombre}`
        .toLowerCase()
        .includes(q)
    )
  }, [grupos, search])

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    setSelectedIds(Array.from(new Set(filtered.map((g) => g.id))))
  }

  const generateQr = async () => {
    if (selectedIds.length === 0) {
      setError('Selecciona al menos un grupo')
      return
    }
    setGenerating(true)
    setError(null)
    setMessage(null)
    try {
      const resp = await createQrEvaluationsBatch(selectedIds)
      const created = resp?.created || []
      const skipped = resp?.skipped || []
      setTokens((prev) => {
        const next = { ...prev }
        created.forEach((item) => {
          next[Number(item.grupoId)] = item.token
        })
        return next
      })
      setMessage(
        `Generados: ${created.length}` +
          (skipped.length ? ` · Omitidos sin profesor: ${skipped.length}` : '')
      )
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error generando QRs')
    } finally {
      setGenerating(false)
    }
  }

  const downloadSelected = async () => {
    const withToken = selectedIds.filter((id) => tokens[id])
    if (withToken.length === 0) {
      setError('Primero genera los tokens QR')
      return
    }
    for (const id of withToken) {
      const el = document.getElementById(`admin-qr-${id}`) as HTMLElement | null
      const g = grupos.find((x) => x.id === id)
      if (!el || !g) continue
      const safe = `${g.cursoCodigo || 'curso'}-g${g.grupo}`.replace(/[^\w\-]+/g, '_')
      // eslint-disable-next-line no-await-in-loop
      await exportElementToPNG(el, `QR_${safe}.png`)
    }
  }

  const buildUrl = (grupoId: number) => {
    const token = tokens[grupoId]
    if (!token) return ''
    return `${window.location.origin}/qr-evaluacion?token=${token}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={headerUser} title="Generación de QR" subtitle="Evaluaciones por grupo" />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <Link to="/dashboard-admin" className="text-sm text-red-600 hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Operatividad · Accesos QR</h1>
          <p className="text-sm text-gray-600 mt-1">
            Genera tokens de evaluación de forma individual o masiva por carrera.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                disabled={loadingStructure}
                value={careerId}
                onChange={(e) => {
                  setCareerId(e.target.value)
                  loadGrupos(e.target.value)
                }}
              >
                <option value="">Selecciona una carrera…</option>
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.facultadNombre} · {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar grupo</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Curso, código, profesor…"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={selectAllVisible} disabled={!filtered.length}>
              Seleccionar visibles
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelectedIds([])}>
              Limpiar selección
            </Button>
            <Button
              type="button"
              onClick={generateQr}
              disabled={generating || selectedIds.length === 0}
              className="inline-flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              {generating ? 'Generando…' : `Generar QR (${selectedIds.length})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadSelected}
              disabled={selectedIds.every((id) => !tokens[id])}
            >
              Descargar PNG
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </div>

        {loadingGrupos && <p className="text-gray-600">Cargando grupos…</p>}

        {!loadingGrupos && careerId && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3 font-medium">Curso</th>
                  <th className="px-4 py-3 font-medium">Grupo</th>
                  <th className="px-4 py-3 font-medium">Profesor</th>
                  <th className="px-4 py-3 font-medium">Token</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(g.id)}
                        onChange={() => toggle(g.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{g.cursoNombre}</div>
                      <div className="text-xs text-gray-500">{g.cursoCodigo}</div>
                    </td>
                    <td className="px-4 py-2">{g.grupo}</td>
                    <td className="px-4 py-2">{g.profesorNombre}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-[140px]">
                      {tokens[g.id] ? '✓ Generado' : '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No hay grupos para esta carrera
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Posters ocultos / visibles para descarga */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedIds
            .filter((id) => tokens[id])
            .map((id) => {
              const g = grupos.find((x) => x.id === id)
              if (!g) return null
              return (
                <div key={id} id={`admin-qr-${id}`} className="flex">
                  <CourseQrPoster
                    url={buildUrl(id)}
                    nombreMateria={g.cursoNombre}
                    grupo={g.grupo}
                    nombreProfesor={g.profesorNombre}
                  />
                </div>
              )
            })}
        </div>
      </main>
    </div>
  )
}

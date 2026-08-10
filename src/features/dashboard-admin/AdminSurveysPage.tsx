import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/Card'
import Badge from '../../components/Badge'
import { useAuth } from '../../context/AuthContext'
import { usersApi, FacultadConCarreras } from '../../api/users'
import {
  surveysApi,
  SurveyCategory,
  SurveyQuestion,
  CreateSurveyQuestionPayload,
} from '../../api/surveys.api'
import { User } from '../../types'
import { ClipboardPlus, Trash2 } from 'lucide-react'

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href

const QUESTION_TYPES = [
  { value: 'likert', label: 'Escala Likert (1-5)' },
  { value: 'texto', label: 'Texto abierto' },
  { value: 'opcion_multiple', label: 'Opción múltiple' },
]

export default function AdminSurveysPage() {
  const { user: authUser } = useAuth()
  const headerUser: User = {
    id: authUser?.id || '',
    name: `${authUser?.nombre || ''} ${authUser?.apellido || ''}`.trim() || 'Admin',
    type: 'admin',
    email: authUser?.email || '',
  }

  const [categories, setCategories] = useState<SurveyCategory[]>([])
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [facultades, setFacultades] = useState<FacultadConCarreras[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState<CreateSurveyQuestionPayload>({
    categoria_id: 0,
    texto_pregunta: '',
    descripcion: '',
    tipo_pregunta: 'likert',
    obligatoria: true,
    orden: 1,
    id_carrera: null,
  })

  const careers = useMemo(
    () => facultades.flatMap((f) => f.carreras || []),
    [facultades]
  )

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cats, qs, structure] = await Promise.all([
        surveysApi.listCategories(),
        surveysApi.listQuestions(),
        usersApi.academicStructure(),
      ])
      setCategories(cats)
      setQuestions(qs)
      setFacultades(structure.facultades)
      if (cats.length && !form.categoria_id) {
        setForm((prev) => ({ ...prev, categoria_id: cats[0].id, orden: qs.length + 1 }))
      } else {
        setForm((prev) => ({ ...prev, orden: qs.length + 1 }))
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Error cargando encuestas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.categoria_id || !form.texto_pregunta.trim()) {
      setError('Completa categoría y texto de la pregunta')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await surveysApi.createQuestion({
        ...form,
        id_carrera: form.id_carrera || null,
      })
      setSuccess('Pregunta agregada a la encuesta')
      setForm((prev) => ({
        ...prev,
        texto_pregunta: '',
        descripcion: '',
        orden: prev.orden + 1,
      }))
      await loadAll()
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'No se pudo crear la pregunta'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      await surveysApi.deactivateQuestion(id)
      await loadAll()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo desactivar la pregunta')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />

      <div className="relative z-10">
        <Header user={headerUser} title="Encuestas" subtitle="Crear y gestionar preguntas" />

        <main className="max-w-6xl mx-auto p-6 space-y-6">
          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-4">
              <Link to="/dashboard-admin" className="text-sm text-red-600 hover:underline">
                ← Volver al panel
              </Link>
              <CardTitle className="text-2xl text-gray-900 mt-1 flex items-center gap-2">
                <ClipboardPlus className="h-6 w-6 text-red-600" />
                Agregar encuesta / pregunta
              </CardTitle>
              <CardDescription>
                Amplía el banco de preguntas más allá de la evaluación temprana. Puedes asociarlas
                a una carrera o dejarlas generales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                  {success}
                </p>
              )}

              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.categoria_id || ''}
                    onChange={(e) =>
                      setForm({ ...form, categoria_id: Number(e.target.value) })
                    }
                    required
                  >
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.tipo_pregunta}
                    onChange={(e) => setForm({ ...form, tipo_pregunta: e.target.value })}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Texto de la pregunta"
                    value={form.texto_pregunta}
                    onChange={(e) => setForm({ ...form, texto_pregunta: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Descripción (opcional)"
                    value={form.descripcion || ''}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrera (opcional)
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.id_carrera ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        id_carrera: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">General (todas las carreras)</option>
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    label="Orden"
                    type="number"
                    min={1}
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: Number(e.target.value) || 1 })}
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!form.obligatoria}
                    onChange={(e) => setForm({ ...form, obligatoria: e.target.checked })}
                  />
                  Pregunta obligatoria
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={saving || loading}>
                    {saving ? 'Guardando…' : 'Agregar pregunta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-gray-900">Preguntas activas</CardTitle>
              <CardDescription>
                {loading ? 'Cargando…' : `${questions.length} pregunta(s) en el banco`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-left text-gray-700">
                    <tr>
                      <th className="px-4 py-3">Orden</th>
                      <th className="px-4 py-3">Pregunta</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{q.orden}</td>
                        <td className="px-4 py-3">{q.texto_pregunta}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{q.categoria?.nombre || q.categoria_id}</Badge>
                        </td>
                        <td className="px-4 py-3 capitalize">{q.tipo_pregunta}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="inline-flex items-center gap-1 border-red-200 text-red-600"
                            onClick={() => handleDeactivate(q.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Desactivar
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!loading && questions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Aún no hay preguntas activas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

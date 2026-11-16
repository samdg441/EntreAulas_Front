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
import { corregirPregunta, datosDePregunta } from './preguntas-encuesta'
import { ClipboardPlus, Pencil, Trash2, X } from 'lucide-react'

const QUESTION_TYPES = [
  { value: 'likert', label: 'Escala Likert (1-5)' },
  { value: 'texto', label: 'Texto abierto' },
  { value: 'opcion_multiple', label: 'Opción múltiple' },
]

type Vista = 'menu' | 'crear' | 'elegir' | 'preguntas'

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
  const [vista, setVista] = useState<Vista>('menu')
  const [encuestaActiva, setEncuestaActiva] = useState<SurveyCategory | null>(null)
  const [dialogoPregunta, setDialogoPregunta] = useState(false)
  /** null: el diálogo agrega una pregunta; un id: corrige esa pregunta (RF-ENC-33). */
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [form, setForm] = useState<CreateSurveyQuestionPayload>({
    categoria_id: 0,
    texto_pregunta: '',
    descripcion: '',
    tipo_pregunta: 'likert',
    obligatoria: true,
    orden: 1,
    id_carrera: null,
  })
  const [encuestaForm, setEncuestaForm] = useState({ nombre: '', descripcion: '', orden: 1 })

  const careers = useMemo(
    () => facultades.flatMap((f) => f.carreras || []),
    [facultades]
  )

  const preguntasDeLaEncuesta = useMemo(
    () => questions.filter((q) => q.categoria_id === encuestaActiva?.id),
    [questions, encuestaActiva]
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
      setEncuestaActiva((actual) => (actual ? cats.find((c) => c.id === actual.id) ?? actual : null))
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

  const volverAlMenu = () => {
    setVista('menu')
    setEncuestaActiva(null)
    cerrarDialogo()
    setError(null)
    setSuccess(null)
  }

  const abrirCrear = () => {
    setEncuestaForm({ nombre: '', descripcion: '', orden: categories.length + 1 })
    setEncuestaActiva(null)
    setError(null)
    setSuccess(null)
    setVista('crear')
  }

  const abrirElegir = () => {
    setError(null)
    setSuccess(null)
    setVista('elegir')
  }

  const abrirEncuesta = (encuesta: SurveyCategory) => {
    setEncuestaActiva(encuesta)
    setEncuestaForm({
      nombre: encuesta.nombre,
      descripcion: encuesta.descripcion || '',
      orden: encuesta.orden || 1,
    })
    setForm((prev) => ({ ...prev, categoria_id: encuesta.id }))
    setError(null)
    setSuccess(null)
    setVista('preguntas')
  }

  const cerrarDialogo = () => {
    setDialogoPregunta(false)
    setEditandoId(null)
    setError(null)
  }

  const abrirPregunta = () => {
    if (!encuestaActiva) return
    setEditandoId(null)
    setForm((prev) => ({
      ...prev,
      categoria_id: encuestaActiva.id,
      texto_pregunta: '',
      descripcion: '',
      orden: preguntasDeLaEncuesta.length + 1,
    }))
    setError(null)
    setDialogoPregunta(true)
  }

  const abrirEdicion = (pregunta: SurveyQuestion) => {
    setForm(datosDePregunta(pregunta))
    setEditandoId(pregunta.id)
    setError(null)
    setSuccess(null)
    setDialogoPregunta(true)
  }

  const handleCreateEncuesta = async (e: FormEvent) => {
    e.preventDefault()
    if (!encuestaForm.nombre.trim()) {
      setError('Escribe el nombre de la encuesta')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const creada = await surveysApi.createCategory({
        nombre: encuestaForm.nombre.trim(),
        descripcion: encuestaForm.descripcion.trim(),
        orden: encuestaForm.orden,
      })
      abrirEncuesta(creada)
      setSuccess('Encuesta agregada')
      await loadAll()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo crear la encuesta')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEncuesta = async (e: FormEvent) => {
    e.preventDefault()
    if (!encuestaActiva) return
    if (!encuestaForm.nombre.trim()) {
      setError('Escribe el nombre de la encuesta')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const actualizada = await surveysApi.updateCategory(encuestaActiva.id, {
        nombre: encuestaForm.nombre.trim(),
        descripcion: encuestaForm.descripcion.trim(),
        orden: encuestaForm.orden,
      })
      setEncuestaActiva(actualizada)
      setSuccess('Encuesta actualizada')
      await loadAll()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo actualizar la encuesta')
    } finally {
      setSaving(false)
    }
  }

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
      setDialogoPregunta(false)
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

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (editandoId === null) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    const resultado = await corregirPregunta(
      surveysApi,
      editandoId,
      { ...form, id_carrera: form.id_carrera || null },
      questions
    )
    setSaving(false)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    setSuccess('Pregunta actualizada')
    cerrarDialogo()
    await loadAll()
  }

  const handleDeactivate = async (id: number) => {
    try {
      await surveysApi.deactivateQuestion(id)
      await loadAll()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo desactivar la pregunta')
    }
  }

  const aviso = (
    <>
      {error && !dialogoPregunta && (
        <p role="alert" className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
          {success}
        </p>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="relative z-10">
        <Header user={headerUser} title="Encuestas" subtitle="Crear o editar una encuesta y luego sus preguntas" />

        <main className="max-w-6xl xl:max-w-[92rem] mx-auto p-6 lg:p-10 space-y-8 lg:space-y-10">
          {vista === 'menu' && (
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
              <CardHeader className="pb-4">
                <Link to="/dashboard-admin" className="text-sm lg:text-base text-red-600 hover:underline">
                  ← Volver al panel
                </Link>
                <CardTitle className="text-2xl lg:text-3xl text-gray-900 mt-1 flex items-center gap-2">
                  <ClipboardPlus className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                  ¿Qué quieres hacer?
                </CardTitle>
                <CardDescription className="text-base lg:text-lg">
                  Elige si vas a crear una encuesta o a editar una existente. Las preguntas aparecen después.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-600">Cargando…</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      aria-label="Crear encuesta"
                      onClick={abrirCrear}
                      className="rounded-xl border border-gray-200 p-6 text-left hover:border-red-400"
                    >
                      <ClipboardPlus className="h-6 w-6 text-red-600 mb-3" />
                      <span className="block text-lg font-semibold text-gray-900">Crear encuesta</span>
                      <span className="block text-sm text-gray-600 mt-1">Empieza una encuesta nueva y luego agrega sus preguntas.</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Editar encuesta"
                      onClick={abrirElegir}
                      className="rounded-xl border border-gray-200 p-6 text-left hover:border-red-400"
                    >
                      <Pencil className="h-6 w-6 text-red-600 mb-3" />
                      <span className="block text-lg font-semibold text-gray-900">Editar encuesta</span>
                      <span className="block text-sm text-gray-600 mt-1">Abre una encuesta ya creada para cambiarla y ver sus preguntas.</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {vista === 'crear' && (
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
              <CardHeader className="pb-4">
                <button type="button" onClick={volverAlMenu} className="text-sm lg:text-base text-red-600 hover:underline text-left">
                  ← Volver al menú
                </button>
                <CardTitle className="text-2xl lg:text-3xl text-gray-900 mt-1">Crear encuesta</CardTitle>
                <CardDescription className="text-base lg:text-lg">
                  Primero guarda el nombre de la encuesta. Después se muestran sus preguntas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aviso}
                <form onSubmit={handleCreateEncuesta} className="grid grid-cols-1 gap-4 max-w-xl">
                  <Input
                    label="Nombre de la encuesta"
                    value={encuestaForm.nombre}
                    onChange={(e) => setEncuestaForm({ ...encuestaForm, nombre: e.target.value })}
                    required
                  />
                  <Input
                    label="Descripción de la encuesta"
                    value={encuestaForm.descripcion}
                    onChange={(e) => setEncuestaForm({ ...encuestaForm, descripcion: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar encuesta'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {vista === 'elegir' && (
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
              <CardHeader className="pb-4">
                <button type="button" onClick={volverAlMenu} className="text-sm lg:text-base text-red-600 hover:underline text-left">
                  ← Volver al menú
                </button>
                <CardTitle className="text-2xl lg:text-3xl text-gray-900 mt-1">Editar encuesta</CardTitle>
                <CardDescription className="text-base lg:text-lg">
                  Elige la encuesta. Luego verás sus datos y sus preguntas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aviso}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={c.nombre}
                      onClick={() => abrirEncuesta(c)}
                      className="rounded-xl border border-gray-200 p-4 text-left hover:border-red-400"
                    >
                      <span className="block font-semibold text-gray-900">{c.nombre}</span>
                      <span className="block text-sm text-gray-600 mt-1">{c.descripcion || 'Sin descripción'}</span>
                    </button>
                  ))}
                </div>
                {!loading && categories.length === 0 && (
                  <p className="text-gray-500">Aún no hay encuestas</p>
                )}
              </CardContent>
            </Card>
          )}

          {vista === 'preguntas' && encuestaActiva && (
            <>
              <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
                <CardHeader className="pb-4">
                  <button type="button" onClick={volverAlMenu} className="text-sm lg:text-base text-red-600 hover:underline text-left">
                    ← Volver al menú
                  </button>
                  <CardTitle className="text-2xl lg:text-3xl text-gray-900 mt-1">{encuestaActiva.nombre}</CardTitle>
                  <CardDescription className="text-base lg:text-lg">
                    Cambia los datos de la encuesta y administra sus preguntas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aviso}
                  <form onSubmit={handleUpdateEncuesta} className="grid grid-cols-1 gap-4 max-w-xl">
                    <Input
                      label="Nombre de la encuesta"
                      value={encuestaForm.nombre}
                      onChange={(e) => setEncuestaForm({ ...encuestaForm, nombre: e.target.value })}
                      required
                    />
                    <Input
                      label="Descripción de la encuesta"
                      value={encuestaForm.descripcion}
                      onChange={(e) => setEncuestaForm({ ...encuestaForm, descripcion: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="outline" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar cambios'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl lg:text-3xl text-gray-900">Preguntas</CardTitle>
                  <CardDescription className="text-base lg:text-lg">
                    {loading ? 'Cargando…' : `${preguntasDeLaEncuesta.length} pregunta(s) de esta encuesta`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" onClick={abrirPregunta}>Agregar pregunta</Button>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm lg:text-base">
                      <thead className="bg-gray-100 text-left text-gray-700">
                        <tr>
                          <th className="px-4 py-3">Orden</th>
                          <th className="px-4 py-3">Pregunta</th>
                          <th className="px-4 py-3">Encuesta</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preguntasDeLaEncuesta.map((q) => (
                          <tr key={q.id} className="border-t border-gray-100">
                            <td className="px-4 py-3">{q.orden}</td>
                            <td className="px-4 py-3">{q.texto_pregunta}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{q.categoria?.nombre || encuestaActiva.nombre}</Badge>
                            </td>
                            <td className="px-4 py-3 capitalize">{q.tipo_pregunta}</td>
                            <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="inline-flex items-center gap-1"
                                aria-label={`Editar pregunta ${q.texto_pregunta}`}
                                onClick={() => abrirEdicion(q)}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Editar
                              </Button>
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
                        {!loading && preguntasDeLaEncuesta.length === 0 && (
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
            </>
          )}
        </main>
      </div>

      {dialogoPregunta && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-dialogo-pregunta"
            className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
          >
            <button
              type="button"
              onClick={cerrarDialogo}
              aria-label="Cerrar"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 id="titulo-dialogo-pregunta" className="text-xl font-semibold text-gray-900 mb-1">
              {editandoId === null ? 'Agregar pregunta' : 'Editar pregunta'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Esta pregunta queda en {encuestaActiva?.nombre}.
            </p>
            {error && (
              <p role="alert" className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                {error}
              </p>
            )}
            <form onSubmit={editandoId === null ? handleCreate : handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="encuesta-tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  id="encuesta-tipo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.tipo_pregunta}
                  onChange={(e) => setForm({ ...form, tipo_pregunta: e.target.value })}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Orden de la pregunta"
                type="number"
                min={1}
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: Number(e.target.value) || 1 })}
                required
              />
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
                  label="Descripción de la pregunta"
                  value={form.descripcion || ''}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="encuesta-carrera" className="block text-sm font-medium text-gray-700 mb-1">Carrera (opcional)</label>
                <select
                  id="encuesta-carrera"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.id_carrera ?? ''}
                  onChange={(e) => setForm({ ...form, id_carrera: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">General (todas las carreras)</option>
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <label htmlFor="encuesta-obligatoria" className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  id="encuesta-obligatoria"
                  type="checkbox"
                  checked={!!form.obligatoria}
                  onChange={(e) => setForm({ ...form, obligatoria: e.target.checked })}
                />
                <span>Pregunta obligatoria</span>
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cerrarDialogo}>Cancelar</Button>
                <Button type="submit" disabled={saving || loading}>
                  {saving ? 'Guardando…' : editandoId === null ? 'Guardar pregunta' : 'Guardar cambios de la pregunta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
